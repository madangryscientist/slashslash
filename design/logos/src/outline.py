"""Turn a line of text into SVG path data, from the site's own variable fonts at a fixed instance.

Shaping is HarfBuzz (so kerning applies); outlines come from a static instance cut with
fontTools' instancer. Units: the returned path is in font units, y up; the caller scales it.
"""
import io
import os
from functools import lru_cache

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

# The site's own fonts, read from the repo: design/logos/src -> the repo root is three levels up.
FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "..", "apps", "site", "public", "fonts") + os.sep
# Bricolage Grotesque draws only the retired direction A boards; the site no longer ships it.
DESIGN_FONTS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "fonts") + os.sep
FACES = {
    "bricolage": DESIGN_FONTS + "bricolage-grotesque-latin-opsz-wght-subset.woff2",
    "mono": FONTS + "jetbrains-mono-latin-wght-subset.woff2",
    "inter": FONTS + "inter-latin-wght-normal.woff2",
}


@lru_cache(None)
def _face(name, axes):
    path = FACES[name]
    static = instancer.instantiateVariableFont(TTFont(path), dict(axes))
    # HarfBuzz does not read WOFF2: hand it the decompressed sfnt.
    raw = TTFont(path)
    raw.flavor = None
    data = io.BytesIO()
    raw.save(data)
    font = hb.Font(hb.Face(hb.Blob(data.getvalue())))
    font.set_variations(dict(axes))
    return static, font


def text_path(text, face="bricolage", axes=(("wght", 800), ("opsz", 96)), size=64, x=0, y=0):
    """SVG path data for `text` with its baseline at (x, y), `size` px per em. Returns (d, width)."""
    static, font = _face(face, tuple(axes))
    upm = static["head"].unitsPerEm
    buf = hb.Buffer()
    buf.add_str(text)
    buf.guess_segment_properties()
    hb.shape(font, buf, {"kern": True, "liga": False})
    gs = static.getGlyphSet()
    order = static.getGlyphOrder()
    pen = SVGPathPen(gs)
    s = size / upm
    pen_x = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        name = order[info.codepoint]
        t = TransformPen(pen, (s, 0, 0, -s, x + (pen_x + pos.x_offset) * s, y - pos.y_offset * s))
        gs[name].draw(t)
        pen_x += pos.x_advance
    return pen.getCommands(), pen_x * s
