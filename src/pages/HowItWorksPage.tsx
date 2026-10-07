import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'

type Audience = 'talent' | 'company'

const STEP_KEYS = ['s1', 's2', 's3', 's4'] as const
const ADVANCE_MS = 4000

// 移植元(bridge-africa-talent/src/pages/HowItWorks.jsx)は framer-motion で
// アニメーションしていたが、このプロジェクトには入っていない。自動送り・
// 一時停止・プログレスバーという挙動だけCSSトランジションで再現する。
export default function HowItWorksPage() {
  const { lang } = useLang()
  const [audience, setAudience] = useState<Audience>('talent')
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(true)

  useEffect(() => { setStep(0) }, [audience])

  useEffect(() => {
    if (!playing) return
    const timer = setTimeout(() => setStep(s => (s + 1) % STEP_KEYS.length), ADVANCE_MS)
    return () => clearTimeout(timer)
  }, [step, playing, audience])

  const key = STEP_KEYS[step]
  const title = t(lang, `howItWorks.${audience}.${key}Title`)
  const desc = t(lang, `howItWorks.${audience}.${key}Desc`)
  const stepLabel = t(lang, 'howItWorks.stepLabel')
    .replace('{n}', String(step + 1))
    .replace('{total}', String(STEP_KEYS.length))

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="flex-1">

        <section className="py-16 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-6xl mx-auto">
            <h1 className="font-display font-medium text-ink text-3xl sm:text-5xl leading-tight">
              {t(lang, 'howItWorks.title')}
            </h1>
            <p className="mt-4 max-w-2xl text-ink-soft text-base leading-relaxed">
              {t(lang, 'howItWorks.lead')}
            </p>
          </div>
        </section>

        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">

            <div className="flex justify-center">
              <div className="inline-flex border border-hairline">
                {(['talent', 'company'] as Audience[]).map((a, i) => (
                  <button key={a} onClick={() => setAudience(a)}
                          className={`px-6 py-2 text-sm font-medium transition-colors cursor-pointer
                                      ${i > 0 ? 'border-l border-hairline' : ''}
                                      ${audience === a ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'}`}>
                    {t(lang, a === 'talent' ? 'howItWorks.tabTalent' : 'howItWorks.tabCompany')}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 line-card overflow-hidden">
              <div className="relative flex min-h-[18rem] items-center justify-center p-8 sm:p-12">
                <button onClick={() => setPlaying(p => !p)}
                        title={t(lang, playing ? 'howItWorks.pause' : 'howItWorks.play')}
                        className="absolute right-4 top-4 h-8 px-3 border border-hairline
                                   text-ink-soft text-xs hover:text-ink cursor-pointer">
                  {t(lang, playing ? 'howItWorks.pause' : 'howItWorks.play')}
                </button>

                {/* key を変えて再マウントし、フェードインをやり直させる */}
                <div key={`${audience}-${step}`} className="text-center fade-in-up">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center bg-ink">
                    <span className="font-display text-paper text-2xl tabular-nums">{step + 1}</span>
                  </div>
                  <p className="mt-5 text-seal text-[11px] uppercase tracking-widest">{stepLabel}</p>
                  <h2 className="mt-2 font-display text-ink text-xl sm:text-2xl">{title}</h2>
                  <p className="mx-auto mt-3 max-w-md text-ink-soft text-sm leading-relaxed">{desc}</p>
                </div>
              </div>

              <div className="flex items-start gap-2 border-t border-hairline p-4">
                {STEP_KEYS.map((k, i) => (
                  <button key={k} onClick={() => { setStep(i); setPlaying(false) }}
                          className="flex-1 text-left cursor-pointer group">
                    <div className="h-[3px] bg-hairline overflow-hidden">
                      <div className={`h-full bg-seal transition-[width] ease-linear
                                       ${i < step ? 'w-full' : i > step ? 'w-0' : playing ? 'w-full' : 'w-1/2'}`}
                           style={i === step && playing ? { transitionDuration: `${ADVANCE_MS}ms` } : undefined} />
                    </div>
                    <p className={`mt-2 text-[11px] leading-snug
                                   ${i === step ? 'text-ink font-medium' : 'text-ink-faint group-hover:text-ink-soft'}`}>
                      {t(lang, `howItWorks.${audience}.${k}Title`)}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-12 text-center">
              <Link to="/start" className="btn-line no-underline">{t(lang, 'howItWorks.cta')}</Link>
            </div>

          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
