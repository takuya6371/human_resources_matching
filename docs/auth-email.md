# 認証メールの送信

Supabase の認証メール（登録確認・パスワード再設定・ログインリンクなど）は、
**Supabase の Custom SMTP 欄ではなく、Netlify の関数経由でさくらから送る。**

## なぜ Custom SMTP が使えないのか

Supabase の認証基盤 GoTrue は Go で書かれている。

- Go の `crypto/tls` は **DHE 鍵交換に非対応**（実装自体が無い）
- **Go 1.22 で RSA 鍵交換が既定から外れた**（`GODEBUG=tlsrsakex=1` で戻せるが、
  これは Supabase 側のサーバー環境変数なので我々には触れない）
- 結果、GoTrue が提示する暗号方式は **ECDHE のみ**

一方さくらのレンタルサーバのメールサーバーは **TLS 1.2 まで**で、
**ECDHE に非対応**（DHE と RSA 鍵交換のみ）。
さくら公式も「メール（SMTP/POP/IMAP）は TLS 1.2 のみ」と明記している。

共通する暗号方式が1つも無いため、さくらが `handshake_failure` を返し、
Supabase 側は必ずこうなる:

```json
{ "error": "remote error: tls: handshake failure",
  "error_code": "unexpected_failure", "status": 500 }
```

ホスト名（`www3725` / `hirokawasaki`）やポート（587 / 465）を変えても同じ。
2024年の記事どおりに設定しても動かないのは、**当時の Supabase が Go 1.21 以前
だったから**で、さくら側は何も変わっていない。

### 検証に使ったコマンド

```sh
# さくらが ECDHE を拒否することの確認（alert 40 が返る）
openssl s_client -starttls smtp -connect hirokawasaki.sakura.ne.jp:587 \
  -cipher ECDHE-RSA-AES128-GCM-SHA256

# 既定で選ばれる暗号方式（DHE になる）
openssl s_client -starttls smtp -connect hirokawasaki.sakura.ne.jp:587
#   Cipher : DHE-RSA-AES256-GCM-SHA384
```

## なぜ Netlify の関数なら送れるのか

Node の TLS は OpenSSL なので DHE を話せる。実測:

```
TLSv1.2 / DHE-RSA-AES256-GCM-SHA384、証明書検証 OK
TCP接続 81ms → バナー 118ms → EHLO 154ms → STARTTLS 199ms
  → TLS確立 399ms → EHLO 434ms
nodemailer で AUTH まで到達して 468ms
```

Supabase Edge Functions は Deno（rustls）で DHE 非対応なので使えない。
**Node が動く Netlify Functions に置く必要がある。**

## 構成

```
Supabase Auth ──Send Email Hook(HTTP)──> Netlify Function ──SMTP──> さくら
```

- 関数: `netlify/functions/send-auth-email.mts`
- 公開パス: `https://nebonga-link.com/api/auth-email`
- 署名検証: Standard Webhooks（`webhook-id` / `webhook-timestamp` / `webhook-signature`）を
  自前で検証。許容時刻ずれ 5分。
- 言語: `user.user_metadata.lang`（登録時に `AuthContext.signUp` が入れる）。
  ja / en / fr。未設定なら ja。

## 制約

| | |
|---|---|
| HTTPフックのタイムアウト | **5秒**（リトライ込み） |
| リトライ | 最大3回。**429 / 503 のときだけ**、2秒間隔 |
| ペイロード | 20KB |
| プラン | 無料で可（Team/Enterprise が要るのは MFA 系フックのみ） |

### 5秒に収めるための工夫

Netlify の関数は **米国オハイオ（CMH）で動く**。リージョン変更は有料プラン
なので、さくら（日本）との1往復が約170msかかる前提で組む必要がある。

最初の実装は 587(STARTTLS) + コールドスタートで **関数の実行だけで3,977ms**、
Supabase 側の計測で 5.0016秒となり

```
422: Failed to reach hook within maximum time of 5.000000 seconds
```

で弾かれた（**メール自体は送信済みだった**ので、利用者には届くが
Supabase は失敗扱いにする、という最悪の状態になる）。

打った手は2つ。

**1. ポート465（暗黙のTLS）にした**

```
587: 接続 → バナー → EHLO → STARTTLS → TLS → EHLO → AUTH
465: 接続 → TLS → バナー → EHLO → AUTH        ← 2往復少ない
```

