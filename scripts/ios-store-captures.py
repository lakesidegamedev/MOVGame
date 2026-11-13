#!/usr/bin/env python3
"""App Store screenshots at the sizes App Store Connect requires.

Reuses the reviewed simulator binary on the largest iPhone (6.9 inch) and the
largest iPad (13 inch), with a clean status bar, and copies the chosen screens
into one folder per device, numbered in listing order.
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

app = pathlib.Path(sys.argv[1]).resolve()
output = pathlib.Path(sys.argv[2]).resolve()
output.mkdir(parents=True, exist_ok=True)
SCREENS = ['launch', 'library', 'campaign', 'world-in', 'world-de', 'world-jp', 'reveal',
           'world-reveal-mx', 'results', 'world-results-jp', 'briefing-in', 'setup', 'store-priced']
# (label, simulator names to try in order, accepted portrait pixel sizes)
DEVICES = [
    ('iphone-6.9', ['iPhone 17 Pro Max', 'iPhone 16 Pro Max'], {(1320, 2868), (1290, 2796)}),
    ('ipad-13', ['iPad Pro 13-inch (M5)', 'iPad Pro 13-inch (M4)'], {(2064, 2752), (2048, 2732)}),
]


def run(*args, timeout=120):
    print('Running:', ' '.join(args), flush=True)
    return subprocess.check_output(args, text=True, timeout=timeout).strip()


def size(path):
    info = run('sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(path))
    width = re.search(r'pixelWidth:\s*(\d+)', info)
    height = re.search(r'pixelHeight:\s*(\d+)', info)
    return int(width.group(1)), int(height.group(1))


types = json.loads(run('xcrun', 'simctl', 'list', 'devicetypes', '--json'))['devicetypes']
runtimes = json.loads(run('xcrun', 'simctl', 'list', 'runtimes', '--json'))['runtimes']
runtime = next(r for r in runtimes if r['isAvailable'] and r['identifier'].startswith('com.apple.CoreSimulator.SimRuntime.iOS-26'))['identifier']
failures = []
for label, names, sizes in DEVICES:
    device_type = next((t for name in names for t in types if t['name'] == name), None)
    if not device_type:
        failures.append(f'{label}: none of {names} is available')
        continue
    device = run('xcrun', 'simctl', 'create', f'MOV {label}', device_type['identifier'], runtime)
    raw = output / f'{label}-raw'
    try:
        run('xcrun', 'simctl', 'boot', device)
        run('xcrun', 'simctl', 'bootstatus', device, '-b', timeout=300)
        run('xcrun', 'simctl', 'status_bar', device, 'override', '--time', '9:41', '--dataNetwork', 'wifi',
            '--wifiMode', 'active', '--wifiBars', '3', '--cellularMode', 'active', '--cellularBars', '4',
            '--batteryState', 'charged', '--batteryLevel', '100')
        env = dict(os.environ, SIMULATOR_UDID=device, MOV_CAPTURE_SCREENS='1', MOV_CAPTURE_NAMES=','.join(SCREENS))
        env.pop('MOV_CAPTURE_LARGE_TEXT', None)
        result = subprocess.run([sys.executable, str(pathlib.Path(__file__).with_name('ios-launch-smoke.py')), str(app), str(raw)],
                                env=env, timeout=1500)
        if result.returncode:
            failures.append(f'{label}: capture run exited {result.returncode}')
        final = output / label
        final.mkdir(exist_ok=True)
        for number, name in enumerate(SCREENS, start=1):
            source = raw / f'{name}.png'
            if not source.is_file():
                failures.append(f'{label}: {name} missing')
                continue
            width, height = size(source)
            if (width, height) not in sizes:
                failures.append(f'{label}: {name} is {width}x{height}, expected one of {sorted(sizes)}')
                continue
            shutil.copy(source, final / f'{number:02d}-{name}.png')
            print(f'PASS: {label} {name} {width}x{height}', flush=True)
    finally:
        subprocess.run(['xcrun', 'simctl', 'shutdown', device], timeout=60, check=False)
        subprocess.run(['xcrun', 'simctl', 'delete', device], timeout=60, check=False)
if failures:
    raise SystemExit('FAIL:\n' + '\n'.join(failures))
