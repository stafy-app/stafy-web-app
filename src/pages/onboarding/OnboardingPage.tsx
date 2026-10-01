import { useState, type FormEvent } from 'react'
import { AuthCard } from '@stafy/components/auth/AuthCard'
import { AuthError } from '@stafy/components/auth/AuthError'
import { AuthField } from '@stafy/components/auth/AuthField'
import { AUTH_LEGEND, AUTH_SELECT, AUTH_SUBMIT } from '@stafy/components/auth/authStyles'
import { useCompleteOnboarding } from '@stafy/hooks/useCompleteOnboarding'
import { useCompanyJobTitles } from '@stafy/hooks/useCompanyJobTitles'

const OTHER_VALUE = '__other__'

export default function OnboardingPage() {
  const { mutateAsync, isPending } = useCompleteOnboarding()
  const { data: jobTitlesData, isLoading: isJobTitlesLoading } = useCompanyJobTitles()
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
    <AuthCard
      title="Completează profilul companiei"
      subtitle="Câteva detalii despre organizația ta înainte să continui."
      widthClass="max-w-[480px]"
    >
      {error && <AuthError message={error} />}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <AuthField
          label="Numele organizației"
          type="text"
          required
          value={organizationName}
          onChange={(event) => setOrganizationName(event.target.value)}
          placeholder="Numele organizației"
          delay={60}
        />

        <div className="grid gap-5 sm:grid-cols-2 sm:gap-3">
          <AuthField
            label="Oraș"
            type="text"
            required
            value={city}
            onChange={(event) => setCity(event.target.value)}
            placeholder="Orașul"
            delay={100}
          />
          <AuthField
            label="Adresă"
            type="text"
            required
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Strada și numărul"
            delay={130}
          />
        </div>

        <fieldset className="fieldset animate-fade-slide-in" style={{ animationDelay: '170ms' }}>
          <legend className={AUTH_LEGEND}>Funcția ta în organizație</legend>
          <select
            value={selectedJobTitle}
            onChange={(event) => setJobTitleSelection(event.target.value)}
            className={AUTH_SELECT}
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
          <AuthField
            label="Specifică funcția"
            type="text"
            required
            value={customJobTitle}
            onChange={(event) => setCustomJobTitle(event.target.value)}
            placeholder="Funcția ta"
            delay={0}
          />
        )}

        <button
          type="submit"
          disabled={isPending}
          className={`${AUTH_SUBMIT} animate-fade-slide-in`}
          style={{ animationDelay: '210ms' }}
        >
          {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
        </button>
      </form>
    </AuthCard>
  )
}
