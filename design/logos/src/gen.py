"""Logo drafts: three directions for the Slash suite mark and its four tool marks.

Run from the repo root:
  uvx --with brotli==1.2.1 --with uharfbuzz==0.57.0 --from fonttools==4.68.0 python design/logos/src/gen.py
Writes SVGs under ../out (gitignored): a-cut, b-pixel, c-glyph, and a board + OG drafts per direction under ../out/boards.
Direction C is the one the suite ships: its six marks and twelve lockups also go to apps/site/public/brand/ (tracked).
Every mark is hand-placed geometry (no tracing); wordmarks are the site's own fonts, outlined (outline.py).
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from outline import text_path  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "out")
# The site's brand folder: the direction C files the site serves, tracked in git.
BRAND = os.path.join(HERE, "..", "..", "..", "apps", "site", "public", "brand")

# ---------------------------------------------------------------- colour
THEME = {
    "light": {"bg": "#eff1f5", "panel": "#ffffff", "ink": "#24273a", "mute": "#5c5f77", "rule": "#ccd0da"},
    "dark": {"bg": "#11111b", "panel": "#1e1e2e", "ink": "#e2e8fc", "mute": "#c6cce2", "rule": "#313244"},
}
# Slash Day and Slash Night (Jacobus, 2026-11-15). `light` is the deep fill for marks on light, `dark` the pastel
# for marks on dark. `text` is the deep text tone for links, labels and wordmark letters on light: each measures
# at least 4.5:1 on #eef2f9 and on #ffffff. The dark wordmark letters use `dark`, which measures 8.7:1 or more on #0d1326.
ACCENT = {
    "suite": {"light": "#c94f08", "text": "#a03604", "dark": "#fab387"},
    "pixel": {"light": "#8839ef", "text": "#8839ef", "dark": "#cba6f7"},
    "flake": {"light": "#0a7ea8", "text": "#086c90", "dark": "#89dceb"},
    "toggle": {"light": "#2d7d1d", "text": "#286f1a", "dark": "#a6e3a1"},
    "bundle": {"light": "#9a5b00", "text": "#9a5b00", "dark": "#f9e2af"},
    "task": {"light": "#1e66f5", "text": "#1a5fe6", "dark": "#89b4fa"},
}
TOOLS = ["pixel", "flake", "toggle", "bundle"]
# TaskSlash (Jacobus, 2026-11-15) is drawn in Direction C only, the direction he picked.
C_TOOLS = [*TOOLS, "task"]
NAME = {"suite": "slashslash", "pixel": "PixelSlash", "flake": "FlakeSlash", "toggle": "ToggleSlash", "bundle": "BundleSlash", "task": "TaskSlash"}
TILE = "#181825"  # Mocha mantle: the pixel tiles carry their own ground in both themes


def fmt(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def poly(points, cls):
    return f'<polygon points="{" ".join(f"{fmt(x)},{fmt(y)}" for x, y in points)}" class="{cls}"/>'


def write(path, body, root=OUT):
    full = os.path.join(root, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w") as f:
        f.write(body)


def style_auto(accent, ink=True):
    """The favicon trick: light fills, dark fills under prefers-color-scheme, so the tab icon follows the theme.
    `ink` is for marks that draw in the ink (Direction A); Direction C marks draw in the accent only."""
    a = ACCENT[accent]
    i_light = f".i{{fill:{THEME['light']['ink']}}}" if ink else ""
    i_dark = f".i{{fill:{THEME['dark']['ink']}}}" if ink else ""
    return (
        f"<style>{i_light}.a{{fill:{a['light']}}}"
        f"@media(prefers-color-scheme:dark){{{i_dark}.a{{fill:{a['dark']}}}}}</style>"
    )


def style_fixed(accent, theme):
    a = ACCENT[accent]
    t = THEME[theme]
    text = a["text"] if theme == "light" else a["dark"]
    # `.m` is the suite's `.build` only; no other lockup has a mute.
    mute = f".m{{fill:{t['mute']}}}" if accent == "suite" else ""
    return f"<style>.i{{fill:{t['ink']}}}.a{{fill:{a[theme]}}}{mute}.t{{fill:{text}}}</style>"


# ================================================================ Direction A: the cut slash
# The suite mark as it was before direction C (the old public/favicon.svg, since removed): a slash, then a second slash with a piece cut out of it.
# Each tool keeps the first slash and redraws the second one in its own way and colour.
def sx(x0, y):
    """x of a slash's left edge at height y; the slash leans 30 across over 84 up, as today's mark."""
    return x0 + 30 * (92 - y) / 84


def slash_seg(x0, w, y_bot, y_top, cls):
    return poly([(sx(x0, y_bot), y_bot), (sx(x0, y_bot) + w, y_bot), (sx(x0, y_top) + w, y_top), (sx(x0, y_top), y_top)], cls)


def a_mark(tool):
    first = slash_seg(10, 20, 92, 8, "i")
    if tool == "suite":  # today's mark, unchanged
        second = slash_seg(40, 20, 92, 46, "a") + slash_seg(40, 20, 38, 8, "a")
    elif tool == "pixel":  # the second slash in whole steps, one step missing
        steps = []
        for k in range(7):
            yb, yt = 92 - 12 * k, 80 - 12 * k
            if k == 4:
                continue
            xc = sx(40, (yb + yt) / 2)
            steps.append(f'<rect x="{fmt(xc)}" y="{yt}" width="20" height="12" class="a"/>')
        second = "".join(steps)
    elif tool == "flake":  # it passes, fails, passes: three pieces, two cuts
        second = slash_seg(40, 20, 92, 68, "a") + slash_seg(40, 20, 60, 36, "a") + slash_seg(40, 20, 28, 8, "a")
    elif tool == "toggle":  # a rail with a round knob on it, thrown to the top: a switch
        cx = sx(46, 26) + 4
        second = slash_seg(44, 12, 92, 8, "a") + f'<circle cx="{fmt(cx)}" cy="26" r="15" class="a"/>'
    elif tool == "bundle":  # three strands bound into one slash, cut where the suite's is
        second = "".join(
            slash_seg(40 + off, 5, 92, 46, "a") + slash_seg(40 + off, 5, 38, 8, "a") for off in (0, 7.5, 15)
        )
    return first + second


def a_word(tool, h=64):
    """Today's lockup: the name in Bricolage Grotesque 800 at 64 on a 70 baseline; the suite adds `.build` in mono."""
    if tool == "suite":
        d, w = text_path("slashslash", size=64, x=118, y=70)
        d2, w2 = text_path(".build", face="mono", axes=(("wght", 500),), size=44, x=118 + w + 10, y=70)
        return f'<path class="i" d="{d}"/><path class="a" d="{d2}"/>', 118 + w + 10 + w2 + 10
    d, w = text_path(NAME[tool].lower(), size=64, x=118, y=70)
    return f'<path class="i" d="{d}"/>', 118 + w + 10


