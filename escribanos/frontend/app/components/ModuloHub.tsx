import Link from 'next/link'

export type ModuloHubAccion = {
  href: string
  titulo: string
  descripcion: string
}

type Props = {
  titulo: string
  subtitulo?: string
  acciones: ModuloHubAccion[]
}

/** Hub de entrada a un módulo: misma línea visual que el simulador. */
export default function ModuloHub({ titulo, subtitulo, acciones }: Props) {
  return (
    <div className="modulo-hub">
      <div className="simulador-header">
        <h1>{titulo}</h1>
        {subtitulo ? <p>{subtitulo}</p> : null}
      </div>

      <div className="modulo-hub-grid">
        {acciones.map((accion) => (
          <Link key={accion.href} href={accion.href} className="modulo-hub-card">
            <h2>{accion.titulo}</h2>
            <p>{accion.descripcion}</p>
            <span className="modulo-hub-card-cta">Entrar →</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
