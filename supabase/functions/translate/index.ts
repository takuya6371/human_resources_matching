// Azure Translator を使って英語→日本語の翻訳を行うEdge Function。
//
// フロントの「保存時に日本語欄が空なら英語から自動翻訳して埋める」機能から呼ばれる。
// APIキーをクライアントに渡さないよう、実際のAzure呼び出しはこの関数の中でのみ行う。
//
// 必須のSupabase Secrets:
//   AZURE_TRANSLATOR_KEY    Azure Translatorのサブスクリプションキー
//   AZURE_TRANSLATOR_REGION Azureリソースのリージョン（例: japaneast）
//
// verify_jwt はデフォルトで有効（config.tomlで個別設定していない場合）。
// ログイン済みユーザーのみが呼び出せる状態を維持し、無料枠を第三者に
// 消費されるのを防ぐ。

const AZURE_ENDPOINT = 'https://api.cognitive.microsofttranslator.com/translate'
const MAX_TEXTS = 20
const MAX_TEXT_LENGTH = 5000

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  texts: string[]
  target?: string // デフォルト 'ja'
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const key = Deno.env.get('AZURE_TRANSLATOR_KEY')
    const region = Deno.env.get('AZURE_TRANSLATOR_REGION')
    if (!key || !region) {
      return new Response(
        JSON.stringify({ error: 'AZURE_TRANSLATOR_KEY / AZURE_TRANSLATOR_REGION が設定されていません' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json()) as RequestBody
    const texts = (body.texts ?? []).filter(t => typeof t === 'string' && t.trim().length > 0)
    const target = body.target ?? 'ja'

    if (texts.length === 0) {
      return new Response(JSON.stringify({ translations: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    if (texts.length > MAX_TEXTS || texts.some(t => t.length > MAX_TEXT_LENGTH)) {
      return new Response(JSON.stringify({ error: 'テキストが長すぎるか件数が多すぎます' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const azureRes = await fetch(`${AZURE_ENDPOINT}?api-version=3.0&to=${encodeURIComponent(target)}`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Ocp-Apim-Subscription-Region': region,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(texts.map(text => ({ Text: text }))),
    })

    if (!azureRes.ok) {
      const errText = await azureRes.text()
      return new Response(JSON.stringify({ error: `Azure Translator error: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const azureData = (await azureRes.json()) as { translations: { text: string }[] }[]
    const translations = azureData.map(item => item.translations[0]?.text ?? '')

    return new Response(JSON.stringify({ translations }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
