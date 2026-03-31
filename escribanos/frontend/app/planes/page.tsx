'use client'

export default function PlanesPage() {
  const planes = [
    {
      nombre: 'Gratis',
      precio: 0,
      descripcion: 'Perfecto para probar el sistema',
      calculos: 5,
      caracteristicas: [
        '5 cálculos por mes',
        'Acceso al simulador',
        'Historial de cálculos',
        'Soporte por email'
      ],
      destacado: false,
      color: 'gris'
    },
    {
      nombre: 'Pro',
      precio: 199,
      descripcion: 'Ideal para escribanos independientes',
      calculos: 15,
      caracteristicas: [
        '15 cálculos por mes',
        'Acceso al simulador',
        'Historial ilimitado',
        'Soporte prioritario',
        'Exportar a PDF'
      ],
      destacado: true,
      color: 'verde'
    },
    {
      nombre: 'Plus',
      precio: 299,
      descripcion: 'Para escribanías con alto volumen',
      calculos: 30,
      caracteristicas: [
        '30 cálculos por mes',
        'Acceso al simulador',
        'Historial ilimitado',
        'Soporte prioritario',
        'Exportar a PDF',
        'Múltiples usuarios',
        'Reportes mensuales'
      ],
      destacado: false,
      color: 'verde-oscuro'
    }
  ]

  return (
    <div className="planes-page">
      
      <div className="planes-header">
        <h1>Elegí el plan perfecto para vos</h1>
        <p>Todos los planes incluyen acceso completo al simulador de arancel notarial</p>
      </div>

      {/* Tarjetas de planes */}
      <div className="planes-container">
        {planes.map((plan) => (
          <div 
            key={plan.nombre} 
            className={`plan-card ${plan.destacado ? 'plan-destacado' : ''}`}
          >
            
            {plan.destacado && (
              <div className="plan-badge">
                ⭐ Más Popular
              </div>
            )}

            <div className="plan-header">
              <h2>{plan.nombre}</h2>
              <p className="plan-descripcion">{plan.descripcion}</p>
            </div>

            <div className="plan-precio">
              {plan.precio === 0 ? (
                <>
                  <span className="precio-grande">Gratis</span>
                </>
              ) : (
                <>
                  <span className="precio-simbolo">$U</span>
                  <span className="precio-grande">{plan.precio}</span>
                  <span className="precio-periodo">/mes</span>
                </>
              )}
            </div>

            <ul className="plan-caracteristicas">
              {plan.caracteristicas.map((caracteristica, index) => (
                <li key={index}>
                  <span className="check-icon">✓</span>
                  {caracteristica}
                </li>
              ))}
            </ul>

            <button className={`plan-button ${plan.destacado ? 'button-destacado' : ''}`}>
              {plan.precio === 0 ? 'Comenzar Gratis' : 'Elegir Plan'}
            </button>

          </div>
        ))}
      </div>

      {/* FAQ o información adicional */}
      <div className="planes-info">
        <h3>Preguntas frecuentes</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>¿Puedo cambiar de plan?</h4>
            <p>Sí, podés cambiar de plan en cualquier momento desde tu perfil.</p>
          </div>
          <div className="info-item">
            <h4>¿Cómo se cuentan los cálculos?</h4>
            <p>Cada cálculo que realices cuenta como uno. Los cálculos se resetean cada mes.</p>
          </div>
          <div className="info-item">
            <h4>¿Qué pasa si me quedo sin cálculos?</h4>
            <p>Podés actualizar tu plan en cualquier momento o esperar al próximo mes.</p>
          </div>
        </div>
      </div>

    </div>
  )
}