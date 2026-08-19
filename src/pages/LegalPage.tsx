interface LegalPageProps {
  title: string
}

export function LegalPage({ title }: LegalPageProps) {
  return (
    <div className="container" style={{ paddingBlock: '10rem 6rem', maxWidth: 800 }}>
      <h1>{title}</h1>
      <p style={{ marginTop: '2rem' }}>
        Texto legal pendiente de completar con los datos reales de la empresa: [NOMBRE DE LA EMPRESA], CIF
        [CIF], con domicilio en [DIRECCIÓN], y email de contacto [EMAIL].
      </p>
    </div>
  )
}
