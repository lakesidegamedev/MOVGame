"""Rebuilds src/ui/fonts/mov-flags.woff2: a colour flag font holding only the flags the game uses.

Source font: "Twemoji Country Flags" (a subset of Twemoji Mozilla), file TwemojiCountryFlags.woff2 from the
npm package country-flag-emoji-polyfill 0.1.8. Needs fonttools and brotli (pip install fonttools brotli).

Usage: python3 -I scripts/subset-flag-font.py TwemojiCountryFlags.woff2 src/ui/fonts/mov-flags.woff2 \
         $(node -e 'console.log(...)')   (one argument per flag emoji, e.g. 🇺🇸 🇬🇧 ...)

The ligature table is trimmed to the requested pairs first, otherwise the glyph closure keeps every flag.
"""
import sys
from fontTools.ttLib import TTFont
from fontTools.subset import Subsetter, Options

src, out, flags = sys.argv[1], sys.argv[2], sys.argv[3:]
f = TTFont(src)
cmap = f.getBestCmap()
wanted = {tuple(cmap[ord(c)] for c in fl) for fl in flags}
gsub = f['GSUB'].table
for lookup in gsub.LookupList.Lookup:
    for st in lookup.SubTable:
        if hasattr(st, 'ExtSubTable'):
            st = st.ExtSubTable
        if not hasattr(st, 'ligatures'):
            continue
        for first, ligs in list(st.ligatures.items()):
            keep = [l for l in ligs if (first, *l.Component) in wanted]
            if keep:
                st.ligatures[first] = keep
            else:
                del st.ligatures[first]
opts = Options()
opts.layout_features = ['*']
opts.hinting = False
opts.desubroutinize = True
opts.notdef_outline = True
opts.flavor = 'woff2'
opts.name_IDs = ['*']
opts.drop_tables += ['FFTM']
s = Subsetter(opts)
s.populate(text=''.join(flags))
s.subset(f)
f.flavor = 'woff2'
f.save(out)
