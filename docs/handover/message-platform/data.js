/* ============================================================
   Dummy accounts and seeded conversations.
   Five talents, four company representatives, one admin, and
   threads that between them exercise every state the interface
   has: ordinary conversation, a rules block, a model catch that
   hid a thread, a support request, and a clean new thread.
   Seeded messages carry their own translations so the demo runs
   with no API key at all.
   ============================================================ */

export const TALENTS = [
  { id:'t-amara', name:'Amara Chinelo Nwosu', flag:'🇰🇪', initials:'AC', lang:'en',
    title:'Lead Software Engineer', place:'Nairobi, Kenya', jlpt:'N2' },
  { id:'t-kwame', name:'Kwame Asante', flag:'🇬🇭', initials:'KA', lang:'en',
    title:'Senior Mobile Engineer', place:'Shibuya, Tokyo', jlpt:'N1' },
  { id:'t-fatou', name:'Fatoumata Diallo', flag:'🇸🇳', initials:'FD', lang:'en',
    title:'Digital Marketing Manager', place:'Dakar, Senegal', jlpt:'N5' },
  { id:'t-sela',  name:'Selamawit Bekele', flag:'🇪🇹', initials:'SB', lang:'en',
    title:'Principal Engineer, Platform', place:'Addis Ababa, Ethiopia', jlpt:'N4' },
  { id:'t-grace', name:'Grace Achieng', flag:'🇰🇪', initials:'GA', lang:'en',
    title:'Frontend Developer', place:'Nairobi, Kenya', jlpt:'—' },
];

export const COMPANIES = [
  { id:'c-tanaka', name:'田中 健一', roman:'Kenichi Tanaka', flag:'🇯🇵', initials:'TK', lang:'ja',
    title:'採用マネージャー', company:'株式会社ミナトソフト', place:'東京都港区' },
  { id:'c-suzuki', name:'鈴木 美咲', roman:'Misaki Suzuki', flag:'🇯🇵', initials:'SM', lang:'ja',
    title:'エンジニアリング人事', company:'サクラテック株式会社', place:'東京都渋谷区' },
  { id:'c-yamada', name:'山田 大輔', roman:'Daisuke Yamada', flag:'🇯🇵', initials:'YD', lang:'ja',
    title:'CTO', company:'合同会社ノースリバー', place:'福岡市' },
  { id:'c-ito',    name:'伊藤 彩', roman:'Aya Ito', flag:'🇯🇵', initials:'IA', lang:'ja',
    title:'グローバル採用担当', company:'株式会社アオゾラ', place:'大阪市' },
];

export const ADMIN = { id:'admin', name:'AfriTalent Trust & Safety', initials:'TS', lang:'en', role:'admin' };

export const ALL_PEOPLE = [...TALENTS, ...COMPANIES, ADMIN];
export const personById = id => ALL_PEOPLE.find(p => p.id === id);

/* Empty by design.

   A demo where the conversation is already written reads as a screenshot. Every
   message you show should be typed in front of the audience, in a thread that
   started blank — including the ones that get blocked. What is seeded here is
   only the pairing: who is talking to whom, and for which company.
*/
export const THREADS = [
  { id: 'th-1', talent: 't-amara', company: 'c-tanaka', status: 'open', supportRequested: false, messages: [] },
  { id: 'th-2', talent: 't-kwame', company: 'c-suzuki', status: 'open', supportRequested: false, messages: [] },
  { id: 'th-3', talent: 't-fatou', company: 'c-yamada', status: 'open', supportRequested: false, messages: [] },
  { id: 'th-4', talent: 't-sela',  company: 'c-ito',    status: 'open', supportRequested: false, messages: [] },
  { id: 'th-5', talent: 't-grace', company: 'c-tanaka', status: 'open', supportRequested: false, messages: [] },
];

/* A pocket phrasebook so the seeded demo and common replies translate with no
   API call at all. Anything not in here goes to /api/translate. */
export const PHRASEBOOK = {
  'thank you': 'ありがとうございます',
  'thank you.': 'ありがとうございます。',
  'thanks': 'ありがとうございます',
  'yes, that works for me': 'はい、それで問題ありません',
  'that works for me': 'それで問題ありません',
  'sounds good': '承知しました',
  'understood': '承知しました',
  'ありがとうございます': 'Thank you',
  'よろしくお願いいたします': 'Thank you in advance',
  '承知しました': 'Understood',
  'かしこまりました': 'Certainly',
};