# ================================================================ Direction B: pixel
# PixelSlash's own pixel art becomes the suite's: Hack Cove letterforms on a 16-row grid.
# P, I, X, E, L, S, A, H are lifted verbatim from apps/site/src/pixelslash/components/logo.tsx;
# the rest are drawn here to the same rules (3-pixel stems, chamfered corners, tapered ends).
GLYPHS = {
    "P": ".#######.. .########. .###...### .###...### .###...### .###...### .###...### #########. ########.. .###...... .###...... .###...... .###...... .###...... .###...... .###......",
    "I": "#.. ##. ### ### ### ### ### ### ### ### ### ### ### ### ##. #..",
    "X": "#.......# ##.....## ###...### ###...### .###.###. .###.###. ..#####.. ...###... ...###... ..#####.. .###.###. .###.###. ###...### ###...### ##.....## #.......#",
    "E": "..####### .######## ###...### ###...##. ###...#.. ###...... ###...... ########. #######.. ###...... ###...#.. ###...##. ###...### ###...### ########. #######..",
    "L": "..#...... .##...... ###...... ###...... ###...... ###...... ###...... ###...... ###...... ###...... ###...#.. ###...##. ###...### ###...### ########. #######..",
    "S": "..####### .######## ###...### ###...##. ###...#.. ###...... ###...... ########. .######## ......### ......### ..#...### .##...### ###...### ########. #######..",
    "A": "...###### ..####### .###...## .###...## .###...## .###...## .###...## ######### ######### .###...## .###...## .###...## .###...## .###...## .###...## .###...#.",
    "H": "...#...#... ..##...##.. .###...###. .###...###. .###...###. .###...###. .###...###. ########### ##########. .###...###. .###...###. .###...###. .###...###. .###...###. .###...##.. .###...#...",
    # drawn for the logo drafts
    "F": "..####### .######## ###...### ###...##. ###...#.. ###...... ###...... ########. #######.. ###...... ###...... ###...... ###...... ###...... ##....... #........",
    "K": "..#...### .##...### ###..###. ###..###. ###.###.. ###.###.. ######... #####.... #####.... ######... ###.###.. ###.###.. ###..###. ###..###. ###...### ###...###",
    "T": "######### ######### ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...###... ...##.... ...#.....",
    "O": "..####### .######## ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ########. #######..",
    "G": "..####### .######## ###...### ###...##. ###...#.. ###...... ###...... ###..#### ###..#### ###...### ###...### ###...### ###...### ###...### ########. #######..",
    "B": ".#######.. .########. .###...### .###...### .###...### .###...### .###...### #########. #########. .###...### .###...### .###...### .###...### .###...### .########. .#######..",
    "U": "..#...#.. .##...##. ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ###...### ########. #######..",
    "N": "###...#.. ###...##. ####..### ####..### #####.### #####.### ###.#.### ###.##### ###.##### ###..#### ###..#### ###...### ###...### ###...### ##....### #.....###",
    "D": ".#######.. .########. .###...### .###...### .###...### .###...### .###...### .###...### .###...### .###...### .###...### .###...### .###...### .###...### .########. .#######..",
}
# The slash from the PixelSlash wordmark, columns 0..8.
PSLASH = [(7, 2), (7, 2), (6, 3), (6, 3), (5, 3), (5, 3), (4, 3), (4, 3), (3, 3), (3, 3), (2, 3), (2, 3), (1, 3), (1, 3), (0, 3), (0, 3)]


