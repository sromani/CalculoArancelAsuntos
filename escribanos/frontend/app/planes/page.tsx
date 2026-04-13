'use client'

import { useMemo, useState } from 'react'

type PlanId = 'free' | 'basico' | 'pro' | 'plus' | 'enterprise'

type LimiteValor = { tipo: 'incluido'; texto: string } | { tipo: 'na' }

type PlanDef = {
  id: PlanId
  nombre: string
  precioPorModulo: number
  destacado?: boolean
  limites: {
    directorio: LimiteValor
    asuntos: LimiteValor
    calculosArancel: LimiteValor
    usuarios: LimiteValor
  }
}

const PLANES: PlanDef[] = [
  {
    id: 'free',
    nombre: 'Free',
    precioPorModulo: 0,
    limites: {
      directorio: { tipo: 'na' },
      asuntos: { tipo: 'na' },
      calculosArancel: { tipo: 'incluido', texto: 'Hasta 3 por mes' },
      usuarios: { tipo: 'incluido', texto: '1 usuario' },
    },
  },
  {
    id: 'basico',
    nombre: 'Básico',
    precioPorModulo: 199,
    limites: {
      directorio: { tipo: 'incluido', texto: 'Hasta 100 clientes' },
      asuntos: { tipo: 'incluido', texto: 'Hasta 15 en trámite' },
      calculosArancel: { tipo: 'incluido', texto: 'Hasta 15 por mes' },
      usuarios: { tipo: 'incluido', texto: '1 usuario' },
    },
  },
  {
    id: 'pro',
    nombre: 'Pro',
    precioPorModulo: 299,
    destacado: true,
    limites: {
      directorio: { tipo: 'incluido', texto: 'Hasta 200 clientes' },
      asuntos: { tipo: 'incluido', texto: 'Hasta 25 en trámite' },
      calculosArancel: { tipo: 'incluido', texto: 'Hasta 25 por mes' },
      usuarios: { tipo: 'incluido', texto: '1 usuario' },
    },
  },
  {
    id: 'plus',
    nombre: 'Plus',
    precioPorModulo: 499,
    limites: {
      directorio: { tipo: 'incluido', texto: 'Hasta 500 clientes' },
      asuntos: { tipo: 'incluido', texto: 'Hasta 50 en trámite' },
      calculosArancel: { tipo: 'incluido', texto: 'Hasta 50 por mes' },
      usuarios: { tipo: 'incluido', texto: '1 usuario' },
    },
  },
  {
    id: 'enterprise',
    nombre: 'Enterprise',
    precioPorModulo: 1999,
    limites: {
      directorio: { tipo: 'incluido', texto: 'Hasta 1000 clientes' },
      asuntos: { tipo: 'incluido', texto: 'Hasta 160 en trámite' },
      calculosArancel: { tipo: 'incluido', texto: 'Hasta 160 por mes' },
      usuarios: {
        tipo: 'incluido',
        texto: '10 usuarios principales y 10 secundarios',
      },
    },
  },
]

const ETIQUETA_LIMITE: Record<keyof PlanDef['limites'], string> = {
  directorio: 'Directorio de clientes',
  asuntos: 'Asuntos en trámite',
  calculosArancel: 'Cálculos de arancel',
  usuarios: 'Cantidad de usuarios',
}

const MODULOS_DETALLE: {
  numero: number
  titulo: string
  items: string[]
}[] = [
  {
    numero: 1,
    titulo: 'Clientes y asuntos',
    items: [
      'Directorio de clientes.',
      'Asuntos en trámite, seguimiento y alerta de vencimientos.',
    ],
  },
  {
    numero: 2,
    titulo: 'Simuladores de arancel',
    items: [
      'Simulador de cálculo de arancel de escribanos.',
      'Simulador de cálculo de arancel del Colegio de Abogados.',
    ],
  },
  {
    numero: 3,
    titulo: 'Aportes e impuestos',
    items: [
      'Simulador de pagos de aportes e impuestos, mensuales y bimensuales, que deben realizar los profesionales.',
    ],
  },
  {
    numero: 4,
    titulo: 'Gastos de trámites',
    items: [
      'Simulador de gastos de los trámites en las distintas oficinas públicas.',
    ],
  },
  {
    numero: 5,
    titulo: 'Registros y expedientes',
    items: [
      'Interacción con Dirección General de Registros para seguimiento de documentos ingresados.',
      'Interacción con expedientes judiciales para seguimiento de expedientes.',
    ],
  },
  {
    numero: 6,
    titulo: 'Facturación electrónica',
    items: ['Interacción con el sistema de facturación electrónica.'],
  },
]

