import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { challengeDemo, type DemoProposal } from '../content/challengeDemo'

// チャレンジ機能の見本ページ。イベントで企業に見せるためのもの。
//
// **動かない。** 投稿も提案もできず、DBにも触らない。
// 中途半端に動くものを会場で見せると、WiFiが落ちたときに信用を失うし、
// フォームを置くと誰かが本気で提案を書いてしまう。構想段階であることを
// 画面上部に明記したうえで、記入済みの例だけを見せる。
//
// ナビには出していない。見せたい相手（企業）にだけ届くよう、
// /for-companies からの導線と直接URLだけにしてある。
//
// 設計の中身は docs/challenge-design.md を参照。

const STATE_STYLE: Record<DemoProposal['state'], string> = {
  awarded: 'bg-ink text-paper',
  shortlisted: 'border border-ink text-ink',
  submitted: 'border border-hairline text-ink-faint',
}

export default function ChallengePreviewPage() {
  const { lang } = useLang()
  const c = challengeDemo(lang)
  const ch = c.featured

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />

      {/* 構想段階であることを隠さない。期待を持たせすぎないため。 */}
      <div className="border-b border-seal/30 bg-seal/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="badge-line-ink text-[11px] shrink-0">{c.draftBadge}</span>
          <p className="text-ink-soft text-sm leading-relaxed">{c.draftNote}</p>
        </div>
      </div>

      <main className="flex-1">

        <section className="py-14 sm:py-20 px-4 sm:px-6 border-b border-hairline">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display font-medium text-ink text-3xl sm:text-5xl leading-tight">
              {c.heroTitle.split('\n').map((line, i) => (
                <span key={i} className="block">{line}</span>
              ))}
            </h1>
            <p className="mt-5 max-w-2xl text-ink-soft text-base leading-relaxed">{c.heroLead}</p>
            <p className="mt-6 text-ink-faint text-xs">{c.fictionNote}</p>
          </div>
        </section>

        {/* 見本の課題 */}
        <section className="py-12 sm:py-16 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <article className="line-card p-6 sm:p-10">
              <p className="text-ink-faint text-[11px] uppercase tracking-widest">{ch.industry}</p>
              <p className="mt-2 text-ink font-medium text-sm">{ch.company}</p>
              <h2 className="mt-4 font-display text-ink text-xl sm:text-3xl leading-snug">{ch.title}</h2>

              <div className="mt-8 grid gap-8 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <p className="label-line">{c.labelProblem}</p>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed whitespace-pre-line">{ch.problem}</p>

                  <p className="label-line mt-7">{c.labelLookingFor}</p>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{ch.lookingFor}</p>
                </div>

                <aside className="sm:border-l sm:border-hairline sm:pl-8">
                  <p className="label-line">{c.labelDeadline}</p>
                  <p className="mt-1 text-ink text-sm tabular-nums">{ch.deadline}</p>

                  <p className="label-line mt-6">{c.labelReward}</p>
                  <p className="mt-1 text-ink text-sm leading-relaxed">{ch.reward}</p>

                  <p className="label-line mt-6">{c.labelAreas}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ch.areas.map(a => (
                      <span key={a} className="border border-hairline px-2 py-1 text-ink-soft text-[11px]">{a}</span>
                    ))}
                  </div>
                </aside>
              </div>
            </article>

            {/* 届いた提案 */}
            <h3 className="mt-14 font-display text-ink text-lg sm:text-xl">
              {c.labelProposals}
              <span className="ml-3 text-ink-faint text-sm tabular-nums">{ch.proposals.length}</span>
            </h3>

            <div className="mt-5 space-y-4">
              {ch.proposals.map(p => (
                <article key={p.author} className="line-card p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-ink font-medium text-sm">{p.author}</p>
                      <p className="mt-1 text-ink-faint text-xs">{p.headline}</p>
                    </div>
                    <span className={`px-3 py-1 text-[11px] uppercase tracking-widest shrink-0 ${STATE_STYLE[p.state]}`}>
                      {p.stateLabel}
                    </span>
                  </div>

                  <p className="label-line mt-6">{c.labelApproach}</p>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed whitespace-pre-line">{p.approach}</p>

                  <p className="label-line mt-5">{c.labelResult}</p>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{p.result}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 設計上の約束。企業にも人材にも、ここが一番の説明になる。 */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 border-y border-hairline">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-ink text-xl sm:text-2xl">{c.principlesTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {c.principles.map((p, i) => (
                <div key={p.title} className="line-card p-6">
                  <span className="font-display text-ink-faint text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="mt-3 text-ink font-medium text-sm leading-snug">{p.title}</h3>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ほかの課題。範囲の広さを見せるためで、詳細は作らない。 */}
        <section className="py-14 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-ink text-xl sm:text-2xl">{c.otherTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {c.others.map(o => (
                <div key={o.title} className="line-card p-6">
                  <p className="text-ink-faint text-[11px] uppercase tracking-widest">{o.company}</p>
                  <h3 className="mt-3 text-ink font-medium text-sm leading-snug">{o.title}</h3>
                  <p className="mt-2 text-ink-soft text-sm leading-relaxed">{o.summary}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {o.areas.map(a => (
                      <span key={a} className="border border-hairline px-2 py-1 text-ink-faint text-[11px]">{a}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 企業が最初に引っかかるのは、源泉徴収と送金。先回りして答えておく。
            根拠と論点は docs/payments-and-verification.md を参照。 */}
        <section className="py-14 sm:py-20 px-4 sm:px-6 border-t border-hairline">
          <div className="max-w-5xl mx-auto">
            <h2 className="font-display text-ink text-xl sm:text-2xl">{c.faqTitle}</h2>
            <p className="mt-3 max-w-2xl text-ink-soft text-sm leading-relaxed">{c.faqLead}</p>
            <dl className="mt-8 border-t border-hairline">
              {c.faq.map(item => (
                <div key={item.q} className="border-b border-hairline py-6 sm:grid sm:grid-cols-3 sm:gap-8">
                  <dt className="text-ink font-medium text-sm leading-snug">{item.q}</dt>
                  <dd className="mt-2 sm:mt-0 sm:col-span-2 text-ink-soft text-sm leading-relaxed">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="py-14 sm:py-20 px-4 sm:px-6">
          <div className="max-w-5xl mx-auto">
            <div className="line-card p-8 sm:p-10">
              <h2 className="font-display text-ink text-xl sm:text-2xl">{c.ctaTitle}</h2>
              <p className="mt-3 max-w-2xl text-ink-soft text-sm leading-relaxed">{c.ctaBody}</p>
              <div className="mt-8">
                <Link to="/contact" className="btn-line no-underline">{c.ctaButton}</Link>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
