export default function HowItWorks() {
  const steps = [
    {
      number: "1",
      title: "Seleccioná el tipo de acto",
      description: "Elegí entre compraventa, hipoteca, donación y más de 50 tipos de actos notariales.",
      icon: "📋"
    },
    {
      number: "2",
      title: "Ingresá los valores",
      description: "Completá el precio, valor catastral o los datos específicos según el acto seleccionado.",
      icon: "💵"
    },
    {
      number: "3",
      title: "Obtené el resultado",
      description: "Recibí el cálculo detallado con honorarios, impuestos y deducciones en segundos.",
      icon: "✅"
    }
  ]

  return (
    <section className="how-it-works">
      <h2>¿Cómo funciona el simulador?</h2>
      <p className="how-subtitle">Calculá tus honorarios en 3 simples pasos</p>
      
      <div className="steps-container">
        {steps.map((step, index) => (
          <div key={index} className="step">
            <div className="step-number">{step.number}</div>
            <div className="step-icon">{step.icon}</div>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </div>
        ))}
      </div>

      {/* Línea conectora entre los pasos */}
      <div className="connecting-line"></div>
    </section>
  )
}