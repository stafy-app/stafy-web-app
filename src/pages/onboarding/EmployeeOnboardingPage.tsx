import { useState, type FormEvent } from 'react'
import { useNavigate } from '@tanstack/react-router'
import logoMark from '@stafy/assets/stafy_logo.svg'
import { useCompleteEmployeeOnboarding } from '@stafy/hooks/useCompleteEmployeeOnboarding'
import { useJobTitles } from '@stafy/hooks/useJobTitles'

const OTHER_VALUE = '__other__'

export default function EmployeeOnboardingPage() {
  const { mutateAsync, isPending } = useCompleteEmployeeOnboarding()
  const navigate = useNavigate()
  const { data: jobTitlesData, isLoading: isJobTitlesLoading } = useJobTitles()
  const jobTitles = jobTitlesData?.data ?? []

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [jobTitleSelection, setJobTitleSelection] = useState('')
  const [customJobTitle, setCustomJobTitle] = useState('')
  const [error, setError] = useState<string | null>(null)

  const selectedJobTitle = jobTitleSelection || jobTitles[0]?.label || ''
  const isOtherJobTitle = selectedJobTitle === OTHER_VALUE

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)

    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
      setError('Completează prenumele și numele (minim 2 caractere).')
      return
    }
    const jobTitle = isOtherJobTitle ? customJobTitle.trim() : selectedJobTitle
    if (!jobTitle) {
      setError('Completează funcția ta.')
      return
    }

    try {
      await mutateAsync({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        job_title: jobTitle,
      })
      navigate({ to: '/me' })
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
          Completează-ți profilul
        </h1>
        <p className="animate-fade-slide-in mb-2 text-sm text-[var(--color-ink-muted)]" style={{ animationDelay: '60ms' }}>
          Câteva detalii despre tine înainte să continui
        </p>

        {error && (
          <div role="alert" className="alert alert-error animate-fade-slide-in mb-2 text-sm">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="animate-fade-slide-in grid grid-cols-2 gap-3" style={{ animationDelay: '100ms' }}>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Prenume</legend>
              <input
                type="text"
                required
                minLength={2}
                maxLength={30}
                autoComplete="given-name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                className="input w-full"
                placeholder="Andrei"
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Nume</legend>
              <input
                type="text"
                required
                minLength={2}
                maxLength={30}
                autoComplete="family-name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                className="input w-full"
                placeholder="Popescu"
              />
            </fieldset>
          </div>

          <fieldset className="fieldset animate-fade-slide-in" style={{ animationDelay: '140ms' }}>
            <legend className="fieldset-legend">Funcția ta</legend>
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
                placeholder="Ex: Casier"
              />
            </fieldset>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="animate-fade-slide-in btn btn-primary mt-2"
            style={{ animationDelay: '180ms' }}
          >
            {isPending ? <span className="loading loading-spinner loading-sm" /> : 'Continuă'}
          </button>
        </form>
      </div>
    </div>
  )
}
