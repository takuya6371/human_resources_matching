/* Copy this file to chat-config.js and fill in the key.

   chat-config.js is gitignored — it is loaded by the page, so whatever you put
   here is readable by anyone who opens the folder or the dev tools. That is
   fine on your own machine and wrong anywhere public.

   The key is OPTIONAL. It arms two things:
     - translation of NEW messages, when the browser has no on-device translator
       (Chrome and Edge expose window.Translator; Safari and Firefox do not)
     - the second moderation tier, which reads wording the deterministic rules
       cannot settle on their own

   Everything else — every block you would show in a demo, and the whole of
   tier 1 moderation — runs with no key at all.

   Get a key at https://aistudio.google.com/apikey (free tier is enough).
*/
window.AFRITALENT_CHAT = {
  GEMINI_API_KEY: '',
  GEMINI_MODEL: 'gemini-3.6-flash',
};
