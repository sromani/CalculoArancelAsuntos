type Props = {
  titulo: string
  descripcion?: string
}

/** Placeholder vacío con el formato del simulador. */
export default function SeccionProximamente({ titulo, descripcion }: Props) {
  return (
    <div className="simulador-container">
      <div className="simulador-content">
        <div className="simulador-header">
          <h1>{titulo}</h1>
          {descripcion ? <p>{descripcion}</p> : null}
        </div>
        <div className="simulador-form seccion-proximamente">
          <p className="seccion-proximamente-msg">Esta sección estará disponible próximamente.</p>
        </div>
      </div>
    </div>
  )
}
