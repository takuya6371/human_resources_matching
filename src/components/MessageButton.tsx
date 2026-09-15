import { useNavigate } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useLang } from '../App'
import { t } from '../i18n'

interface Props {
  talentId: string
  companyId: string
  small?: boolean
}

// 相手のプロフィールから会話を開始/再開する導線。呼び出し側(TalentDetailPage /
// CompanyPublicProfilePage)が「閲覧者は参加者のどちら側か」を判定した上で
// talentId/companyIdを渡す(bridgeのMessageButtonはtoUserId一本だったが、
// 現行スキーマはtalent_id/company_idを別カラムで持つためこの形にした)。
export default function MessageButton({ talentId, companyId, small }: Props) {
  const navigate = useNavigate()
  const { lang } = useLang()
  const sizeCls = small ? 'text-[10px] px-3 py-1.5' : 'text-[11px] px-6 py-3'

  return (
    <button
      onClick={() => navigate(`/messages?talent=${talentId}&company=${companyId}`)}
      className={`inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.1em] border border-hairline text-ink hover:border-ink transition-colors cursor-pointer ${sizeCls}`}
    >
      <MessageCircle className="h-3 w-3" /> {t(lang, 'follow.message')}
    </button>
  )
}
