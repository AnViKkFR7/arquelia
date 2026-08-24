import { useTranslation } from 'react-i18next'
import { PageHero } from '../components/ui/PageHero'
import { SectionHeader } from '../components/ui/SectionHeader'
import { Reveal } from '../components/ui/Reveal'
import { Marquee } from '../components/ui/Marquee'
import { CtaBand } from '../components/home/CtaBand'
import styles from './AboutPage.module.css'

import heroImg from '../assets/livingroom_kitchen.webp'
import portraitImg from '../assets/cocina_01.jpg'

interface Pillar {
  n: string
  title: string
  desc: string
}

interface NumberStat {
  value: string
  label: string
}

export function AboutPage() {
  const { t } = useTranslation()
  const pillars = t('about.pillars.items', { returnObjects: true }) as Pillar[]
  const numbers = t('about.numbers.items', { returnObjects: true }) as NumberStat[]

  return (
    <>
      <PageHero
        eyebrow={t('about.hero.eyebrow')}
        title={
          <>
            {t('about.hero.titleLine1')}
            <br />
            {t('about.hero.titleLine2')}
          </>
        }
        image={heroImg}
        tall
      />

      {/* Texto de empresa */}
      <section className={`section ${styles.intro}`}>
        <div className={`container ${styles.introGrid}`}>
          <Reveal variant="up">
            <p className={styles.introLead}>{t('about.intro.lead')}</p>
          </Reveal>

          <Reveal variant="up" delay={100}>
            <div className={styles.introText}>
              <p>
                {t('about.intro.p1')} <strong>{t('about.intro.p1Strong')}</strong>
              </p>
              <p>{t('about.intro.p2')}</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Franja de marquesina */}
      <div className={styles.band}>
        <Marquee text={t('about.band')} separator="◆" speed={62} />
      </div>

      {/* Tres pilares */}
      <section className={`section ${styles.pillars}`}>
        <div className="container">
          <SectionHeader
            index="01"
            eyebrow={t('about.pillars.eyebrow')}
            title={t('about.pillars.title')}
            lead={t('about.pillars.lead')}
          />

          <div className={styles.pillarsGrid}>
            {pillars.map((p, i) => (
              <Reveal key={p.n} variant="up" delay={i * 110} className={styles.pillar}>
                <span className={styles.pillarNumber}>{p.n}</span>
                <h3 className={styles.pillarTitle}>{p.title}</h3>
                <p className={styles.pillarDesc}>{p.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Cifras + imagen */}
      <section className={styles.numbers}>
        <div className={`container ${styles.numbersGrid}`}>
          <Reveal variant="clip" className={styles.numbersImage}>
            <img src={portraitImg} alt={t('about.numbers.imageAlt')} loading="lazy" />
          </Reveal>

          <div className={styles.numbersList}>
            <Reveal variant="fade">
              <span className={`eyebrow ${styles.numbersEyebrow}`}>{t('about.numbers.eyebrow')}</span>
            </Reveal>
            {numbers.map((n, i) => (
              <Reveal key={n.label} variant="up" delay={i * 80} className={styles.number}>
                <span className={styles.numberValue}>{n.value}</span>
                <span className={styles.numberLabel}>{n.label}</span>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  )
}