def runs(rows, ox=0, oy=0, skip_rows=()):
    out = []
    for y, row in enumerate(rows):
        if y in skip_rows:
            continue
        x = 0
        while x < len(row):
            if row[x] == "#":
                s = x
                while x < len(row) and row[x] == "#":
                    x += 1
                out.append(f"M{ox + s} {oy + y}h{x - s}v1h-{x - s}z")
            else:
                x += 1
    return "".join(out)


def pslash(ox, oy=0, skip_rows=()):
    return "".join(f"M{ox + x} {oy + y}h{w}v1h-{w}z" for y, (x, w) in enumerate(PSLASH) if y not in skip_rows)


def pixel_word(word):
    """`FLAKE/SLASH` in pixels: letters 1 apart, the slash with a column either side. Returns (letters d, slash d, width)."""
    first, second = word.split("/")
    x, letters = 0, []
    for ch in first:
        rows = GLYPHS[ch].split()
        letters.append(runs(rows, x))
        x += len(rows[0]) + 1
    slash = pslash(x + 1)
    x += 1 + 9 + 1
    for ch in second:
        rows = GLYPHS[ch].split()
        letters.append(runs(rows, x))
        x += len(rows[0]) + 1
    return "".join(letters), slash, x - 1


def b_tile(tool):
    """The PixelSlash square (P/S on a mantle tile) for every tool: its letter, the suite's slash, S."""
    if tool == "suite":
        # Two slashes; the second is the suite's colour and has the cut, as in Direction A.
        art = f'<path fill="#cdd6f4" d="{pslash(6)}"/><path class="a" d="{pslash(16, skip_rows=(7, 8))}"/>'
    else:
        letter = {"pixel": "P", "flake": "F", "toggle": "T", "bundle": "B"}[tool]
        rows = GLYPHS[letter].split()
        lx = 0 if len(rows[0]) == 10 else 1
        art = (
            f'<path class="a" d="{runs(rows, lx)}"/>'
            f'<path class="s" d="{pslash(11)}"/>'
            f'<path class="a" d="{runs(GLYPHS["S"].split(), 21)}"/>'
        )
    # A hairline (Mocha surface0) so the tile still has an edge on a dark page.
    return f'<rect x="-2.75" y="-7.75" width="35.5" height="35.5" rx="5" fill="{TILE}" stroke="#313244" stroke-width="0.5"/>{art}'


