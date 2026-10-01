import type { InputHTMLAttributes } from 'react'
import { AUTH_INPUT, AUTH_LEGEND } from './authStyles'

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Entrance stagger in ms; omit for no animation (fields that mount on interaction). */
  delay?: number
}

export function AuthField({ label, delay, className = '', ...input }: AuthFieldProps) {
  return (
    <fieldset
      className={`fieldset ${delay === undefined ? '' : 'animate-fade-slide-in'}`}
      style={delay === undefined ? undefined : { animationDelay: `${delay}ms` }}
    >
      <legend className={AUTH_LEGEND}>{label}</legend>
      <input {...input} className={`${AUTH_INPUT} ${className}`} />
    </fieldset>
  )
}
