import { Logo } from '@/components/common/Logo'

interface Props {
  children: React.ReactNode
  subtitle?: string
}

export function AuthLayout({ children, subtitle }: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-brand-900 via-brand-800 to-brand-600
                    flex flex-col items-center justify-center p-4">
      {/* decorative glow */}
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full flex flex-col items-center">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size="lg" variant="light" />
          {subtitle && <p className="text-brand-200 mt-2 text-sm">{subtitle}</p>}
        </div>

        {children}

        <p className="text-center text-brand-300 text-xs mt-8">
          © {new Date().getFullYear()} SkyFreight Airlines. All rights reserved.
        </p>
      </div>
    </div>
  )
}
