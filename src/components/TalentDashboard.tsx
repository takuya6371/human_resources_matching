import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from './Navbar'
import EmailVerificationNotice from './EmailVerificationNotice'
import Footer from './Footer'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t, pick, pickList } from '../i18n'
import { MAX_PROFILE_IMAGE_SIZE, uploadProfileImage } from '../lib/storage'
import { isSafeHttpUrl } from '../lib/url'
import { fillMissingJapanese, translateToJa } from '../lib/translate'
import CvImportDialog from './CvImportDialog'
import type { CvFieldKey, CvFields } from '../lib/cvImport'
import type { User, JLPTLevel, LanguageLevel, Language, Experience, Certification } from '../types'

const LEVELS: JLPTLevel[] = ['N1', 'N2', 'N3', 'N4', 'N5']
const LANG_LEVELS: LanguageLevel[] = ['Native', 'Fluent', 'Business', 'Conversational', 'Basic']

interface EditForm {
  email: string
  nameEn: string
  nameJa: string
  headlineEn: string
  headlineJa: string
  university: string
  universityJa: string
  faculty: string
  facultyJa: string
  japaneseLevel: JLPTLevel
  openToWork: boolean
  skillsEn: string
  skillsJa: string
  bioEn: string
  bioJa: string
  availableFrom: string
  availableFromJa: string
  languages: Language[]
  experience: Experience[]
  residenceArea: string
  devExperienceYears: string
  yearsInJapan: string
  returnHomeMonth: string
  hobbies: string
  videoUrl: string
  pastClients: string
  avatarUrl: string
  // 日本式履歴書用。企業には見えない（profile_private）。
  nameKanaJa: string
  phone: string
  dateOfBirth: string
  gender: string
  postalCode: string
  addressLine: string
  addressKanaJa: string
  commuteMinutes: string
  dependentsCount: string
  hasSpouse: boolean
  spouseIsDependent: boolean
  preferredConditions: string
  certifications: Certification[]
}

const INPUT_CLS = 'input-line'
const LABEL_CLS = 'label-line'

// CV取り込みのレビュー画面に「今フォームに入っている値」を見せるための表示用変換。
// languages/experience の書式は describeCvField と揃えてある。
function cvCurrentValues(f: EditForm): Record<CvFieldKey, string> {
  return {
    nameEn: f.nameEn,
    email: f.email,
    headlineEn: f.headlineEn,
    bioEn: f.bioEn,
    university: f.university,
    faculty: f.faculty,
    japaneseLevel: f.japaneseLevel,
    devExperienceYears: f.devExperienceYears,
    skillsEn: f.skillsEn,
    languages: f.languages.map(l => `${l.name} (${l.level})`).join(', '),
    experience: f.experience.map(e => `${e.role} — ${e.company}`).join('\n'),
    phone: f.phone,
    dateOfBirth: f.dateOfBirth,
    gender: f.gender,
    postalCode: f.postalCode,
    addressLine: f.addressLine,
    certifications: f.certifications
      .map(c => (c.acquiredOn ? `${c.name} (${c.acquiredOn.slice(0, 7)})` : c.name)).join('\n'),
  }
}

const STATUS_COLOR: Record<string, string> = {
  draft: '#B7B2A1',
  pending: '#BA7517',
  approved: '#1D7E5C',
  rejected: '#A6332B',
}

