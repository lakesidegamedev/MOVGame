#!/usr/bin/env python3
"""Verify startup configuration in the manifest packaged inside the APK."""
import pathlib
import sys
import xml.etree.ElementTree as ET

android = '{http://schemas.android.com/apk/res/android}'
root = ET.parse(pathlib.Path(sys.argv[1])).getroot()
application = root.find('application')
if application is None:
    raise SystemExit('FAIL: packaged Android manifest has no application')
if application.get(android + 'name') != 'com.lakesidegames.electioneer.MovApp':
    raise SystemExit('FAIL: packaged Android app bypasses MovApp startup')
metadata = {node.get(android + 'name'): node.get(android + 'value')
            for node in application.findall('meta-data')}
# Content providers run before Application.onCreate and its optional DSN guard.
if metadata.get('io.sentry.auto-init') != 'false':
    raise SystemExit('FAIL: Sentry can initialize before MovApp supplies a DSN')
print('PASS: packaged Android startup leaves Sentry initialization to MovApp')
# Reserved Lakeside sign-in return (net.lakesidegames.mov:/auth/callback):
# a browsable VIEW filter on the scheme, never auto-verified.
returns = [f for activity in application.findall('activity') for f in activity.findall('intent-filter')
           if any(d.get(android + 'scheme') == 'net.lakesidegames.mov' for d in f.findall('data'))]
if len(returns) != 1:
    raise SystemExit('FAIL: the net.lakesidegames.mov sign-in return scheme is not registered once')
names = {n.get(android + 'name') for n in returns[0].findall('action') + returns[0].findall('category')}
if not {'android.intent.action.VIEW', 'android.intent.category.BROWSABLE', 'android.intent.category.DEFAULT'} <= names:
    raise SystemExit('FAIL: the sign-in return filter is not a browsable VIEW filter')
if returns[0].get(android + 'autoVerify') == 'true':
    raise SystemExit('FAIL: the sign-in return filter must not auto-verify')
print('PASS: the net.lakesidegames.mov sign-in return scheme is registered')
