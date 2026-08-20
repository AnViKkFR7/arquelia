import { Link } from 'react-router-dom'
import styles from './ButtonSlider.module.css'

type ButtonSliderProps =
  | { to: string; text: string; onClick?: never; type?: never; disabled?: never; loadingText?: never }
  | { to?: never; text: string; onClick?: () => void; type?: 'button' | 'submit'; disabled?: boolean; loadingText?: string }

const ArrowIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="none" width="18" height="18">
    <path d="M13.0457 8.13128L5.8733 15.3037L4.69479 14.1252L11.8672 6.95277L5.54568 6.95277L5.54568 5.28636H14.7121V14.4528L13.0457 14.4528V8.13128Z" fill="currentColor" />
  </svg>
)

export default function ButtonSlider(props: ButtonSliderProps) {
  const disabled = 'disabled' in props ? props.disabled : false
  const loadingText = 'loadingText' in props ? props.loadingText : undefined
  const label = disabled && loadingText ? loadingText : props.text

  const inner = (
    <div className={styles.btn_arrow__wrap}>
      <span className={styles.btn_arrow__text}>{label}</span>
      <div className={styles.btn_arrow__circle}>
        <ArrowIcon />
      </div>
      <div className={styles.btn_arrow__bg} />
    </div>
  )

  if (props.to) {
    return (
      <Link to={props.to} className={styles.btn_arrow}>
        {inner}
      </Link>
    )
  }

  return (
    <button
      type={props.type ?? 'button'}
      onClick={props.onClick}
      disabled={disabled}
      className={styles.btn_arrow}
    >
      {inner}
    </button>
  )
}
