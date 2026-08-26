import { useState, type FormEvent } from 'react'
import logoMark from '@stafy/assets/stafy_logo.svg'
import { useCompleteOnboarding } from '@stafy/hooks/useCompleteOnboarding'
import { useJobTitles } from '@stafy/hooks/useJobTitles'

const OTHER_VALUE = '__other__'

export default function OnboardingPage() {
  const { mutateAsync, isPending } = useCompleteOnboarding()
  const { data: jobTitlesData, isLoading: isJobTitlesLoading } = useJobTitles()
  const jobTitles = jobTitlesData?.data ?? []

  const [organizationName, setOrganizationName] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')
  // '' means "no explicit choice yet" — falls back to the first fetched option
  // below rather than being synced via an effect.
  const [jobTitleSelection, setJobTitleSelection] = useState('')
  const [customJobTitle, setCustomJobTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedJobTitle = jobTitleSelection || jobTitles[0]?.label || ''
  const isOtherJobTitle = selectedJobTitle === OTHER_VALUE

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    const jobTitle = isOtherJobTitle ? customJobTitle.trim() : selectedJobTitle
    if (!jobTitle) {
      setError('Completează funcția din organizație.')
      return
    }

    try {
      await mutateAsync({
        organization_name: organizationName,
        city,
        address,
        job_title: jobTitle,
      })
    } catch {
      setError('Nu am putut salva datele. Încearcă din nou.')
    }
  }

  return (
    <div className="card w-full max-w-md bg-base-100 shadow-xl">
      <div className="card-body">
        <div className="animate-fade-slide-in mb-1 flex items-center gap-2" style={{ animationDelay: '0ms' }}>
          <img src={logoMark} alt="Stafy" className="h-8 w-8 rounded-[7px]" />
          <span className="text-[20px] font-bold text-[var(--color-ink)]">Stafy</span>
        </div>
        <h1
          className="animate-fade-slide-in text-xl font-semibold text-[var(--color-ink)]"
          style={{ animationDelay: '30ms' }}
        >
          Completează profilul companiei
        </h1>
        <p className="animate-fade-slide-in mb-2 text-sm text-[var(--color-ink-muted)]" style={{ animationDelay: '60ms' }}>
          Câteva detalii despre organizația ta înainte să continui
        </p>

        {error && (
          <div role="alert" className="alert alert-error animate-fade-slide-in mb-2 text-sm">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <fieldset className="fieldset animate-fade-slide-in" style={{ animationDelay: '100ms' }}>
            <legend className="fieldset-legend">Numele organizației</legend>
            <input
              type="text"
              required
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="input w-full"
              placeholder="Ex: Acme SRL"
            />
          </fieldset>

          <div className="animate-fade-slide-in grid grid-cols-2 gap-3" style={{ animationDelay: '140ms' }}>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Oraș</legend>
              <input
                type="text"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="input w-full"
                placeholder="Cluj-Napoca"
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Adresă</legend>
              <input
                type="text"
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                className="input w-full"
                placeholder="Str. Exemplu nr. 1"
              />
            </fieldset>
          </div>

          <fieldset className="fieldset animate-fade-slide-in" style={{ animationDelay: '180ms' }}>
            <legend className="fieldset-legend">Funcția ta în organizație</legend>
            <select
              value={selectedJobTitle}
              onChange={(event) => setJobTitleSelection(event.target.value)}
              className="select w-full"
              disabled={isJobTitlesLoading}
            >
              {jobTitles.map((jobTitle) => (
                <option key={jobTitle.id} value={jobTitle.label}>
                  {jobTitle.label}
                </option>
              ))}
              <option value={OTHER_VALUE}>Altceva</option>
            </select>
          </fieldset>

          {isOtherJobTitle && (
            <fieldset className="fieldset animate-fade-slide-in">
              <legend className="fieldset-legend">Specifică funcția</legend>
              <input
                type="text"
                required
                value={customJobTitle}
                onChange={(event) => setCustomJobTitle(event.target.value)}
                className="input w-full"
                placeholder="Ex: Manager Vânzări"
              />
            </fieldset>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="animate-fade-slide-in btn btn-primary mt-2"
            style={{ animationDelay: '220ms' }}
          >
            {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
          </button>
        </form>
      </div>
    </div>
  )
}
