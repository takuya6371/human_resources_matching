/**
 * AfriTalent — CV extraction schema
 *
 * Designed for strict structured outputs (`json_schema` + `strict: true`),
 * which requires EVERY property to appear in `required` and
 * `additionalProperties: false` at every level. Optional values are expressed
 * as type unions with "null" — a shape Gemini supports directly — rather than
 * by omitting them from `required`.
 *
 * Gemini rejects "very large or deeply nested" schemas without naming a limit,
 * so this stays lean on principle: every field here has to earn its place, and
 * several were removed because nothing downstream ever read them.
 *
 * Shared verbatim by the browser demo and the Supabase Edge Function.
 */

const S = (desc) => ({ type: "string", description: desc });
const SN = (desc) => ({ type: ["string", "null"], description: desc });
const IN = (desc) => ({ type: ["integer", "null"], description: desc });
const NN = (desc) => ({ type: ["number", "null"], description: desc });
const BN = (desc) => ({ type: ["boolean", "null"], description: desc });
const ARR = (items, desc) => ({ type: "array", items, description: desc });

const obj = (properties) => ({
  type: "object",
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

export const CV_SCHEMA = obj({
  candidate: obj({
    full_name: S(), headline: SN(), summary: SN(),
    email: SN(), phone: SN(), links: ARR(S()),
    city: SN(), country: SN(), country_code: SN(),
    date_of_birth: SN(),
    gender: { type: ['string','null'], enum: ['male','female','other',null] },
    nationality: SN(), nationality_code: SN(),
    address_line: SN(), postal_code: SN(),
  }),
  languages: ARR(obj({
    language: S(),
    cefr: { type: ['string','null'], enum: ['A1','A2','B1','B2','C1','C2',null] },
    jlpt: { type: ['string','null'], enum: ['N1','N2','N3','N4','N5',null] },
    is_native: BN(),
  })),
  education: ARR(obj({
    institution: S(), degree: SN(), field_of_study: SN(),
    start_year: IN_(), end_year: IN_(), is_ongoing: BN(),
  })),
  experience: ARR(obj({
    employer: S(), title: S(),
    employment_type: { type: 'string', enum: ['full_time','part_time','contract','freelance','internship','volunteer','other'] },
    start_date: SN(), end_date: SN(), is_current: BN(),
    summary: SN(), achievements: ARR(S()), scale_note: SN(),
  })),
  skills: ARR(obj({ name: S(), canonical: S() })),
  certifications: ARR(obj({ name: S(), year: IN_() })),
  projects: ARR(obj({ name: S(), description: SN(), url: SN() })),
  work_preferences: obj({
    open_to_remote: BN(), open_to_relocate: BN(),
    target_countries: ARR(S()), notice_period: SN(), desired_salary: SN(),
  }),
  derived: obj({
    total_years_experience: NN(),
    seniority: { type: ['string','null'], enum: ['intern','junior','mid','senior','lead','principal',null] },
    primary_field: SN(),
    japanese_level: { type: ['string','null'], enum: ['N1','N2','N3','N4','N5','none',null] },
    has_degree: BN(),
    career_gaps: ARR(obj({ from: S(), to: S(), months: { type: 'integer' } })),
  }),
  extraction_meta: obj({
    source_language: S(),
    confidence: obj({ identity: NN(), experience: NN(), education: NN(), skills: NN() }),
    missing_fields: ARR(S()), warnings: ARR(S()),
  }),
});

export const SYSTEM_PROMPT = `You extract structured data from CVs for a platform matching African professionals with Japanese companies.

WRITE THE OUTPUT IN ENGLISH. CVs arrive in French, Japanese and other languages; the profile is always English. Translate every piece of prose you produce — headline, summary, job titles, role summaries, achievements, skill names, field labels, availability. Keep proper nouns as they are written: people, employers, schools, cities, qualifications. Record the document's own language in extraction_meta.source_language.

GROUNDING
1. Extract only what the document supports. Never invent an employer, date, qualification or skill.
2. Absent values are null, and their dotted path goes in extraction_meta.missing_fields.
3. headline and summary may be composed by you from the CV's content. Everything else is grounded in the text.
4. date_of_birth, gender, nationality, address_line and postal_code are transcribed, never deduced: no gender from a name or photograph, no birth date worked back from an age. nationality_code is the exception — it is the ISO 3166-1 alpha-2 code for whatever nationality is stated, so "Ghanaian" and "ガーナ" both give GH. Nationality and country of residence are different questions; record each where it belongs.

SHAPE
5. Dates are YYYY-MM. A year alone becomes month 01. A current role has end_date null and is_current true.
6. Deduplicate skills hard: ReactJS, React.js and React are one entry, canonical "React". Include skills evident in the work history but absent from any skills list.
7. Every field with a list of allowed values must use one of them exactly — "other" where nothing fits, or null where permitted. An invented value loses the whole extraction.
8. Order experience and education most recent first. total_years_experience counts professional work only: exclude internships, volunteering, and time where two roles overlapped. career_gaps lists unexplained gaps over six months. phone is E.164 where the country is clear.

JUDGEMENT
9. Confidence scores are your honest assessment. Score dates low when they are ambiguous — a confident wrong answer is worse than a flagged uncertain one.
10. Warn about anything a reviewer should check: overlapping employment, unexplained gaps, inconsistent dates, unreadable sections, or a document that is not a CV.

Return only the JSON object.`;
