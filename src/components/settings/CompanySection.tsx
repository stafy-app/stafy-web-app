import { useState, type FormEvent } from 'react'
import { useProfile } from '@stafy/hooks/useProfile'
import { useCompany, useUpdateCompany } from '@stafy/hooks/useCompanySettings'
import { showToast } from '@stafy/lib/toast'
import type { CompanyOut } from '@stafy/api/generated/endpoints/index.schemas'

export function CompanySection() {
  const { data: profile } = useProfile()
  const { data: company } = useCompany()
  if (!profile || !company) return null
  return <CompanyForm key={company.id} isOwnCompany={profile.is_own_company !== false} company={company} />
}

function CompanyForm({ isOwnCompany, company }: { isOwnCompany: boolean; company: CompanyOut }) {
  const { mutateAsync, isPending } = useUpdateCompany()

  const [name, setName] = useState(company.name ?? '')
  const [city, setCity] = useState(company.city ?? '')
  const [address, setAddress] = useState(company.address ?? '')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    try {
      await mutateAsync({ name, city, address })
      showToast('Modificările au fost salvate.')
    } catch {
      showToast('Nu am putut salva modificările.', { tone: 'danger' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">Companie</h2>
        <p className="text-[13px] text-[var(--color-ink-muted)]">
          {isOwnCompany
            ? 'Datele companiei tale.'
            : 'Faci parte dintr-o companie administrată de alt manager — doar acesta îi poate modifica datele.'}
        </p>
      </div>

      <fieldset className="fieldset">
        <legend className="fieldset-legend">Nume companie</legend>
        <input
          type="text"
          required
          disabled={!isOwnCompany}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input w-full"
        />
      </fieldset>

      <div className="grid grid-cols-2 gap-3">
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Oraș</legend>
          <input
            type="text"
            required
            disabled={!isOwnCompany}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="input w-full"
          />
        </fieldset>
        <fieldset className="fieldset">
          <legend className="fieldset-legend">Adresă</legend>
          <input
            type="text"
            required
            disabled={!isOwnCompany}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="input w-full"
          />
        </fieldset>
      </div>

      {isOwnCompany && (
        <div className="flex justify-end">
          <button type="submit" disabled={isPending} className="btn btn-primary">
            {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Salvează modificările'}
          </button>
        </div>
      )}
    </form>
  )
}
