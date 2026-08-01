import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

const INPUT_CLS = 'w-full bg-paper border border-hairline px-4 py-3 text-ink text-sm placeholder-ink-faint outline-none focus:border-ink transition-colors'
const LABEL_CLS = 'block text-ink-faint text-xs font-medium mb-2 uppercase tracking-wider'

export default function ContactPage() {
  const { lang } = useLang()
  const [name, setName] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [inquiryType, setInquiryType] = useState('hire')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t(lang, 'contact.errorEmpty'))
      return
    }
    setSubmitting(true)
    setError('')

    const { error: dbError } = await supabase.from('inquiries').insert({
      name: name.trim(),
      company: company.trim() || null,
      email: email.trim(),
      inquiry_type: inquiryType,
      message: message.trim(),
    })

    if (dbError) {
      setError(dbError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)
  }

  const INQUIRY_TYPES = [
    { value: 'hire',    label: t(lang, 'contact.typeHire') },
    { value: 'partner', label: t(lang, 'contact.typePartner') },
    { value: 'other',   label: t(lang, 'contact.typeOther') },
  ]

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <h1 className="font-display font-medium text-ink text-3xl tracking-wide mb-2">
            {t(lang, 'contact.title')}
          </h1>
          <p className="text-ink-soft text-sm">{t(lang, 'contact.subtitle')}</p>
        </div>

        {success ? (
          <div className="line-card p-10 text-center">
            <div className="avatar-line w-14 h-14 mx-auto mb-4">
              <span className="text-lg">✓</span>
            </div>
            <h2 className="font-display font-medium text-ink text-xl mb-2">{t(lang, 'contact.successTitle')}</h2>
            <p className="text-ink-soft text-sm mb-6">{t(lang, 'contact.successMsg')}</p>
            <Link to="/" className="btn-line no-underline inline-block">
              {t(lang, 'login.backToTop')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="line-card p-8 space-y-5">
            {error && (
              <div className="px-4 py-3 border border-seal text-seal text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLS}>{t(lang, 'contact.nameLabel')} *</label>
                <input className={INPUT_CLS} value={name}
                       onChange={e => { setName(e.target.value); setError('') }} />
              </div>
              <div>
                <label className={LABEL_CLS}>{t(lang, 'contact.companyLabel')}</label>
                <input className={INPUT_CLS} value={company}
                       onChange={e => setCompany(e.target.value)} />
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>{t(lang, 'contact.emailLabel')} *</label>
              <input type="email" className={INPUT_CLS} value={email}
                     onChange={e => { setEmail(e.target.value); setError('') }} />
            </div>

            <div>
              <label className={LABEL_CLS}>{t(lang, 'contact.typeLabel')}</label>
              <div className="flex gap-2 flex-wrap">
                {INQUIRY_TYPES.map(({ value, label }) => (
                  <button key={value} type="button"
                          onClick={() => setInquiryType(value)}
                          className={`px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer border ${
                            inquiryType === value
                              ? 'bg-ink text-paper border-ink' : 'border-hairline text-ink-soft hover:border-ink hover:text-ink'
                          }`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={LABEL_CLS}>{t(lang, 'contact.messageLabel')} *</label>
              <textarea className={`${INPUT_CLS} resize-none`} rows={5}
                        value={message}
                        onChange={e => { setMessage(e.target.value); setError('') }} />
            </div>

            <button type="submit" disabled={submitting}
                    className="btn-line w-full justify-center disabled:opacity-50">
              {submitting ? '···' : t(lang, 'contact.submitBtn')}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
