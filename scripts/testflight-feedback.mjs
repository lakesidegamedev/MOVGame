import { findApp, list } from './app-store-connect.mjs';

const appId = await findApp(process.env.IOS_BUNDLE_ID || 'com.lakesidegames.electioneer');

for (const [label, resource] of [
  ['crash', 'betaFeedbackCrashSubmissions'],
  ['screenshot', 'betaFeedbackScreenshotSubmissions'],
]) {
  const items = await list(`/v1/apps/${appId}/${resource}?limit=200`);
  console.log(`${label} submissions: ${items.length}`);
  for (const item of items) {
    const a = item.attributes || {};
    const result = {
      id: item.id,
      submitted: a.timestamp || a.createdDate || null,
      device: a.deviceModel || null,
      os: a.osVersion || null,
      buildId: item.relationships?.build?.data?.id || null,
      comment: a.comment || null,
    };
    console.log(JSON.stringify(result));
  }
}
