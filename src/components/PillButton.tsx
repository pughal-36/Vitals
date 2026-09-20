import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outline'
  children: ReactNode
}

export function PillButton({
  variant = 'solid',
  className = '',
  children,
  ...props
}: PillButtonProps) {
  const variantClass = variant === 'outline' ? 'pill-btn-outline' : 'pill-btn-solid'
  return (
    <button
      className={`pill-btn ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
