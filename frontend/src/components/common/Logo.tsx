import { Plane } from 'lucide-react'
import clsx from 'clsx'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'light' | 'dark'
  showText?: boolean
  className?: string
}

const SIZES = {
  sm: { badge: 'w-8 h-8 rounded-lg',  icon: 14, title: 'text-sm',  subtitle: 'text-[10px]' },
  md: { badge: 'w-10 h-10 rounded-xl', icon: 18, title: 'text-lg',  subtitle: 'text-[10px]' },
  lg: { badge: 'w-16 h-16 rounded-2xl', icon: 30, title: 'text-3xl', subtitle: 'text-xs' },
}

/** Brand mark: gradient badge with plane glyph, optionally paired with the wordmark. */
export function Logo({ size = 'md', variant = 'light', showText = true, className }: LogoProps) {
  const s = SIZES[size]
  const onDark = variant === 'light'

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <div className={clsx(
        s.badge,
        'relative flex-shrink-0 flex items-center justify-center',
        'bg-gradient-to-br from-accent-400 via-brand-500 to-brand-800',
        'shadow-lg shadow-brand-900/30 ring-1 ring-white/15',
      )}>
        <Plane size={s.icon} strokeWidth={2.25} className="text-white -rotate-45 drop-shadow" />
      </div>
      {showText && (
        <div className="leading-tight">
          <p className={clsx(s.title, 'font-bold tracking-tight', onDark ? 'text-white' : 'text-gray-900')}>
            SkyFreight
          </p>
          <p className={clsx(s.subtitle, 'font-semibold uppercase tracking-[0.2em]', onDark ? 'text-accent-400' : 'text-accent-600')}>
            Cargo Portal
          </p>
        </div>
      )}
    </div>
  )
}
