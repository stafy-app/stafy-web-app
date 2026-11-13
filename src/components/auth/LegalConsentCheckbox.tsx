import { AUTH_LINK } from '@stafy/components/auth/authStyles'
import { PRIVACY_URL, TERMS_URL } from '@stafy/utils/legalLinks'

interface LegalConsentCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
}

// Required, unticked-by-default acceptance of the Terms + acknowledgement of the Privacy notice.
// Used at registration (RegisterPage, CompleteRegistrationPage) and by LegalAcceptanceScreen.
export function LegalConsentCheckbox({ checked, onChange }: LegalConsentCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] leading-[1.5] text-[var(--color-ink-soft)]">
      <input
        type="checkbox"
        required
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="checkbox checkbox-primary checkbox-sm mt-0.5"
      />
      <span>
        Accept{' '}
        <a href={TERMS_URL} target="_blank" rel="noopener" className={AUTH_LINK}>
          Termenii și condițiile
        </a>{' '}
        și am citit{' '}
        <a href={PRIVACY_URL} target="_blank" rel="noopener" className={AUTH_LINK}>
          Politica de confidențialitate
        </a>
        .
      </span>
    </label>
  )
}