def b_tile_style(tool):
    # The tile is always dark, so it takes the dark accents in both themes (as PixelSlash's does today).
    return f"<style>.a{{fill:{ACCENT[tool]['dark']}}}.s{{fill:{ACCENT['suite']['dark']}}}</style>"


def b_word(tool):
    word = {"suite": "SLASH/SLASH", "pixel": "PIXEL/SLASH", "flake": "FLAKE/SLASH", "toggle": "TOGGLE/SLASH", "bundle": "BUNDLE/SLASH"}[tool]
    return pixel_word(word)


# ================================================================ Direction C: glyph and cut
# One cut, the suite's slash, runs through a simple picture of what each tool does.
def c_cut(cx, w=11):
    """A slash-shaped gap through the whole 100 box, centred on cx at mid-height."""
    def x(y):
        return cx - w / 2 + 30 * (50 - y) / 84
    return f'<polygon points="{fmt(x(110))},110 {fmt(x(110) + w)},110 {fmt(x(-10) + w)},-10 {fmt(x(-10))},-10" fill="#000"/>'


def c_mark(tool, uid):
    cuts = c_cut(50)
    if tool == "suite":
        shape = '<rect x="8" y="14" width="84" height="72" rx="14"/>'
        cuts = c_cut(36) + c_cut(64)
    elif tool == "pixel":
        # A 3 x 3 grid with the slash taken out as whole pixels: no cut, so no slivers.
        gone = {(0, 2), (1, 1), (2, 0)}
        shape = "".join(
            f'<rect x="{8 + c * 29}" y="{8 + r * 29}" width="26" height="26" rx="3"/>'
            for r in range(3) for c in range(3) if (r, c) not in gone
        )
        cuts = ""
    elif tool == "flake":
        shape = (
            '<g stroke-width="14" stroke-linecap="round" stroke="#fff">'
            '<line x1="12" y1="50" x2="88" y2="50"/>'
            '<line x1="31" y1="17.09" x2="69" y2="82.91"/>'
            '<line x1="31" y1="82.91" x2="69" y2="17.09"/></g>'
        )
    elif tool == "toggle":
        shape = (
            '<rect x="11" y="27" width="78" height="46" rx="23" fill="none" stroke="#fff" stroke-width="10"/>'
            '<circle cx="66" cy="50" r="13"/>'
        )
    elif tool == "bundle":
        shape = "".join(f'<rect x="12" y="{y}" width="76" height="20" rx="5"/>' for y in (14, 40, 66))
    elif tool == "task":  # a ticked checkbox where the suite's slash is the tick's long stroke
        def x(y):
            return 46 + 30 * (84 - y) / 84
        shape = '<rect x="8" y="8" width="84" height="84" rx="20"/>'
        # The slash cut starts at the tick's corner (y 84) and runs out through the top edge;
        # a short stroke, knocked out too, meets it at the corner.
        cuts = (
            f'<polygon points="{fmt(x(84))},84 {fmt(x(84) + 12)},84 {fmt(x(-10) + 12)},-10 {fmt(x(-10))},-10" fill="#000"/>'
            '<polyline points="24,54 50,80" fill="none" stroke="#000" stroke-width="12" stroke-linecap="round"/>'
        )
    return (
        f'<mask id="m{uid}" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">'
        f'<g fill="#fff">{shape}</g>{cuts}</mask>'
        f'<rect width="100" height="100" class="a" mask="url(#m{uid})"/>'
    )