日本国内からの実測でも 587 が 540〜590ms、465 が 334〜381ms。
オハイオからだと往復が10倍重いので、差はもっと大きい。

**2. `keep-warm.mts` で5分おきに温める**

コールドスタートが 2.06秒、ウォームが 0.63〜1.42秒。この差がそのまま
成否を分ける。GET で叩くと 405 を返すだけでメールは送らないが、
コンテナと nodemailer の読み込みは生きたままになる。

SMTP 側のタイムアウトは、Supabase に打ち切られる前にこちらで諦めるため
短くしてある（`connectionTimeout` 3.5s / `greetingTimeout` 3.5s /
`socketTimeout` 4s）。

イベント当日のように連続して登録があるときは自然に温まるので、
この問題はさらに起きにくい。

### 送信数の上限

| | |
|---|---|
| さくら ライト/スタンダード/プレミアム | 15分で約100通（400通/時） |
| さくら ビジネス/ビジネスプロ | 15分で約250通（1,000通/時） |
| Supabase 送信メール | 200通/時（設定済み） |
| Supabase 新規登録・ログイン | 100回/5分・IPごと（設定済み） |
| Supabase OTP・リンク検証 | 100回/5分・IPごと（設定済み） |

さくらは契約から15日以内、または会員IDの電話番号認証が未実施だと制限される。
超過分は**送信されず、エラーも返らない**。

## 設定手順

### 1. Netlify の環境変数

Site settings → Environment variables に追加する。

| 変数 | 値 |
|---|---|
| `SMTP_HOST` | `hirokawasaki.sakura.ne.jp` |
| `SMTP_PORT` | `465` |
| `SMTP_USER` | さくらで作ったメールアドレス（例 `noreply@nebonga-link.com`） |
| `SMTP_PASS` | そのメールアドレスのパスワード |
| `MAIL_FROM` | `noreply@nebonga-link.com` |
| `MAIL_FROM_NAME` | `NeBonga Link` |
| `SUPABASE_URL` | `https://zolqlgarsabpksalkivy.supabase.co` |
| `SITE_URL` | `https://nebonga-link.com` |
| `SEND_EMAIL_HOOK_SECRET` | 手順2で Supabase が出す値（`v1,whsec_...`） |

`SMTP_USER` は**さくらに実在するメールアドレス**であること。
さくらの初期ドメイン（`@hirokawasaki.sakura.ne.jp`）のままでも認証は通るが、
`MAIL_FROM` を `@nebonga-link.com` にしたまま使うと SPF の整合が崩れる。
**独自ドメインでメールアドレスを作って、両方を揃えるのが正しい。**

現在の DNS:

```
MX     10 www3725.sakura.ne.jp
SPF    v=spf1 a:www3725.sakura.ne.jp mx ~all
DMARC  v=DMARC1; p=none; aspf=r; adkim=r
```

送信元が `@nebonga-link.com`、実送信サーバーが `www3725.sakura.ne.jp` なので
**SPF は pass かつドメインも一致する**。DKIM は未設定だが、SPF が揃っていれば
DMARC は通る。

### 2. Supabase 側

Authentication → Auth Hooks → Add hook → **Send Email hook**

- Type: HTTPS
- URL: `https://nebonga-link.com/api/auth-email`
- Secret: 生成された値をコピーして Netlify の `SEND_EMAIL_HOOK_SECRET` に入れる

**Custom SMTP は有効のままにしておく。** フックが実際の送信を奪うので
SMTP 設定自体は使われないが、無効にすると送信上限が 2通/時に落ちる可能性がある
（この点は Supabase のドキュメントに記載が無い）。フックを入れたあとに
実際に1通送って、ログに TLS のエラーが出ないことで確認すること。

## 動作確認できていること

2026-10-10 に本番で通しで確認した。

```
Supabase → フック呼び出し   ✓
署名検証（Standard Webhooks）✓
言語判定・文面組み立て        ✓
さくらへ接続 → TLS(DHE)     ✓   ← Custom SMTP では越えられなかった壁
AUTH                       ✓
送信                       ✓

Supabase Auth ログ: /recover | Hook ran successfully
```

## ローカルでの確認

`AUTH_EMAIL_DRY_RUN=1` を立てると、実際には送らずに
件名・リンク・本文HTMLを返す。
