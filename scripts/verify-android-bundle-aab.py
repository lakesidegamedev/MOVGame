#!/usr/bin/env python3
"""Check a release Android App Bundle: campaign content is inside it and, when
signing is required, the bundle carries a signature."""
import hashlib
import pathlib
import sys
import zipfile

if len(sys.argv) != 3:
    raise SystemExit('usage: verify-android-bundle-aab.py <bundle.aab> <true|false signed>')
aab, signed = sys.argv[1], sys.argv[2] == 'true'
source = pathlib.Path(__file__).resolve().parents[1] / 'apps/native/shared/src/commonMain/resources/bundles'
files = sorted(source.rglob('*.json'))
if not files:
    raise SystemExit('FAIL: no source campaign bundles found')
errors = []
with zipfile.ZipFile(aab) as bundle:
    names = set(bundle.namelist())
    if 'base/manifest/AndroidManifest.xml' not in names:
        errors.append('Missing base manifest')
    # The shared classloader reads these from the base module's root resources.
    for content in files:
        rel = content.relative_to(source).as_posix()
        hits = [n for n in (f'base/root/bundles/{rel}', f'base/assets/bundles/{rel}') if n in names]
        if not hits:
            errors.append(f'Missing bundles/{rel}')
        elif hashlib.sha256(bundle.read(hits[0])).digest() != hashlib.sha256(content.read_bytes()).digest():
            errors.append(f'Content differs: bundles/{rel}')
    signature = [n for n in names if n.startswith('META-INF/') and n.endswith(('.RSA', '.DSA', '.EC'))]
    if signed and not signature:
        errors.append('The bundle is not signed')
    if not signed and signature:
        print('note: bundle is signed although signing was not required')
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(files)} campaign resources present in the bundle; signed={bool(signature)}')