def c_word(tool):
    """JetBrains Mono 700: the first half in ink, `slash` in the tool's text tone (class `t`); the suite adds `.build`."""
    first = {"suite": "slash", "pixel": "pixel", "flake": "flake", "toggle": "toggle", "bundle": "bundle", "task": "task"}[tool]
    d1, w1 = text_path(first, face="mono", axes=(("wght", 700),), size=60, x=122, y=70)
    d2, w2 = text_path("slash", face="mono", axes=(("wght", 700),), size=60, x=122 + w1, y=70)
    body = f'<path class="i" d="{d1}"/><path class="t" d="{d2}"/>'
    end = 122 + w1 + w2
    if tool == "suite":
        d3, w3 = text_path(".build", face="mono", axes=(("wght", 400),), size=60, x=end, y=70)
        body += f'<path class="m" d="{d3}"/>'
        end += w3
    return body, end + 10


# ================================================================ files
def svg(viewbox, body, w=None, h=None, label=None):
    size = f' width="{w}" height="{h}"' if w else ""
    role = f' role="img" aria-label="{label}"' if label else ""
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{viewbox}"{size}{role}>{body}</svg>\n'


def build():
    marks = {}  # direction -> tool -> (mark svg body fn(theme), viewBox, lockup fn(theme) -> (body, viewBox))
    for tool in ["suite", *TOOLS]:
        slug = "slash" if tool == "suite" else NAME[tool].lower()
        # A
        write(f"a-cut/{slug}-mark.svg", svg("0 0 100 100", style_auto(tool) + f'<g transform="translate(0 2)">{a_mark(tool)}</g>', label=NAME[tool]))
        word, wide = a_word(tool)
        for th in ("light", "dark"):
            write(f"a-cut/{slug}-lockup-{th}.svg", svg(f"0 0 {fmt(wide)} 100", style_fixed(tool, th) + f'<g transform="translate(0 2)">{a_mark(tool)}</g>' + word, label=NAME[tool]))
        # B
        write(f"b-pixel/{slug}-tile.svg", svg("-3 -8 36 36", b_tile_style(tool) + b_tile(tool), label=NAME[tool]))
        L, S, W = b_word(tool)
        for th in ("light", "dark"):
            body = style_fixed(tool, th) + f'<path class="a" d="{L}"/><path fill="{ACCENT["suite"][th]}" d="{S}"/>'
            write(f"b-pixel/{slug}-wordmark-{th}.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 16" shape-rendering="crispEdges" role="img" aria-label="{NAME[tool]}">{body}</svg>\n')
    for tool in ["suite", *C_TOOLS]:
        slug = "slash" if tool == "suite" else NAME[tool].lower()
        # C: the drafts folder, and the site's brand folder (the files the site serves).
        mark = svg("0 0 100 100", style_auto(tool, ink=False) + c_mark(tool, slug), label=NAME[tool])
        write(f"c-glyph/{slug}-mark.svg", mark)
        write(f"{slug}-mark.svg", mark, root=BRAND)
        cw, cwide = c_word(tool)
        for th in ("light", "dark"):
            lockup = svg(f"0 0 {fmt(cwide)} 100", style_fixed(tool, th) + c_mark(tool, slug + th) + cw, label=NAME[tool])
            write(f"c-glyph/{slug}-lockup-{th}.svg", lockup)
            write(f"{slug}-lockup-{th}.svg", lockup, root=BRAND)


# ================================================================ boards
def embed(path, x, y, h, theme=None):
    """Inline an SVG file at (x, y), `h` tall, keeping its aspect; nested <svg> keeps its styles scoped by class prefix."""
    src = open(os.path.join(OUT, path)).read()
    vb = re.search(r'viewBox="([^"]+)"', src).group(1).split()
    vw, vh = float(vb[2]), float(vb[3])
    w = h * vw / vh
    inner = re.sub(r"^<svg[^>]*>", "", src.strip())[:-6]
    # Scope the classes so two files on one board do not share `.a`.
    tag = re.sub(r"[^a-z0-9]", "", path.lower()) + (theme or "")
    inner = re.sub(r"\.(i|a|m|s|t)\{", lambda m: f".{tag}{m.group(1)}{{", inner)
    inner = re.sub(r'class="(i|a|m|s|t)"', lambda m: f'class="{tag}{m.group(1)}"', inner)
    if theme == "dark":  # resolve prefers-color-scheme for the board: keep only the dark block's rules
        inner = re.sub(r"<style>(.*?)@media\(prefers-color-scheme:dark\)\{(.*)\}</style>", r"<style>\1\2</style>", inner)
    else:
        inner = re.sub(r"@media\(prefers-color-scheme:dark\)\{.*\}</style>", "</style>", inner)
    rendering = ' shape-rendering="crispEdges"' if "pixel" in path else ""
    return f'<svg x="{fmt(x)}" y="{fmt(y)}" width="{fmt(w)}" height="{fmt(h)}" viewBox="{" ".join(vb)}"{rendering}>{inner}</svg>', w


DIRS = {
    "a-cut": (
        "A. The cut slash",
        "Keeps today's suite mark; each tool redraws the second slash its own way, in its own colour.",
    ),
    "b-pixel": (
        "B. Pixel",
        "PixelSlash's pixel art becomes the whole suite's: one tile per tool, the suite's peach slash in each.",
    ),
    "c-glyph": (
        "C. Glyph and cut",
        "One slash-shaped cut through a simple picture of each tool; mono wordmarks read like code.",
    ),
}


def files_for(d, tool, th):
    slug = "slash" if tool == "suite" else NAME[tool].lower()
    if d == "a-cut":
        return f"a-cut/{slug}-lockup-{th}.svg", f"a-cut/{slug}-mark.svg"
    if d == "b-pixel":
        return f"b-pixel/{slug}-wordmark-{th}.svg", f"b-pixel/{slug}-tile.svg"
    return f"c-glyph/{slug}-lockup-{th}.svg", f"c-glyph/{slug}-mark.svg"


def board(d):
    title, why = DIRS[d]
    W, H = 1600, 1140
    parts = [f'<rect width="{W}" height="{H}" fill="#dce0e8"/>',
             f'<text x="40" y="58" font-family="sans-serif" font-size="30" font-weight="700" fill="#4c4f69">{title}</text>',
             f'<text x="40" y="92" font-family="sans-serif" font-size="18" fill="#5c5f77">{why}</text>']
    for col, th in enumerate(("light", "dark")):
        ox = 40 + col * 770
        t = THEME[th]
        parts.append(f'<rect x="{ox}" y="120" width="750" height="990" rx="16" fill="{t["bg"]}"/>')
        parts.append(f'<text x="{ox + 30}" y="160" font-family="sans-serif" font-size="15" fill="{t["mute"]}">{th}</text>')
        y = 190
        tools = C_TOOLS if d == "c-glyph" else TOOLS
        sizes = (40, 24, 16) if len(tools) > 4 else (64, 32, 16)
        for tool in ["suite", *tools]:
            lock, mark = files_for(d, tool, th)
            if d == "b-pixel":
                tile, tw = embed(mark, ox + 30, y, 72)
                word, _ = embed(lock, ox + 30 + tw + 22, y + 20, 32)
                parts += [tile, word]
            else:
                lk, _ = embed(lock, ox + 30, y, 80 if tool == "suite" else 64, th)
                parts.append(lk)
            y += 112 if tool == "suite" else 92
        # small sizes: the marks at 64, 32 and 16
        y += 20
        parts.append(f'<text x="{ox + 30}" y="{y}" font-family="sans-serif" font-size="15" fill="{t["mute"]}">marks at {sizes[0]}, {sizes[1]} and {sizes[2]} px</text>')
        y += 20
        x = ox + 30
        for tool in ["suite", *tools]:
            _, mark = files_for(d, tool, th)
            for size in sizes:
                m, mw = embed(mark, x, y + (sizes[0] - size), size, th)
                parts.append(m)
                x += mw + 6
            x += 14
        # a browser tab with the favicon
        y += 100
        parts.append(f'<rect x="{ox + 30}" y="{y}" width="300" height="40" rx="8" fill="{t["panel"]}" stroke="{t["rule"]}"/>')
        fav, _ = embed(files_for(d, "suite", th)[1], ox + 44, y + 12, 16, th)
        parts.append(fav)
        parts.append(f'<text x="{ox + 70}" y="{y + 26}" font-family="sans-serif" font-size="14" fill="{t["ink"]}">slashslash.build</text>')
        fav2, _ = embed(files_for(d, "flake", th)[1], ox + 344, y + 12, 16, th)
        parts.append(f'<rect x="{ox + 330}" y="{y}" width="300" height="40" rx="8" fill="{t["panel"]}" stroke="{t["rule"]}"/>')
        parts.append(fav2)
        parts.append(f'<text x="{ox + 370}" y="{y + 26}" font-family="sans-serif" font-size="14" fill="{t["ink"]}">FlakeSlash</text>')
    write(f"boards/{d}.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">{"".join(parts)}</svg>\n')


def og(d, tool, th):
    """The OG template: the tool's colour as a rule along the top, the lockup, one headline, the address."""
    t = THEME[th]
    a = ACCENT[tool][th]
    headline = {
        "suite": ["See what a change", "really does, before", "your customers do."],
        "pixel": ["Visual review for", "every pull request."],
        "flake": ["Find the flaky tests", "before they find you."],
        "toggle": ["Feature flags", "you can self-host."],
        "bundle": ["Know what each", "change adds to the bundle."],
        "task": ["TaskSlash"],
    }[tool]
    addr = "slashslash.build" + ("" if tool == "suite" else "/" + NAME[tool].lower())
    lock, mark = files_for(d, tool, th)
    parts = [f'<rect width="1200" height="630" fill="{t["bg"]}"/>', f'<rect width="1200" height="14" fill="{a}"/>']
    if d == "b-pixel":
        tile, tw = embed(mark, 90, 96, 80)
        word, _ = embed(lock, 90 + tw + 24, 96 + 24, 32)
        parts += [tile, word]
    else:
        lk, _ = embed(lock, 90, 96, 80, th)
        parts.append(lk)
    for i, line in enumerate(headline):
        dpath, _ = text_path(line, size=76, x=90, y=360 + i * 84)
        parts.append(f'<path fill="{t["ink"]}" d="{dpath}"/>')
    dpath, _ = text_path(addr, face="mono", axes=(("wght", 500),), size=28, x=90, y=585)
    parts.append(f'<path fill="{t["mute"]}" d="{dpath}"/>')
    write(f"boards/og-{d}-{tool}-{th}.svg", f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">{"".join(parts)}</svg>\n')


if __name__ == "__main__":
    build()
    for d in DIRS:
        board(d)
        for tool, th in (("suite", "light"), ("flake", "light"), ("pixel", "dark")):
            og(d, tool, th)
    og("c-glyph", "task", "light")
    og("c-glyph", "task", "dark")
    print("ok")
