import { setTimeout as sleep } from 'node:timers/promises';
import { findApp, list } from './app-store-connect.mjs';

const { IOS_BUNDLE_ID, IOS_BUILD_NUMBER, IOS_DISTRIBUTION } = process.env;
if (!IOS_BUNDLE_ID || !/^\d+$/.test(IOS_BUILD_NUMBER ?? '') || !['internal', 'app-store'].includes(IOS_DISTRIBUTION)) {
  throw new Error('The bundle identifier, exported build number, and distribution are required');
}

const audience = IOS_DISTRIBUTION === 'app-store' ? 'APP_STORE_ELIGIBLE' : 'INTERNAL_ONLY';
const appId = await findApp(IOS_BUNDLE_ID);
const query = new URLSearchParams({
  'filter[app]': appId,
  'filter[version]': IOS_BUILD_NUMBER,
  'filter[preReleaseVersion.platform]': 'IOS',
  'fields[builds]': 'version,processingState,buildAudienceType,expired',
  limit: '2',
});
const deadline = Date.now() + 35 * 60_000;

while (Date.now() < deadline) {
  const builds = await list(`/v1/builds?${query}`).catch((error) => {
    if (error.status !== 429 && !(error.status >= 500) && !['TimeoutError', 'TypeError'].includes(error.name)) throw error;
    console.log(error.message);
    return [];
  });
  if (builds.length > 1) throw new Error(`Multiple iOS builds match build number ${IOS_BUILD_NUMBER}`);
  const build = builds[0]?.attributes;
  console.log(`iOS build ${IOS_BUILD_NUMBER}: ${build?.processingState ?? 'waiting to appear'}`);
  if (build?.expired || ['FAILED', 'INVALID'].includes(build?.processingState)) {
    throw new Error(`Apple reports an unusable build ${IOS_BUILD_NUMBER}`);
  }
  if (build?.processingState === 'VALID') {
    if (build.buildAudienceType !== audience) {
      throw new Error(`Expected ${audience}; App Store Connect reports ${build.buildAudienceType}`);
    }
    console.log(`Apple verified build ${IOS_BUILD_NUMBER} is valid with audience ${audience}.`);
    process.exit(0);
  }
  await sleep(30_000);
}
throw new Error(`Build ${IOS_BUILD_NUMBER} did not reach VALID within 35 minutes. Re-run the verification job to check the same upload.`);
