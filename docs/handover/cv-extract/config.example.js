/* ============================================================
   AfriTalent — CV extraction demo config
   ------------------------------------------------------------
   Copy this file to `config.js` and fill in the values.
   `cv-extract-demo.html` loads `config.js` automatically on
   startup, so once the key is here you never paste it again.

       cp config.example.js config.js
       # then edit config.js

   config.js is gitignored. Never commit a real key.

   This is a LOCAL DEMO convenience only. In production the key
   lives as a Supabase secret and never reaches the browser:

       supabase secrets set GEMINI_API_KEY=AIza...
       supabase functions deploy parse-cv
   ============================================================ */

window.AFRITALENT_CONFIG = {
  // ============================================================
  //  PUT YOUR GEMINI KEY HERE
  //  https://aistudio.google.com/apikey  →  Create API key
  //  Current keys start with "AQ."; older ones with "AIza".
  // ============================================================
  GEMINI_API_KEY: '',

  // Optional. Blank uses gemini-3.6-flash.
  GEMINI_MODEL: '',

  // Optional. Only used to size requests so a long CV never reserves
  // more than your account allows. Your real limits are in AI Studio.
  GEMINI_TPM_LIMIT: 0,

  // Gemini thinks before it answers, and the thinking shares the output
  // ceiling with the JSON. Extraction is transcription rather than
  // deduction, so 'low' costs nothing and leaves room for the answer.
  GEMINI_REASONING_EFFORT: 'low',

  // ---- Google Drive picker (optional) ----
  // Leave both blank and the Drive button opens a simulated picker so the
  // flow can still be demonstrated. Fill them in and it opens the real
  // Google Picker against the signed-in Google account.
  //   1. console.cloud.google.com -> enable "Google Picker API" + "Google Drive API"
  //   2. Create an API key            -> GOOGLE_API_KEY
  //   3. Create an OAuth 2.0 Client ID (Web) -> GOOGLE_CLIENT_ID
  //      Authorised JavaScript origin: http://localhost:8000
  GOOGLE_API_KEY: '',
  GOOGLE_CLIENT_ID: '',

  // ---- Identity verification, via Didit (optional) ----
  // Three deployed functions. Leave them blank and the button runs a clearly
  // labelled simulation instead — useful for walking the flow, proof of
  // nothing. The Didit API key is NOT here: it lives as a Supabase secret,
  // because a KYC key in a browser is a key anyone can spend.
  //
  //   supabase secrets set DIDIT_API_KEY=...
  //   supabase secrets set DIDIT_WEBHOOK_SECRET=...
  //   supabase functions deploy start-verification
  //   supabase functions deploy verification-status
  //   supabase functions deploy verification-webhook --no-verify-jwt
  //
  // See README → Identity verification for registering the webhook.
  // Deployed:  https://<ref>.functions.supabase.co/start-verification
  // Local dev: http://localhost:8767/api/start-verification  (see dev-server.py)
  VERIFY_START_URL: '',
  VERIFY_STATUS_URL: '',
  VERIFY_AUTH: '',        // 'Bearer <supabase session jwt>' if your functions require one
}
