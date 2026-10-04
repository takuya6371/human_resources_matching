import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { useLang } from '../App'
import { t } from '../i18n'
import { terms } from '../legal/terms'
import { privacy } from '../legal/privacy'
import { pickDoc, type LegalBlock } from '../legal/types'
import { OPERATOR, fillOperator, missingOperatorFields } from '../legal/operator'

type DocKey = 'terms' | 'privacy'

const DOCS = { terms, privacy }

// 条文は番号付きで読まれるので、箇条書きは常に連番を振る。
// 入れ子の括弧書き（第1項、第2項…）までは作り込まない。
function Block({ block }: { block: LegalBlock }) {
  return (
    <section className="mb-9">
      <h2 className="font-display text-ink text-base sm:text-lg mb-3">{fillOperator(block.heading)}</h2>

      {block.paragraphs?.map((p, i) => (
        <p key={i} className="text-ink-soft text-sm leading-relaxed mb-3 last:mb-0">{fillOperator(p)}</p>
      ))}

      {block.table && (
        // 横幅の狭い端末では表が潰れるため、横スクロールに逃がす。
        <div className="mt-4 -mx-4 sm:mx-0 overflow-x-auto">
          <table className="w-full min-w-[32rem] text-sm border-collapse">
            <thead>
              <tr>
                {block.table.head.map((h, i) => (
                  <th key={i} className="text-left font-medium text-ink text-xs uppercase tracking-wide
                                         border-b border-hairline py-2 px-4 align-bottom">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={`border-b border-hairline py-3 px-4 align-top leading-relaxed
                                            ${j === 0 ? 'text-ink w-2/5' : 'text-ink-soft'}`}>
                      {fillOperator(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {block.list && (
        <ol className="mt-4 space-y-2">
          {block.list.map((item, i) => (
            <li key={i} className="text-ink-soft text-sm leading-relaxed flex gap-3">
              <span className="text-ink-faint tabular-nums shrink-0 w-5 text-right">{i + 1}.</span>
              <span>{fillOperator(item)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

export default function LegalPage({ doc }: { doc: DocKey }) {
  const { lang } = useLang()
  const content = pickDoc(DOCS[doc], lang)
  const other: DocKey = doc === 'terms' ? 'privacy' : 'terms'
  const missing = missingOperatorFields()

  return (
    <div className="min-h-screen line-page flex flex-col">
      <Navbar />
      <main className="max-w-3xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex-1">
        <h1 className="font-display font-medium text-ink text-2xl sm:text-3xl mb-6">{content.title}</h1>

        {/* 公開前に事業者情報が空のまま出ていないか気づけるようにする。
            本番で出続けるようなら、埋め忘れているということ。 */}
        {missing.length > 0 && (
          <p className="mb-8 px-4 py-3 border border-seal/40 rounded text-seal text-xs leading-relaxed">
            {t(lang, 'legal.draftWarning')}（{missing.join(', ')}）
          </p>
        )}

        {content.intro?.map((p, i) => (
          <p key={i} className="text-ink-soft text-sm leading-relaxed mb-4">{fillOperator(p)}</p>
        ))}

        <div className="mt-10">
          {content.blocks.map((b, i) => <Block key={i} block={b} />)}
        </div>

        <div className="mt-12 pt-6 border-t border-hairline flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-ink-faint text-xs leading-relaxed">
            {content.dateLabel.effective}: {OPERATOR.effectiveDate || '—'}
            <span className="mx-2">·</span>
            {content.dateLabel.revised}: {OPERATOR.revisedDate || '—'}
          </p>
          <Link to={`/${other}`} className="text-sm text-seal hover:opacity-70">
            {t(lang, `legal.${other}`)}
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  )
}
