#!/usr/bin/env python3
"""イベント配布用QRコードの生成。 pip install segno """
import segno

# ドメインが繋がったらここを書き換えて再実行する
BASE = "https://nebonga-link.com"

# 言語別に分けているのは、イベント会場で端末が日本語設定の海外人材でも
# 英語のQRを読めば英語で着地できるようにするため。
TARGETS = [
    ("start",         f"{BASE}/start"),
    ("start-en",      f"{BASE}/start?lang=en"),
    ("talent",        f"{BASE}/login?mode=signup&role=talent"),
    ("talent-en",     f"{BASE}/login?mode=signup&role=talent&lang=en"),
    ("company",       f"{BASE}/login?mode=signup&role=company"),
    ("company-en",    f"{BASE}/login?mode=signup&role=company&lang=en"),
]

# 誤り訂正 Q（25%復元）。当初 H（30%）にしていたが、言語指定を足して
# URLが伸びた結果 version 7（45x45）まで密になり、独立したデコーダでは
# 既定サイズで読み取れなくなった。印刷して現場のカメラで読ませる用途では
# 危険なので Q に下げる。company-en で 45x45 → 41x41 になり、全6種が
# 既定サイズで読める。中央にロゴを置くなら H に戻すこと。
for name, url in TARGETS:
    q = segno.make(url, error="q")
    q.save(f"qr/{name}.svg", scale=10, border=4, dark="#1C1B18", light="#FAF8F4")
    q.save(f"qr/{name}.png", scale=20, border=4, dark="#1C1B18", light="#FAF8F4")
    print(f"{name}: version={q.version} {url}")
