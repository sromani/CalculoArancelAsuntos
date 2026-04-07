export default function SobreNosotros() {
  return (
    <main className="sobre-nosotros-page">
      <section className="sobre-hero">
        <h1>Sobre Nosotros</h1>
        <p className="sobre-subtitle">
          El primer simulador uruguayo de aranceles notariales diseñado por escribanos, para escribanos.
        </p>
      </section>

      <section className="sobre-content">
        <div className="sobre-card">
          <span className="sobre-icon">🎯</span>
          <h2>Nuestra Misión</h2>
          <p>
            Simplificar el cálculo de honorarios notariales en Uruguay, ahorrando tiempo y 
            facilitando cálculos sistemáticos. Creemos que la tecnología debe estar 
            al servicio de los profesionales del derecho.
          </p>
        </div>

        <div className="sobre-card">
          <span className="sobre-icon">⚖️</span>
          <h2>Por Qué Existimos</h2>
          <p>
            Sabemos que calcular honorarios manualmente puede llevar muchas horas según cada caso, 
            considerando todas las variables del Arancel Notarial. Nuestro simulador lo hace en 
            tan solo unos segundos, sin errores respecto al arancel, actualizado con cada cambio normativo.
          </p>
        </div>

        <div className="sobre-card">
          <span className="sobre-icon">🤝</span>
          <h2>Compromiso</h2>
          <p>
            Mantenemos el arancel actualizado, ofrecemos 5 cálculos mensuales gratuitos, 
            y garantizamos que nuestro sistema refleja exactamente la normativa vigente. 
            Tu confianza es nuestra prioridad.
          </p>
        </div>
      </section>

      <section className="sobre-cta">
        <h2>¿Listo para optimizar tu trabajo?</h2>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <a href="/simulador" className="cta-button">
            Comenzar ahora →
          </a>
          <a href="/planes" className="cta-button">
            Ver planes
          </a>
        </div>
      </section>
    </main>
  )
}