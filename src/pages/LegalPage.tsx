import { useTranslation } from 'react-i18next'

interface LegalPageProps {
  slug: 'notice' | 'cookies' | 'privacy'
}

export function LegalPage({ slug }: LegalPageProps) {
  const { t } = useTranslation()

  return (
    <div className="container" style={{ paddingBlock: '10rem 6rem', maxWidth: 800 }}>
      <h1>{t(`legal.${slug}.title`)}</h1>
      <p style={{ marginTop: '2rem' }}>{t(`legal.${slug}.text`)}</p>
    </div>
  )
}
