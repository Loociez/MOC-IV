#!/usr/bin/env python3
"""Convert mapdump.json -> mapdump.bin (about 10x smaller, loads fast on phones).
Usage: python3 make_mapbin.py [mapdump.json] [mapdump.bin]"""
import json, struct, sys
src = sys.argv[1] if len(sys.argv) > 1 else "mapdump.json"
dst = sys.argv[2] if len(sys.argv) > 2 else "mapdump.bin"
STATIC = [0, 1, 3, 5, 7, 9]  # Ground, Mask, Mask 2, Fringe, Fringe 2, Roof
text = open(src, encoding="utf-8").read().strip()
try:
    data = json.loads(text)
except ValueError:
    data = json.loads("[" + text) if text.startswith("{") and text.endswith("]") else None
if isinstance(data, dict):
    data = data.get("maps", [])
nb = lambda v: v if isinstance(v, int) else -1
with open(dst, "wb") as f:
    f.write(b"MLM1" + struct.pack("<I", len(data)))
    for m in data:
        f.write(struct.pack("<4i", nb(m.get("map_north_id")), nb(m.get("map_south_id")), nb(m.get("map_west_id")), nb(m.get("map_east_id"))))
        t = []
        for x in range(16):
            col = m["tiles"][x] if x < len(m["tiles"]) else []
            for y in range(12):
                L = col[y] if y < len(col) else []
                for k in STATIC:
                    v = L[k] if k < len(L) else -1
                    t.append(v if isinstance(v, int) and 0 <= v < 32768 else -1)
        f.write(struct.pack("<1152h", *t))
print(f"{len(data)} maps -> {dst}")
