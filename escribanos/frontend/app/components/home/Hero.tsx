export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Tecnología a la altura de tu responsabilidad profesional</h1>
        <ul className="hero-highlights">
          <li>Gestioná integralmente tu Estudio Profesional</li>
          <li>Simulá el cálculo del Arancel en segundos</li>
        </ul>
        <a href="/simulador" className="cta-button">
          Probar gratis ahora →
        </a>
      </div>
      <div className="hero-image">
        <img
          src="/logo.jpg"
          alt="Estudio notarial"
          className="hero-logo"
        />
      </div>
    </section>
  )
}