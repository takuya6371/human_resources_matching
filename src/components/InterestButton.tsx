import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLang } from '../App'
import { t } from '../i18n'
import { supabase } from '../lib/supabase'

interface Props {
  toUserId: string
  toType: 'talent' | 'company'
  small?: boolean
}

// 求人応募とは別の「興味あり」導線。企業アカウントがタレント一覧から
// 直接タレントに関心を示すために使う(bridgeのTalentBrowse.jsxの利用箇所を踏襲)。
// 現状は企業アカウントのみが使える導線(bridgeの利用箇所も同様)。
export default function InterestButton({ toUserId, toType, small }: Props) {
  const { company, accountType } = useAuth()
  const { lang } = useLang()
  const [interestId, setInterestId] = useState<string | null | undefined>(undefined)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!company) return
    let cancelled = false
    supabase
      .from('interests')
      .select('id')
      .eq('from_user_id', company.id)
      .eq('to_user_id', toUserId)
      .is('job_id', null)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setInterestId(data?.id ?? null) })
    return () => { cancelled = true }
  }, [company, toUserId])

  if (accountType !== 'company' || !company) return null

  async function toggle() {
    setBusy(true)
    if (interestId) {
      await supabase.from('interests').delete().eq('id', interestId)
      setInterestId(null)
    } else {
      const { data } = await supabase
        .from('interests')
        .insert({ from_user_id: company!.id, from_type: 'company', to_user_id: toUserId, to_type: toType })
        .select('id')
        .single()
      setInterestId(data?.id ?? null)
    }
    setBusy(false)
  }

  const sizeCls = small ? 'text-[10px] px-3 py-1.5' : 'text-[11px] px-6 py-3'

  return (
    <button
      onClick={toggle}
      disabled={busy || interestId === undefined}
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.1em] transition-colors cursor-pointer disabled:opacity-50 ${sizeCls} ${
        interestId ? 'border border-seal text-seal' : 'border border-hairline text-ink hover:border-ink'
      }`}
    >
      {busy ? '···' : interestId ? t(lang, 'follow.interested') : t(lang, 'follow.expressInterest')}
    </button>
  )
}