function LimiteRow({
  etiqueta,
  valor,
}: {
  etiqueta: string
  valor: LimiteValor
}) {
  const ok = valor.tipo === 'incluido'
  const aria =
    ok && valor.tipo === 'incluido'
      ? `${etiqueta}: ${valor.texto}`
      : `${etiqueta}: no incluido en este plan`

  return (
    <li className="plan-limite-fila" aria-label={aria}>
      <span
        className={ok ? 'plan-limite-icon plan-limite-si' : 'plan-limite-icon plan-limite-no'}
        aria-hidden
      >
        {ok ? '✓' : '✗'}
      </span>
      <div className="plan-limite-texto">
        <span className="plan-limite-etiqueta">{etiqueta}</span>
        {ok ? (
          <span className="plan-limite-valor">{valor.texto}</span>
        ) : (
          <span className="plan-limite-na">No incluido</span>
        )}
      </div>
    </li>
  )
}

export default function PlanesPage() {
  const [planCalc, setPlanCalc] = useState<PlanId>('basico')
  const [modulosHasta, setModulosHasta] = useState(2)

  const planSeleccionado = PLANES.find((p) => p.id === planCalc)!

  const { totalMensual, detalleFormula } = useMemo(() => {
    const p = planSeleccionado.precioPorModulo
    const n = modulosHasta
    if (p === 0) {
      return {
        totalMensual: 0,
        detalleFormula:
          'En el plan Free el precio por módulo es $0; los límites del plan siguen los valores indicados arriba.',
      }
    }
    const total = p * n
    return {
      totalMensual: total,
      detalleFormula: `$${p.toLocaleString('es-UY')} × ${n} ${n === 1 ? 'módulo' : 'módulos'} = $${total.toLocaleString('es-UY')}`,
    }
  }, [planSeleccionado, modulosHasta])

  return (
    <div className="planes-page">
      <div className="planes-header">
        <h1>Planes</h1>
        <p className="planes-lead">
          ¿Cómo funciona? Elegís un <strong>plan</strong> (Free, Básico, Pro, Plus o Enterprise) según los límites que necesitás.
          Después contratás <strong>módulos del 1 al 6</strong>: son <strong>acumulativos</strong> — si querés el
          módulo 3, incluye siempre el 1 y el 2. El precio mensual por módulo es el mismo para todos los módulos
          dentro de cada plan.
        </p>
      </div>

      <div className="planes-container planes-container-cinco">
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            className={`plan-card ${plan.destacado ? 'plan-destacado' : ''}`}
          >
            {plan.destacado ? (
              <div className="plan-badge" aria-hidden>
                Popular
              </div>
            ) : null}

            <div className="plan-header">
              <h2>{plan.nombre}</h2>
            </div>

            <div className="plan-precio-modulo">
              <span className="plan-precio-modulo-label">Precio por módulo</span>
              {plan.precioPorModulo === 0 ? (
                <p className="plan-precio-modulo-monto">$0 / mes</p>
              ) : (
                <p className="plan-precio-modulo-monto">
                  <span className="precio-simbolo">$</span>
                  {plan.precioPorModulo.toLocaleString('es-UY')}
                  <span className="precio-periodo"> / mes</span>
                </p>
              )}
            </div>

            <p className="plan-limites-titulo">Qué incluye este plan</p>
            <ul className="plan-limites-lista" role="list">
              {(Object.keys(ETIQUETA_LIMITE) as (keyof PlanDef['limites'])[]).map((key) => (
                <LimiteRow
                  key={key}
                  etiqueta={ETIQUETA_LIMITE[key]}
                  valor={plan.limites[key]}
                />
              ))}
            </ul>

            <button type="button" className={`plan-button ${plan.destacado ? 'button-destacado' : ''}`}>
              {plan.precioPorModulo === 0 ? 'Comenzar gratis' : 'Consultar contratación'}
            </button>
          </div>
        ))}
      </div>

      <p className="planes-precios-nota" role="note">
        <span aria-hidden>* </span>Precios en pesos uruguayos. No incluyen IVA.
      </p>

      <section className="planes-calculadora" aria-labelledby="calc-titulo">
        <h2 id="calc-titulo">Probá tu costo mensual</h2>
        <p className="planes-calculadora-intro">
          Elegí el plan y hasta qué módulo querés llegar. El total es el precio por módulo de ese plan multiplicado
          por la cantidad de módulos (porque son acumulativos). Ejemplo: plan <strong>Básico</strong> hasta el{' '}
          <strong>módulo 2</strong> → $199 + $199 = <strong>$398 / mes</strong>.
        </p>

        <div className="planes-calculadora-grid">
          <fieldset className="planes-calc-fieldset">
            <legend className="planes-calc-legend">Plan</legend>
            <div className="planes-calc-opciones" role="group" aria-label="Seleccionar plan">
              {PLANES.map((p) => (
                <label key={p.id} className="planes-calc-radio-label">
                  <input
                    type="radio"
                    name="plan-calc"
                    value={p.id}
                    checked={planCalc === p.id}
                    onChange={() => setPlanCalc(p.id)}
                  />
                  <span>{p.nombre}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="planes-calc-modulos">
            <label htmlFor="modulos-hasta" className="planes-calc-legend">
              Contratar hasta el módulo (incluye los anteriores)
            </label>
            <input
              id="modulos-hasta"
              type="range"
              min={1}
              max={6}
              step={1}
              value={modulosHasta}
              onChange={(e) => setModulosHasta(Number(e.target.value))}
              className="planes-calc-range"
            />
            <div className="planes-calc-range-marks" aria-hidden>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <span key={n} className={n === modulosHasta ? 'activo' : ''}>
                  {n}
                </span>
              ))}
            </div>
            <p className="planes-calc-modulos-valor" aria-live="polite">
              Módulos <strong>1</strong> a <strong>{modulosHasta}</strong>
            </p>
          </div>

          <div className="planes-calc-resultado" aria-live="polite">
            <p className="planes-calc-resultado-label">Total estimado</p>
            <p className="planes-calc-resultado-monto">
              {totalMensual === 0 ? '$0' : `$${totalMensual.toLocaleString('es-UY')}`}
              <span className="precio-periodo"> / mes</span>
            </p>
            <p className="planes-calc-resultado-detalle">{detalleFormula}</p>
          </div>
        </div>
      </section>

      <section className="planes-modulos-detalle" aria-labelledby="modulos-titulo">
        <h2 id="modulos-titulo">Qué incluye cada módulo</h2>
        <p className="planes-modulos-sub">
          Los módulos se contratan en orden: el número 3 siempre lleva el 1 y el 2.
        </p>
        <ol className="planes-modulos-lista">
          {MODULOS_DETALLE.map((m) => (
            <li key={m.numero} className="planes-modulo-card">
              <h3 className="planes-modulo-titulo">
                Módulo {m.numero} — {m.titulo}
              </h3>
              <ul className="planes-modulo-items">
                {m.items.map((linea) => (
                  <li key={linea}>{linea}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>

      <div className="planes-info">
        <h3>Preguntas frecuentes</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>¿Por qué son acumulativos?</h4>
            <p>
              Cada módulo se apoya en los anteriores. Si contratás hasta el módulo 3, estás habilitando el 1, el 2 y
              el 3, y el costo es la suma de los tres precios unitarios del plan (tres veces el mismo valor por
              módulo).
            </p>
          </div>
          <div className="info-item">
            <h4>¿Puedo cambiar de plan o de cantidad de módulos?</h4>
            <p>Sí, podés ajustar plan y módulos según las condiciones comerciales vigentes y desde tu perfil.</p>
          </div>
          <div className="info-item">
            <h4>¿Qué significa “No incluido” en Free?</h4>
            <p>
              En el plan Free no tenés directorio de clientes ni gestión de asuntos en trámite con esos límites; sí
              tenés un cupo de cálculos de arancel y un usuario.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
