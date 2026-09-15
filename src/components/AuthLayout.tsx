import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface AuthLayoutProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  footer?: ReactNode
  children: ReactNode
}

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen line-page flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 border border-hairline mb-4">
            <Icon className="w-6 h-6 text-ink" aria-hidden="true" />
          </div>
          <h1 className="font-display text-2xl text-ink tracking-wide">{title}</h1>
          {subtitle && <p className="text-ink-soft text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="line-card p-8">{children}</div>
        {footer && <p className="text-center text-sm text-ink-soft mt-6">{footer}</p>}
      </div>
    </div>
  )
}
