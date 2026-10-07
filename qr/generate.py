#!/usr/bin/env python3
"""イベント配布用QRコードの生成。 pip install segno """
import segno

# ドメインが繋がったらここを書き換えて再実行する
BASE = "https://gleeful-fenglisu-419d3e.netlify.app"

TARGETS = [
    ("start",   f"{BASE}/start"),
    ("talent",  f"{BASE}/login?mode=signup&role=talent"),
    ("company", f"{BASE}/login?mode=signup&role=company"),
]

# 誤り訂正 H: 印刷物の汚れや中央のロゴに耐える
for name, url in TARGETS:
    q = segno.make(url, error="h")
    q.save(f"qr/{name}.svg", scale=10, border=4, dark="#1C1B18", light="#FAF8F4")
    q.save(f"qr/{name}.png", scale=20, border=4, dark="#1C1B18", light="#FAF8F4")
    print(f"{name}: version={q.version} {url}")
