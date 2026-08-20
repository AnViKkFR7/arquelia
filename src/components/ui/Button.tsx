import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import styles from './Button.module.css'

type Variant = 'solid' | 'gold' | 'outline' | 'ghost' | 'link'
type Size = 'sm' | 'md' | 'lg'

interface BaseProps {
  children: ReactNode
  variant?: Variant
  size?: Size
  className?: string
  /** Muestra la flecha animada a la derecha. */
  arrow?: boolean
}

interface ButtonProps extends BaseProps, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children'> {
  to?: never
  href?: never
}

interface LinkProps extends BaseProps {
  to: string
  href?: never
  /** Útil, p. ej., para cerrar un modal al navegar. */
  onClick?: () => void
}

interface AnchorProps extends BaseProps {
  href: string
  to?: never
  target?: string
  rel?: string
  onClick?: () => void
}

type Props = ButtonProps | LinkProps | AnchorProps

export function Button(props: Props) {
  const { children, variant = 'solid', size = 'md', className, arrow, ...rest } = props as BaseProps &
    Record<string, unknown>

  const cls = `${styles.btn} ${styles[variant]} ${styles[size]} ${className ?? ''}`

  const content = (
    <>
      <span className={styles.label}>{children}</span>
      {arrow && (
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      )}
    </>
  )

  if ('to' in props && props.to) {
    const { to, ...linkRest } = rest as { to: string }
    return (
      <Link to={to} className={cls} {...linkRest}>
        {content}
      </Link>
    )
  }

  if ('href' in props && props.href) {
    const { href, ...anchorRest } = rest as { href: string }
    return (
      <a href={href} className={cls} {...anchorRest}>
        {content}
      </a>
    )
  }

  return (
    <button type="button" className={cls} {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)}>
      {content}
    </button>
  )
}