export default function TalentDashboard({ user }: { user: User }) {
  const { updateProfile, submitForReview } = useAuth()
  const { lang } = useLang()
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  // 保存は通るが自動翻訳だけ落ちた場合に出す。保存自体は成功しているので止めない。
  const [translateWarn, setTranslateWarn] = useState(false)
  // 結果メッセージはページ最上部に出る。保存ボタンはフォーム最下部にあるので、
  // そのままだと押した人の視界に入らない。完了したらここまで引き戻す。
  const resultRef = useRef<HTMLDivElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState<EditForm | null>(null)
  // 写真は選択時点ではアップロードせず、保存時にまとめて送る。
  // 選択しただけで編集をやめた場合に、紐づかないファイルがStorageに残らないようにするため。
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarError, setAvatarError] = useState('')
  const [cvOpen, setCvOpen] = useState(false)

  useEffect(() => () => { if (avatarPreview) URL.revokeObjectURL(avatarPreview) }, [avatarPreview])

  const name = pick(lang, user.nameJa, user.nameEn)
  const skills = pickList(lang, user.skillsJa, user.skills)
  const bio = pick(lang, user.bioJa, user.bioEn)

  function startEdit() {
    setForm({
      nameKanaJa: user.nameKanaJa ?? '',
      phone: user.phone ?? '',
      dateOfBirth: user.dateOfBirth ?? '',
      gender: user.gender ?? '',
      postalCode: user.postalCode ?? '',
      addressLine: user.addressLine ?? '',
      addressKanaJa: user.addressKanaJa ?? '',
      commuteMinutes: user.commuteMinutes != null ? String(user.commuteMinutes) : '',
      dependentsCount: user.dependentsCount != null ? String(user.dependentsCount) : '',
      hasSpouse: user.hasSpouse ?? false,
      spouseIsDependent: user.spouseIsDependent ?? false,
      preferredConditions: user.preferredConditions ?? '',
      certifications: user.certifications ?? [],
      email: user.email ?? '',
      nameEn: user.nameEn,
      nameJa: user.nameJa,
      headlineEn: user.headlineEn,
      headlineJa: user.headlineJa,
      university: user.university,
      universityJa: user.universityJa,
      faculty: user.faculty,
      facultyJa: user.facultyJa,
      japaneseLevel: user.japaneseLevel,
      openToWork: user.openToWork,
      skillsEn: user.skills.join(', '),
      skillsJa: user.skillsJa.join(', '),
      bioEn: user.bioEn,
      bioJa: user.bioJa,
      availableFrom: user.availableFrom,
      availableFromJa: user.availableFromJa,
      languages: user.languages,
      experience: user.experience,
      residenceArea: user.residenceArea ?? '',
      devExperienceYears: user.devExperienceYears != null ? String(user.devExperienceYears) : '',
      yearsInJapan: user.yearsInJapan != null ? String(user.yearsInJapan) : '',
      returnHomeMonth: user.returnHomeMonth ?? '',
      hobbies: user.hobbies ?? '',
      videoUrl: user.videoUrl ?? '',
      pastClients: (user.pastClients ?? []).join(', '),
      avatarUrl: user.avatarUrl ?? '',
    })
    setEditing(true)
    setSaved(false)
    discardAvatarPick()
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      setAvatarError(lang === 'ja' ? 'ファイルサイズは5MB以下にしてください。' : 'File must be under 5MB.')
      return
    }

    setAvatarError('')
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  function discardAvatarPick() {
    setAvatarFile(null)
    setAvatarPreview('')
    setAvatarError('')
  }

  useEffect(() => {
    if (saved || saveError) resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [saved, saveError])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    if (saving) return
    setSaving(true)
    setSaveError('')
    setTranslateWarn(false)
    try {

      // 写真を選んでいれば、ここで初めてStorageへ送る。失敗したら保存自体を中断して
      // 編集画面に留まる（黙って写真だけ落として保存すると気づけないため）。
      let avatarUrl = form.avatarUrl
      if (avatarFile) {
        try {
          avatarUrl = await uploadProfileImage(avatarFile, user.id)
        } catch {
          setAvatarError(lang === 'ja' ? 'アップロードに失敗しました。' : 'Upload failed.')
          return
        }
      }

      // 日本語が空の項目をまとめて翻訳する。CV取り込み直後は英語しか入らず、
      // ここを通さないと企業が日本語で見たときに職務経歴や学歴が空欄になる。
      // 会社名と氏名は固有名詞なので機械翻訳しない（表示側の pick が原文を出す）。
      const expPairs = form.experience.flatMap(e => [
        { en: e.role, ja: e.roleJa },
        { en: e.descriptionEn, ja: e.descriptionJa },
      ])
      const jaPairs = [
        { en: form.headlineEn, ja: form.headlineJa },
        { en: form.bioEn, ja: form.bioJa },
        { en: form.university, ja: form.universityJa },
        { en: form.faculty, ja: form.facultyJa },
        ...expPairs,
      ]
      const needingJa = jaPairs.filter(p => !p.ja.trim() && p.en.trim()).length

      const skillsEnArr = form.skillsEn.split(',').map(s => s.trim()).filter(Boolean)
      const skillsJaArrInput = form.skillsJa.split(',').map(s => s.trim()).filter(Boolean)

      // 本文とスキルの翻訳を並列で投げる。直列だと、翻訳が落ちているときに
      // 打ち切りの8秒が2回積み上がって16秒待たされる。
      const [filled, skillsTranslated] = await Promise.all([
        fillMissingJapanese(jaPairs),
        skillsJaArrInput.length === 0 && skillsEnArr.length > 0
          ? translateToJa(skillsEnArr)
          : Promise.resolve<string[]>([]),
      ])
      const [headlineJa, bioJa, universityJa, facultyJa] = filled
      // 翻訳すべき項目があったのに1つも埋まらなかったら Edge Function 側が
      // 落ちている。保存は通すが、英語のままである旨を画面に出す。
      const translatedCount = filled.filter((v, i) => v.trim() && v !== jaPairs[i].ja).length
      // 保存が成功したときだけ出す。下の updateProfile が失敗した場合は
      // saveError 側で伝えるので、ここは立てっぱなしにしない。
      const translationFailed = needingJa > 0 && translatedCount === 0
      const experienceJa = form.experience.map((e, i) => ({
        ...e,
        roleJa: filled[4 + i * 2] || e.roleJa,
        descriptionJa: filled[4 + i * 2 + 1] || e.descriptionJa,
      }))

      // 翻訳できなかった分は空文字で返るので落とす。そのまま保存すると
      // 日本語表示が「・・・・」だけの空スキルになる。
      const skillsJaArr = skillsJaArrInput.length > 0
        ? skillsJaArrInput
        : skillsTranslated.filter(Boolean)

      const updates: Partial<User> = {
        email: form.email,
        nameEn: form.nameEn,
        nameJa: form.nameJa,
        headlineEn: form.headlineEn,
        headlineJa,
        university: form.university,
        universityJa,
        faculty: form.faculty,
        facultyJa,
        japaneseLevel: form.japaneseLevel,
        openToWork: form.openToWork,
        skills: skillsEnArr,
        skillsJa: skillsJaArr,
        bioEn: form.bioEn,
        bioJa,
        availableFrom: form.availableFrom,
        availableFromJa: form.availableFromJa,
        languages: form.languages,
        experience: experienceJa,
        residenceArea: form.residenceArea || undefined,
        devExperienceYears: form.devExperienceYears ? Number(form.devExperienceYears) : undefined,
        yearsInJapan: form.yearsInJapan ? Number(form.yearsInJapan) : undefined,
        returnHomeMonth: form.returnHomeMonth || undefined,
        hobbies: form.hobbies || undefined,
        videoUrl: form.videoUrl || undefined,
        pastClients: form.pastClients.split(',').map(s => s.trim()).filter(Boolean),
        avatarUrl: avatarUrl || undefined,
        // 履歴書用。空文字は「未入力」として null 相当で送る。
        nameKanaJa: form.nameKanaJa,
        phone: form.phone,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        postalCode: form.postalCode,
        addressLine: form.addressLine,
        addressKanaJa: form.addressKanaJa,
        commuteMinutes: form.commuteMinutes ? Number(form.commuteMinutes) : undefined,
        dependentsCount: form.dependentsCount ? Number(form.dependentsCount) : undefined,
        hasSpouse: form.hasSpouse,
        spouseIsDependent: form.spouseIsDependent,
        preferredConditions: form.preferredConditions,
        certifications: form.certifications,
      }
      const { error } = await updateProfile(updates)
      if (error) {
        // 画面に出す。以前は error を見ておらず、失敗しても「保存しました」と
        // 表示して編集内容が消えていた。
        setSaveError(error)
        return
      }
      discardAvatarPick()
      setEditing(false)
      setSaved(true)
      if (translationFailed) setTranslateWarn(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      // 翻訳やアップロードで例外が飛ぶと、以前はここで無言で止まっていた。
      // 利用者からは「押しても何も起きない」ようにしか見えない。
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  function setField<K extends keyof EditForm>(key: K, value: EditForm[K]) {
    setForm(f => f ? { ...f, [key]: value } : f)
  }

  // CVから読み取った値はフォームに載せるだけで、保存は通常の「変更を保存」に任せる。
  // 英語欄を置き換えたときは、対応する日本語欄が古い内容のまま残ると英日で食い違うため
  // 空にしておく。保存時の自動翻訳が新しい英語から埋め直す。
  function applyCvFields(fields: CvFields) {
    // 英語を取り込んだら、対になる日本語は原則いったん空にする。
    // 前のプロフィールの日本語が残ると、英語と食い違ったまま保存される。
    // ただしCV自身に日本語の記述があった場合はそれを採る。空にして
    // 保存時の自動翻訳に任せると、日本語→英語→日本語の往復になり
    // 本人が書いた言葉が失われる。
    const ja: Partial<EditForm> = {
      ...(fields.headlineEn != null && { headlineJa: fields.headlineJa ?? '' }),
      ...(fields.bioEn != null && { bioJa: fields.bioJa ?? '' }),
      ...(fields.nameEn != null && fields.nameJa ? { nameJa: fields.nameJa } : {}),
      // スキルは語単位で、CV側の日本語は取っていないので常に翻訳に任せる
      ...(fields.skillsEn != null && { skillsJa: '' }),
    }
    // CvFields と EditForm で形が違う項目はここで詰め替える。
    const { certifications: certs, ...rest } = fields
    const extra: Partial<EditForm> = certs
      ? { certifications: certs.map(c => ({ name: c.name, acquiredOn: c.year ? `${c.year}-01-01` : undefined })) }
      : {}
    setForm(f => f ? { ...f, ...rest, ...extra, ...ja } : f)
    setCvOpen(false)
  }


  async function handleSubmitForReview() {
    setSubmitting(true)
    await submitForReview()
    setSubmitting(false)
  }

  const hasAdditionalInfo = !!(user.residenceArea || user.devExperienceYears || user.yearsInJapan || user.returnHomeMonth || user.hobbies || user.videoUrl || (user.pastClients && user.pastClients.length > 0))
  const statusColor = STATUS_COLOR[user.status] ?? STATUS_COLOR.draft

  return (
    <div className="min-h-screen line-page">
      {/* 保存中は画面全体を覆う。フォームが長く、保存ボタンは最下部にあるため、
          ボタンの文字を変えるだけでは「押しても何も起きない」ようにしか見えない。
          二重送信も物理的に止まる。 */}
      {saving && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center"
             style={{ backgroundColor: 'rgba(250,248,244,0.86)' }}
             role="status" aria-live="polite">
          <div className="flex flex-col items-center gap-4">
            <span className="block h-8 w-8 border-2 border-hairline border-t-ink rounded-full animate-spin" />
            <p className="text-ink text-sm">{t(lang, 'dashboard.saving')}</p>
            <p className="text-ink-faint text-xs max-w-xs text-center px-6">
              {t(lang, 'dashboard.savingNote')}
            </p>
          </div>
        </div>
      )}
      <Navbar />
      <EmailVerificationNotice />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
          <div>
            <p className="text-ink-soft text-sm mb-1">{t(lang, 'dashboard.welcome')}</p>
            <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl tracking-wide">
              {name} {user.flag}
            </h1>
          </div>
          {!editing && (
            <button onClick={startEdit} className="btn-line whitespace-nowrap self-start">
              {t(lang, 'dashboard.editBtn')}
            </button>
          )}
        </div>

        <div ref={resultRef} className="scroll-mt-24">
        {saved && (
          <div className="mb-6 px-4 py-3 border text-sm flex items-center gap-2"
               style={{ borderColor: '#1D7E5C', color: '#1D7E5C' }}>
            ✓ {t(lang, 'dashboard.savedMsg')}
          </div>
        )}

        {/* 保存できなかったことを必ず画面に出す。黙って止まると、
            利用者は保存できたと思って編集内容を失う。 */}
        {saveError && (
          <div className="mb-6 px-4 py-3 border border-seal text-seal text-sm" role="alert">
            <p className="font-medium">{t(lang, 'dashboard.saveFailed')}</p>
            <p className="mt-1 text-xs break-all opacity-80">{saveError}</p>
          </div>
        )}

        {/* 保存自体は成功しているので警告どまり */}
        {translateWarn && (
          <div className="mb-6 px-4 py-3 border border-hairline text-ink-soft text-sm">
            {t(lang, 'dashboard.translateFailed')}
          </div>
        )}
        </div>

        {editing && form ? (
          <form onSubmit={handleSave}>
            <section className="line-card p-6 mb-5 flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'dashboard.cvImportTitle')}
                </h2>
                <p className="text-sm text-ink-soft mt-2">{t(lang, 'dashboard.cvImportIntro')}</p>
              </div>
              <button type="button" onClick={() => setCvOpen(true)} className="btn-line whitespace-nowrap">
                {t(lang, 'dashboard.cvImport')}
              </button>
            </section>

            <CvImportDialog
              open={cvOpen}
              ownerId={user.id}
              currentValues={cvCurrentValues(form)}
              onApply={applyCvFields}
              onClose={() => setCvOpen(false)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="space-y-5">
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionBasic')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.photo')}</label>
                      <div className="flex items-center gap-4">
                        {avatarPreview || form.avatarUrl ? (
                          <img src={avatarPreview || form.avatarUrl} alt="" className="avatar-line w-16 h-16 text-lg" />
                        ) : (
                          <div className="avatar-line w-16 h-16 text-lg">
                            {user.initials}
                          </div>
                        )}
                        <label className="btn-line text-xs px-4 py-2 cursor-pointer">
                          {t(lang, 'dashboard.uploadPhoto')}
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                        </label>
                      </div>
                      {avatarError && <p className="text-xs mt-2 text-seal">{avatarError}</p>}
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.email')}</label>
                      <input className={INPUT_CLS} type="email" value={form.email}
                             onChange={e => setField('email', e.target.value)}
                             placeholder="your@email.com" />
                    </div>
                    {([
                      ['nameEn', 'dashboard.nameEn'],
                      ['nameJa', 'dashboard.nameJa'],
                      ['headlineEn', 'dashboard.headlineEn'],
                      ['headlineJa', 'dashboard.headlineJa'],
                      ['availableFrom', 'dashboard.availableFrom'],
                      ['availableFromJa', 'dashboard.availableFromJa'],
                    ] as const).map(([key, labelKey]) => (
                      <div key={key}>
                        <label className={LABEL_CLS}>{t(lang, labelKey)}</label>
                        <input className={INPUT_CLS} value={form[key]}
                               onChange={e => setField(key, e.target.value)}
                               placeholder={key === 'headlineJa' ? t(lang, 'jobs.autoTranslateHint') : undefined} />
                      </div>
                    ))}
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.returnHomeMonth')}</label>
                      <input className={INPUT_CLS} type="month" value={form.returnHomeMonth}
                             onChange={e => setField('returnHomeMonth', e.target.value)} />
                      <p className="text-xs text-ink-faint mt-1">{t(lang, 'dashboard.returnHomeMonthHint')}</p>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.japaneseLevel')}</label>
                      <select className={INPUT_CLS} value={form.japaneseLevel}
                              onChange={e => setField('japaneseLevel', e.target.value as JLPTLevel)}>
                        {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" id="openToWork" checked={form.openToWork}
                             onChange={e => setField('openToWork', e.target.checked)}
                             className="w-4 h-4 accent-ink cursor-pointer" />
                      <label htmlFor="openToWork" className="text-ink-soft text-sm cursor-pointer">
                        {t(lang, 'detail.openToWork')}
                      </label>
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionEducation')}
                  </h2>
                  <div className="space-y-4">
                    {([
                      ['university', 'dashboard.universityEn'],
                      ['universityJa', 'dashboard.universityJa'],
                      ['faculty', 'dashboard.facultyEn'],
                      ['facultyJa', 'dashboard.facultyJa'],
                    ] as const).map(([key, labelKey]) => (
                      <div key={key}>
                        <label className={LABEL_CLS}>{t(lang, labelKey)}</label>
                        <input className={INPUT_CLS} value={form[key]}
                               onChange={e => setField(key, e.target.value)} />
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-5">
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionSkills')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsEn')}</label>
                      <input className={INPUT_CLS} value={form.skillsEn}
                             onChange={e => setField('skillsEn', e.target.value)} placeholder="React, Python, SQL" />
                      <p className="text-ink-faint text-xs mt-1">{t(lang, 'dashboard.skillsHint')}</p>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.skillsJa')}</label>
                      <input className={INPUT_CLS} value={form.skillsJa}
                             onChange={e => setField('skillsJa', e.target.value)} placeholder={t(lang, 'jobs.autoTranslateHint')} />
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionBio')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.bioEn')}</label>
                      <textarea className={`${INPUT_CLS} resize-none`} rows={4}
                                value={form.bioEn} onChange={e => setField('bioEn', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.bioJa')}</label>
                      <textarea className={`${INPUT_CLS} resize-none`} rows={4}
                                value={form.bioJa} onChange={e => setField('bioJa', e.target.value)}
                                placeholder={t(lang, 'jobs.autoTranslateHint')} />
                    </div>
                  </div>
                </section>

                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-5">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.residenceArea')}</label>
                      <input className={INPUT_CLS} value={form.residenceArea}
                             onChange={e => setField('residenceArea', e.target.value)} placeholder="Tokyo" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={LABEL_CLS}>{t(lang, 'dashboard.devExperienceYears')}</label>
                        <input className={INPUT_CLS} type="number" min="0" value={form.devExperienceYears}
                               onChange={e => setField('devExperienceYears', e.target.value)} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{t(lang, 'dashboard.yearsInJapan')}</label>
                        <input className={INPUT_CLS} type="number" min="0" value={form.yearsInJapan}
                               onChange={e => setField('yearsInJapan', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.hobbies')}</label>
                      <input className={INPUT_CLS} value={form.hobbies}
                             onChange={e => setField('hobbies', e.target.value)} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.videoUrl')}</label>
                      <input className={INPUT_CLS} value={form.videoUrl}
                             onChange={e => setField('videoUrl', e.target.value)} placeholder="https://" />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>{t(lang, 'dashboard.pastClients')}</label>
                      <input className={INPUT_CLS} value={form.pastClients}
                             onChange={e => setField('pastClients', e.target.value)} />
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Languages */}
            <section className="line-card p-6 mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.languages')}
                </h2>
                <button type="button"
                        onClick={() => setField('languages', [...form.languages, { name: '', level: 'Conversational' }])}
                        className="btn-line-ghost cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              <div className="space-y-2">
                {form.languages.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input className={`${INPUT_CLS} flex-1`} value={l.name}
                           onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], name: e.target.value }; setField('languages', next) }}
                           placeholder={lang === 'ja' ? '言語名' : 'Language'} />
                    <select className={`${INPUT_CLS} !w-40 flex-shrink-0`} value={l.level}
                            onChange={e => { const next = [...form.languages]; next[i] = { ...next[i], level: e.target.value as LanguageLevel }; setField('languages', next) }}>
                      {LANG_LEVELS.map(lv => <option key={lv} value={lv}>{lv}</option>)}
                    </select>
                    <button type="button"
                            onClick={() => setField('languages', form.languages.filter((_, j) => j !== i))}
                            className="text-ink-faint hover:text-seal transition-colors cursor-pointer px-2">✕</button>
                  </div>
                ))}
              </div>
            </section>

            {/* Experience */}
            <section className="line-card p-6 mt-5">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                  {t(lang, 'detail.experience')}
                </h2>
                <button type="button"
                        onClick={() => setField('experience', [...form.experience, { company: '', companyJa: '', role: '', roleJa: '', period: '', descriptionEn: '', descriptionJa: '' }])}
                        className="btn-line-ghost cursor-pointer">
                  + {lang === 'ja' ? '追加' : 'Add'}
                </button>
              </div>
              {/* 1件あたり7入力あり、3件も入れるとフォームが延々と伸びて保存ボタンまで
                  遠くなる。2件を超えたらこの欄だけ内部スクロールにする。
                  1〜2件のときに枠を出すとかえって窮屈なので出さない。 */}
              <div className={`space-y-6 ${form.experience.length > 2
                ? 'max-h-[30rem] overflow-y-auto border border-hairline p-4'
                : ''}`}>
                {form.experience.map((exp, i) => (
                  <div key={i} className={`space-y-3 ${i > 0 ? 'pt-6 border-t border-hairline' : ''}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-ink-soft text-xs font-medium">{lang === 'ja' ? `経験 ${i + 1}` : `Experience ${i + 1}`}</p>
                      <button type="button"
                              onClick={() => setField('experience', form.experience.filter((_, j) => j !== i))}
                              className="text-ink-faint hover:text-seal transition-colors cursor-pointer text-xs">
                        {lang === 'ja' ? '削除' : 'Remove'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '会社名（英語）' : 'Company (EN)'}</label>
                        <input className={INPUT_CLS} value={exp.company}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], company: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '会社名（日本語）' : 'Company (JA)'}</label>
                        <input className={INPUT_CLS} value={exp.companyJa}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], companyJa: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '役職（英語）' : 'Role (EN)'}</label>
                        <input className={INPUT_CLS} value={exp.role}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], role: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '役職（日本語）' : 'Role (JA)'}</label>
                        <input className={INPUT_CLS} value={exp.roleJa}
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], roleJa: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div className="col-span-2">
                        <label className={LABEL_CLS}>{lang === 'ja' ? '期間' : 'Period'}</label>
                        <input className={INPUT_CLS} value={exp.period} placeholder="2024.06 – 2024.09"
                               onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], period: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '業務内容（英語）' : 'Description (EN)'}</label>
                        <textarea className={`${INPUT_CLS} resize-none`} rows={3} value={exp.descriptionEn}
                                  onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], descriptionEn: e.target.value }; setField('experience', next) }} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>{lang === 'ja' ? '業務内容（日本語）' : 'Description (JA)'}</label>
                        <textarea className={`${INPUT_CLS} resize-none`} rows={3} value={exp.descriptionJa}
                                  onChange={e => { const next = [...form.experience]; next[i] = { ...next[i], descriptionJa: e.target.value }; setField('experience', next) }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button type="button" onClick={() => { discardAvatarPick(); setEditing(false) }}
                      className="px-6 py-2.5 text-sm text-ink-soft hover:text-ink transition-colors cursor-pointer border border-hairline">
                {t(lang, 'dashboard.cancelBtn')}
              </button>
              <button type="submit" disabled={saving}
                      className="btn-line px-8 disabled:opacity-50 disabled:cursor-not-allowed">
                {saving ? t(lang, 'dashboard.saving') : t(lang, 'dashboard.saveBtn')}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 space-y-5">
              <div className="line-card p-6">
                <div className="flex items-center gap-4">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="avatar-line w-20 h-20 text-2xl" />
                  ) : (
                    <div className="avatar-line w-20 h-20 text-2xl">
                      {user.initials}
                    </div>
                  )}
                  <div>
                    <h2 className="font-display font-medium text-ink text-xl tracking-wide">{name}</h2>
                    <p className="text-ink-soft text-sm mt-0.5">
                      {pick(lang, user.countryJa, user.country)} · {pick(lang, user.fieldJa, user.field)}
                    </p>
                    {user.email && (
                      <p className="text-ink-faint text-xs mt-0.5">{user.email}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="badge-line">{user.japaneseLevel}</span>
                      {(pick(lang, user.availableFromJa, user.availableFrom)) && (
                        <span className="badge-line-ink">
                          {pick(lang, user.availableFromJa, user.availableFrom)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <section className="line-card p-6">
                <div className="flex items-center justify-between flex-wrap gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest">
                      {t(lang, 'dashboard.statusLabel')}
                    </h2>
                    <span className="text-xs font-medium uppercase tracking-wide pb-[2px]"
                          style={{ color: statusColor, borderBottom: `1.5px solid ${statusColor}` }}>
                      {t(lang, `dashboard.status${user.status.charAt(0).toUpperCase()}${user.status.slice(1)}`)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link to={`/talent/${user.id}`} className="btn-line-ghost text-xs px-4 py-2 no-underline whitespace-nowrap">
                      {t(lang, 'preview.openBtn')}
                    </Link>
                    {(user.status === 'draft' || user.status === 'rejected') && (
                      <button onClick={handleSubmitForReview} disabled={submitting}
                              className="btn-line text-xs px-4 py-2 disabled:opacity-50">
                        {submitting ? '···' : t(lang, user.status === 'rejected' ? 'dashboard.resubmit' : 'dashboard.submitForReview')}
                      </button>
                    )}
                  </div>
                </div>
                {(user.status === 'draft' || user.status === 'pending') && (
                  <p className="text-ink-faint text-xs mt-2 leading-relaxed">{t(lang, 'dashboard.submitForReviewHint')}</p>
                )}
                {user.status === 'rejected' && user.adminNote && (
                  <p className="text-ink-soft text-xs mt-2 leading-relaxed">
                    <span className="text-ink-faint">{t(lang, 'dashboard.adminNote')}: </span>"{user.adminNote}"
                  </p>
                )}
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.bio')}
                </h2>
                <p className="text-ink-soft text-sm leading-relaxed">{bio}</p>
              </section>

              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                  {t(lang, 'detail.skills')}
                </h2>
                <p className="text-ink-soft text-sm">{skills.join(' · ')}</p>
              </section>

              {hasAdditionalInfo && (
                <section className="line-card p-6">
                  <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-3">
                    {t(lang, 'dashboard.sectionAdditional')}
                  </h2>
                  <div className="space-y-2 text-sm">
                    {user.residenceArea && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.residenceArea')}: </span>{user.residenceArea}</p>
                    )}
                    {user.devExperienceYears != null && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.devExperienceYears')}: </span>{user.devExperienceYears}</p>
                    )}
                    {user.yearsInJapan != null && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.yearsInJapan')}: </span>{user.yearsInJapan}</p>
                    )}
                    {user.returnHomeMonth && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.returnHomeMonth')}: </span>{user.returnHomeMonth}</p>
                    )}
                    {user.hobbies && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.hobbies')}: </span>{user.hobbies}</p>
                    )}
                    {user.videoUrl && (
                      <p className="text-ink-soft">
                        <span className="text-ink-faint">{t(lang, 'dashboard.videoUrl')}: </span>
                        {isSafeHttpUrl(user.videoUrl) ? (
                          <a href={user.videoUrl} target="_blank" rel="noreferrer" className="text-seal hover:opacity-70 break-all">{user.videoUrl}</a>
                        ) : (
                          <span className="break-all">{user.videoUrl}</span>
                        )}
                      </p>
                    )}
                    {user.pastClients && user.pastClients.length > 0 && (
                      <p className="text-ink-soft"><span className="text-ink-faint">{t(lang, 'dashboard.pastClients')}: </span>{user.pastClients.join(', ')}</p>
                    )}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-5">
              <section className="line-card p-6">
                <h2 className="text-ink-faint text-xs font-semibold uppercase tracking-widest mb-4">
                  {t(lang, 'detail.education')}
                </h2>
                <div>
                  <p className="text-ink text-sm font-medium leading-snug">
                    {pick(lang, user.universityJa, user.university)}
                  </p>
                  <p className="text-ink-soft text-xs mt-1">
                    {pick(lang, user.facultyJa, user.faculty)}
                  </p>
                  <p className="text-ink-faint text-xs mt-0.5">{user.degree} · {user.graduationYear}</p>
                </div>
              </section>

              <div className="line-card p-6">
                <p className="text-ink-faint text-xs mb-3">{t(lang, 'dashboard.editHint')}</p>
                <button onClick={startEdit} className="btn-line w-full justify-center">
                  {t(lang, 'dashboard.editBtn')}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
