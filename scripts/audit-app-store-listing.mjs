import { readFileSync } from 'node:fs';
import { findApp, list, read } from './app-store-connect.mjs';

const { IOS_BUNDLE_ID, IOS_MARKETING_VERSION } = process.env;
if (!IOS_BUNDLE_ID || !/^\d+(\.\d+){1,2}$/.test(IOS_MARKETING_VERSION ?? '')) {
  throw new Error('Bundle ID and iOS marketing version are required');
}

const docs = readFileSync(new URL('../apps/native/docs/ios-app-store.md', import.meta.url), 'utf8');
const fields = Object.fromEntries(
  [...docs.matchAll(/^- \*\*(.+?)\*\* (.+)$/gm)].map(([, name, value]) => [name, value]),
);
const description = docs.split('### Description\n')[1]?.split('\n### ')[0];
const normalize = (value) => value?.trim().replace(/\s+/g, ' ');
const check = (actual, expected) => ({
  present: Boolean(normalize(actual)),
  matchesChecklist: Boolean(expected && normalize(actual) === normalize(expected)),
});

function checkURL(actual, expected) {
  const result = check(actual, expected);
  if (!result.present) return result;
  try {
    const url = new URL(actual);
    if (url.protocol !== 'https:' || url.username || url.password) return result;
    const legal = url.searchParams.get('legal') === 'privacy' ? '?legal=privacy' : '';
    return { ...result, publicURL: `${url.origin}${url.pathname}${legal}` };
  } catch {
    return result;
  }
}

async function optionalResource(path) {
  try {
    return { item: (await read(path)).data, status: 'accessible' };
  } catch (error) {
    if (![403, 404].includes(error.status)) throw error;
    return { item: null, status: error.status === 403 ? 'access denied' : 'not found' };
  }
}

const appId = await findApp(IOS_BUNDLE_ID);
const appPath = `/v1/apps/${appId}`;
const { data: app } = await read(`${appPath}?fields[apps]=primaryLocale`);
const locale = app.attributes.primaryLocale;
const versionQuery = new URLSearchParams({
  'filter[platform]': 'IOS',
  'filter[versionString]': IOS_MARKETING_VERSION,
});
const versions = await list(`${appPath}/appStoreVersions?${versionQuery}`);
if (versions.length !== 1) throw new Error(`Expected one iOS draft for version ${IOS_MARKETING_VERSION}`);
const version = versions[0];
const versionPath = `/v1/appStoreVersions/${version.id}`;
const [appInfos, localizations, build, review] = await Promise.all([
  list(`${appPath}/appInfos`),
  list(`${versionPath}/appStoreVersionLocalizations`),
  optionalResource(`${versionPath}/build?fields[builds]=version,processingState,buildAudienceType`),
  optionalResource(`${versionPath}/appStoreReviewDetail?fields[appStoreReviewDetails]=demoAccountRequired,demoAccountName,demoAccountPassword,contactFirstName,contactLastName,contactEmail,contactPhone,notes`),
]);
const appInfoReports = await Promise.all(appInfos.map(async (info) => {
  const infoPath = `/v1/appInfos/${info.id}`;
  const [languages, ...categories] = await Promise.all([
    list(`${infoPath}/appInfoLocalizations`),
    ...['primaryCategory', 'primarySubcategoryOne', 'primarySubcategoryTwo']
      .map((key) => optionalResource(`${infoPath}/${key}`)),
  ]);
  const text = languages.find((row) => row.attributes.locale === locale)?.attributes ?? {};
  return {
    state: info.attributes.state ?? info.attributes.appStoreState,
    rating: info.attributes.appStoreAgeRating ?? null,
    primaryCategory: categories[0].item?.id ?? categories[0].status,
    subcategories: categories.slice(1).map(({ item, status }) => item?.id ?? status),
    name: check(text.name, fields.Name),
    subtitle: check(text.subtitle, fields.Subtitle),
    privacyURL: checkURL(text.privacyPolicyUrl, fields['Privacy policy URL']),
  };
}));
const listing = localizations.find((row) => row.attributes.locale === locale);
const text = listing?.attributes ?? {};
const sets = listing ? await list(`/v1/appStoreVersionLocalizations/${listing.id}/appScreenshotSets`) : [];
const screenshots = await Promise.all(sets.map(async (set) => {
  const images = await list(`/v1/appScreenshotSets/${set.id}/appScreenshots?fields[appScreenshots]=assetDeliveryState,sourceFileChecksum`);
  return {
    display: set.attributes.screenshotDisplayType,
    count: images.length,
    complete: images.filter((image) => image.attributes.assetDeliveryState?.state === 'COMPLETE').length,
    checksums: images.map((image) => image.attributes.sourceFileChecksum)
      .filter((checksum) => /^[a-fA-F0-9]+$/.test(checksum ?? '')),
  };
}));
const reviewInfo = review.item?.attributes;
console.log(JSON.stringify({
  version: IOS_MARKETING_VERSION,
  state: version.attributes.appVersionState ?? version.attributes.appStoreState,
  releaseType: version.attributes.releaseType,
  locale,
  appInfo: appInfoReports,
  listing: {
    description: check(text.description, description),
    keywords: check(text.keywords, fields.Keywords),
    marketingURL: checkURL(text.marketingUrl, fields['Marketing URL']),
    supportURL: checkURL(text.supportUrl, fields['Support URL']),
    copyrightPresent: Boolean(version.attributes.copyright?.trim()),
    screenshots,
  },
  build: { status: build.status, ...build.item?.attributes },
  review: {
    status: review.status,
    demoRequired: reviewInfo?.demoAccountRequired,
    demoNamePresent: Boolean(reviewInfo?.demoAccountName?.trim()),
    demoPasswordPresent: Boolean(reviewInfo?.demoAccountPassword?.trim()),
    contactComplete: ['contactFirstName', 'contactLastName', 'contactEmail', 'contactPhone']
      .every((key) => Boolean(reviewInfo?.[key]?.trim())),
    notesPresent: Boolean(reviewInfo?.notes?.trim()),
    notesMentionFreeAccess: /free access|free.to.play|all elections are open/i.test(reviewInfo?.notes ?? ''),
    notesCoverStoreKit: /storekit|restore purchases|in-app purchases/i.test(reviewInfo?.notes ?? ''),
    notesCoverSignIn: /lakeside|sign.in|login/i.test(reviewInfo?.notes ?? ''),
  },
}, null, 2));
