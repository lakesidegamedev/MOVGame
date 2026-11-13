#!/usr/bin/env python3
"""Copy leader photos and party logos into the apps' content bundle.

    python3 apps/native/scripts/export-art.py

Run after `npm run native:content`, which writes bundles/art.json from the
web's portrait and logo tables. This writes every file art.json names into
bundles/art/: portraits shrunk from the web's 256 px squares to 112 px (the
apps show them at 56 points or less), logos copied as they are (already
small). Files art.json no longer names are deleted. Needs Pillow.
"""

import io
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[3]
BUNDLES = ROOT / "apps/native/shared/src/commonMain/resources/bundles"
OUT = BUNDLES / "art"
PORTRAIT_PX = 112


def main() -> None:
    art = json.loads((BUNDLES / "art.json").read_text())
    OUT.mkdir(exist_ok=True)
    wanted = set()
    for name in sorted(set(art["portraits"].values())):
        wanted.add(name)
        img = Image.open(ROOT / "public/images/portraits" / name).convert("RGB")
        img = img.resize((PORTRAIT_PX, PORTRAIT_PX), Image.LANCZOS)
        buf = io.BytesIO()
        img.save(buf, "WEBP", quality=78, method=6)
        target = OUT / name
        if not target.exists() or target.read_bytes() != buf.getvalue():
            target.write_bytes(buf.getvalue())
    for name in sorted({row["file"] for row in art["logos"]}):
        wanted.add(name)
        data = (ROOT / "public/images/logos" / name).read_bytes()
        target = OUT / name
        if not target.exists() or target.read_bytes() != data:
            target.write_bytes(data)
    for f in OUT.glob("*"):
        if f.name not in wanted:
            f.unlink()
    total = sum((OUT / n).stat().st_size for n in wanted)
    print(f"{len(wanted)} files, {total} bytes in {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
