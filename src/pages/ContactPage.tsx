import { useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

const INPUT_CLS = 'w-full bg-dark-3 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 outline-none focus:border-a-orange/40 transition-colors'
const LABEL_CLS = 'block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider'

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
    <div className="min-h-screen bg-dark flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-medium text-white tracking-tight mb-2" style={{ letterSpacing: '-0.02em' }}>
            {t(lang, 'contact.title')}
          </h1>
          <p className="text-white/40 text-sm">{t(lang, 'contact.subtitle')}</p>
        </div>

        {success ? (
          <div className="bg-dark-2 rounded-2xl p-10 text-center" style={{ border: '0.5px solid rgba(29,158,117,0.2)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: 'rgba(29,158,117,0.15)' }}>
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-medium text-white mb-2">{t(lang, 'contact.successTitle')}</h2>
            <p className="text-white/50 text-sm mb-6">{t(lang, 'contact.successMsg')}</p>
            <Link to="/" className="btn-primary no-underline inline-block">
              {t(lang, 'login.backToTop')}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-dark-2 rounded-2xl p-8 space-y-5"
                style={{ border: '0.5px solid rgba(255,255,255,0.08)' }}>
            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                   style={{ background: 'rgba(216,90,48,0.1)', color: '#D85A30', border: '0.5px solid rgba(216,90,48,0.2)' }}>
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
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                            inquiryType === value
                              ? 'text-white' : 'text-white/40 hover:text-white/70'
                          }`}
                          style={inquiryType === value
                            ? { background: 'rgba(216,90,48,0.15)', border: '0.5px solid rgba(216,90,48,0.4)' }
                            : { background: 'rgba(255,255,255,0.04)', border: '0.5px solid rgba(255,255,255,0.08)' }
                          }>
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
                    className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, #D85A30 0%, #BA7517 100%)' }}>
              {submitting ? '...' : t(lang, 'contact.submitBtn')}
            </button>
          </form>
        )}
      </main>

      <Footer />
    </div>
  )
}
