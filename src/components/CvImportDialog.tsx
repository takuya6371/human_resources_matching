import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { useLang } from '../App'
import { t } from '../i18n'
import {
  CV_FIELD_KEYS, CV_FILE_ACCEPT, describeCvField, parseCv, uploadCv,
  type CvFieldKey, type CvFields,
} from '../lib/cvImport'

const FIELD_LABEL_KEYS: Record<CvFieldKey, string> = {
  nameEn: 'dashboard.nameEn',
  email: 'dashboard.email',
  headlineEn: 'dashboard.headlineEn',
  bioEn: 'dashboard.bioEn',
  university: 'dashboard.universityEn',
  faculty: 'dashboard.facultyEn',
  japaneseLevel: 'dashboard.japaneseLevel',
  devExperienceYears: 'dashboard.devExperienceYears',
  skillsEn: 'dashboard.skillsEn',
  languages: 'dashboard.cvFieldLanguages',
  experience: 'dashboard.cvFieldExperience',
}

// parse-cv が返すエラーコードのうち、利用者が自力で対処できるものは個別の文言を出す。
const ERROR_KEYS: Record<string, string> = {
  needs_ocr: 'dashboard.cvErrNeedsOcr',
  insufficient_text: 'dashboard.cvErrInsufficient',
  image_read_failed: 'dashboard.cvErrImage',
  docx_parse_failed: 'dashboard.cvErrDocx',
  file_too_large: 'dashboard.cvErrTooLarge',
  unsupported_type: 'dashboard.cvErrUnsupported',
  upload_failed: 'dashboard.cvErrUpload',
  rate_limited: 'dashboard.cvErrRateLimited',
  daily_limit: 'dashboard.cvErrDailyLimit',
  bad_api_key: 'dashboard.cvErrConfig',
  missing_gemini_key: 'dashboard.cvErrConfig',
}

interface Props {
  open: boolean
  ownerId: string
  currentValues: Record<CvFieldKey, string>
  onApply: (fields: CvFields) => void
  onClose: () => void
}

type Stage = 'pick' | 'uploading' | 'parsing' | 'review'

export default function CvImportDialog({ open, ownerId, currentValues, onApply, onClose }: Props) {
  const { lang } = useLang()
  const [stage, setStage] = useState<Stage>('pick')
  const [error, setError] = useState('')
  const [fields, setFields] = useState<CvFields>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<CvFieldKey>>(new Set())

  const rows = CV_FIELD_KEYS
    .map(key => ({ key, next: describeCvField(key, fields), current: currentValues[key] ?? '' }))
    .filter(r => r.next !== '')

  function reset() {
    setStage('pick')
    setError('')
    setFields({})
    setWarnings([])
    setSelected(new Set())
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setError('')
    try {
      setStage('uploading')
      const path = await uploadCv(file, ownerId)

      setStage('parsing')
      const result = await parseCv(path)

      setFields(result.fields)
      setWarnings(result.warnings)
      // 既に入力済みの項目は上書きしない初期状態にする。空欄だけ既定でチェック。
      setSelected(new Set(
        CV_FIELD_KEYS.filter(k =>
          describeCvField(k, result.fields) !== '' && !(currentValues[k] ?? '')
        )
      ))
      setStage('review')
    } catch (err) {
      const code = err instanceof Error ? err.message : 'extraction_failed'
      setError(t(lang, ERROR_KEYS[code] ?? 'dashboard.cvErrGeneric'))
      setStage('pick')
    }
  }

  function toggle(key: CvFieldKey) {
    setSelected(s => {
      const next = new Set(s)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function handleApply() {
    onApply(Object.fromEntries([...selected].map(k => [k, fields[k]])) as CvFields)
    reset()
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose() }}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t(lang, 'dashboard.cvImportTitle')}</DialogTitle>
          <DialogDescription>
            {stage === 'review' ? t(lang, 'dashboard.cvReviewHint') : t(lang, 'dashboard.cvImportIntro')}
          </DialogDescription>
        </DialogHeader>

        {stage === 'pick' && (
          <div>
            <label className="btn-line inline-block cursor-pointer">
              {t(lang, 'dashboard.cvPickFile')}
              <input type="file" accept={CV_FILE_ACCEPT} className="hidden" onChange={handleFile} />
            </label>
            {error && <p className="text-sm mt-4 text-seal">{error}</p>}
          </div>
        )}

        {(stage === 'uploading' || stage === 'parsing') && (
          <div className="py-6">
            <p className="text-sm text-ink">
              {t(lang, stage === 'uploading' ? 'dashboard.cvUploading' : 'dashboard.cvParsing')}
            </p>
            <p className="text-xs text-ink-faint mt-1">{t(lang, 'dashboard.cvParsingHint')}</p>
          </div>
        )}

        {stage === 'review' && (
          <div>
            {rows.length === 0 ? (
              <p className="text-sm text-ink-soft py-4">{t(lang, 'dashboard.cvNothingFound')}</p>
            ) : (
              <>
                {warnings.length > 0 && (
                  <div className="border border-hairline p-4 mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint mb-2">
                      {t(lang, 'dashboard.cvWarnings')}
                    </p>
                    <ul className="text-xs text-ink-soft space-y-1">
                      {warnings.map((w, i) => <li key={i}>{w}</li>)}
                    </ul>
                  </div>
                )}

                <div className="divide-y divide-hairline border-y border-hairline">
                  {rows.map(row => (
                    <label key={row.key} className="flex gap-3 py-3 cursor-pointer items-start">
                      <input
                        type="checkbox"
                        checked={selected.has(row.key)}
                        onChange={() => toggle(row.key)}
                        className="w-4 h-4 accent-ink cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold uppercase tracking-widest text-ink-faint">
                          {t(lang, FIELD_LABEL_KEYS[row.key])}
                        </p>
                        {row.current && (
                          <p className="text-xs text-ink-faint mt-1 whitespace-pre-line line-through">
                            {row.current}
                          </p>
                        )}
                        <p className="text-sm text-ink mt-1 whitespace-pre-line break-words">{row.next}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="flex gap-3 mt-5">
                  <button type="button" onClick={handleApply} disabled={selected.size === 0}
                          className="btn-line px-6 disabled:opacity-40 disabled:cursor-not-allowed">
                    {t(lang, 'dashboard.cvApply')}
                  </button>
                  <button type="button" onClick={handleClose} className="btn-line-ghost px-6">
                    {t(lang, 'dashboard.cancelBtn')}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
