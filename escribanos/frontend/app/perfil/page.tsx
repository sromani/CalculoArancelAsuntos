'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function PerfilPage() {

  // simulación ejemplo (después vendrán del backend)
  const [usuario] = useState({
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan.perez@email.com',
    rut: '1234567-8',
    planType: 'GRATIS', // GRATIS, PRO, PLUS
    calculosRealizados: 3,
    calculosLimite: 5
  })

  // simulación cálculos guardados (después vendrán del backend)
  const [calculos] = useState([
    {
      id: '1',
      alias: 'Compra Casa Rodríguez',
      tipoBien: 'BIEN_INMUEBLE',
      tipoContrato: 'COMPRAVENTA',
      honorarioTotal: 3660,
      fecha: '2026-02-15T10:30:00'
    },
    {
      id: '2',
      alias: 'Venta Auto Cliente',
      tipoBien: 'BIEN_MUEBLE',
      tipoContrato: 'COMPRAVENTA',
      honorarioTotal: 1200,
      fecha: '2026-02-14T15:20:00'
    },
    {
      id: '3',
      alias: 'Hipoteca Inmueble',
      tipoBien: 'BIEN_INMUEBLE',
      tipoContrato: 'CONSTITUCION_FIDEICOMISO',
      honorarioTotal: 2500,
      fecha: '2026-01-28T09:15:00'
    },
    {
      id: '4',
      alias: 'Donación Familiar',
      tipoBien: 'BIEN_INMUEBLE',
      tipoContrato: 'DONACION',
      honorarioTotal: 1800,
      fecha: '2026-01-15T11:45:00'
    }
  ])

  // Estado para controlar qué carpetas están abiertas
  const [carpetasAbiertas, setCarpetasAbiertas] = useState<string[]>(['febrero de 2026'])

  const toggleCarpeta = (mes: string) => {
    if (carpetasAbiertas.includes(mes)) {
      setCarpetasAbiertas(carpetasAbiertas.filter(m => m !== mes))
    } else {
      setCarpetasAbiertas([...carpetasAbiertas, mes])
    }
  }

  // función para organizar cálculos por mes
  const organizarPorMes = () => {
    const porMes: { [key: string]: typeof calculos } = {}
    
    calculos.forEach(calculo => {
      const fecha = new Date(calculo.fecha)
      const mesAnio = fecha.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' })
      
      if (!porMes[mesAnio]) {
        porMes[mesAnio] = []
      }
      porMes[mesAnio].push(calculo)
    })

    // ordenar dentro de cada mes por fecha (más reciente primero)
    Object.keys(porMes).forEach(mes => {
      porMes[mes].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    })

    return porMes
  }

  const calculosPorMes = organizarPorMes()

  const getPlanInfo = () => {
    switch(usuario.planType) {
      case 'GRATIS':
        return { nombre: 'Gratis', color: 'gris', limite: 5 }
      case 'PRO':
        return { nombre: 'Pro', color: 'verde', limite: 15 }
      case 'PLUS':
        return { nombre: 'Plus', color: 'verde-oscuro', limite: 30 }
      default:
        return { nombre: 'Gratis', color: 'gris', limite: 5 }
    }
  }

  const planInfo = getPlanInfo()

  return (
    <div className="perfil-page">
      
      <div className="perfil-container">
        
        <aside className="perfil-sidebar">
          
          <div className="perfil-avatar">
            <div className="avatar-circle">
              {usuario.nombre.charAt(0)}{usuario.apellido.charAt(0)}
            </div>
          </div>

          <div className="perfil-info">
            <h2>{usuario.nombre} {usuario.apellido}</h2>
            <p className="perfil-email">{usuario.email}</p>
            <p className="perfil-rut">CI: {usuario.rut}</p>
          </div>

          <div className="plan-uso">
            <div className="uso-texto">
              <span className="uso-numero">{usuario.calculosRealizados}</span>
              <span className="uso-de"> de </span>
              <span className="uso-limite">{planInfo.limite}</span>
              <span className="uso-label"> cálculos este mes</span>
            </div>
            <div className="uso-barra">
              <div 
                className={`uso-progreso ${
                  (usuario.calculosRealizados / planInfo.limite) >= 0.75 
                    ? 'progreso-rojo' 
                    : (usuario.calculosRealizados / planInfo.limite) >= 0.5 
                      ? 'progreso-amarillo' 
                      : 'progreso-verde'
                }`}
                style={{ width: `${(usuario.calculosRealizados / planInfo.limite) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="perfil-plan">
            <div className="plan-header-info">
              <span className="plan-label">Plan actual</span>
              <span className={`plan-badge-perfil plan-${planInfo.color}`}>
                {planInfo.nombre}
              </span>
            </div>

            {usuario.planType === 'GRATIS' && (
              <div className="plan-upgrade">
                <p>¡Mejorá tu plan!</p>
                <Link href="/planes">
                  <button className="btn btn-primary btn-small">
                    Ver Planes
                  </button>
                </Link>
              </div>
            )}
          </div>

          <button className="btn-logout">
            Cerrar Sesión
          </button>

        </aside>

        <main className="perfil-main">
          
          <div className="perfil-header">
            <h1>Mis Cálculos</h1>
            <Link href="/simulador">
              <button className="btn btn-primary">
                + Nuevo Cálculo
              </button>
            </Link>
          </div>

          <div className="calculos-historial">
            
            {Object.keys(calculosPorMes).length === 0 ? (
              <div className="historial-vacio">
                <p>Todavía no tenés cálculos guardados</p>
                <Link href="/simulador">
                  <button className="btn btn-primary">
                    Crear mi primer cálculo
                  </button>
                </Link>
              </div>
            ) : (
              Object.keys(calculosPorMes).map(mes => (
                <div key={mes} className="mes-grupo">
                  
                  {/* Carpeta clickeable */}
                  <div 
                    className="carpeta-header" 
                    onClick={() => toggleCarpeta(mes)}
                  >
                    <span className="carpeta-icono">
                      {carpetasAbiertas.includes(mes) ? '📂' : '📁'}
                    </span>
                    <h3 className="mes-titulo-carpeta">
                      {mes.charAt(0).toUpperCase() + mes.slice(1)}
                    </h3>
                    <span className="carpeta-contador">
                      ({calculosPorMes[mes].length})
                    </span>
                  </div>
                  
                  {/* Contenido de la carpeta (solo si está abierta) */}
                  {carpetasAbiertas.includes(mes) && (
                    <div className="calculos-lista">
                      {calculosPorMes[mes].map(calculo => (
                        <div key={calculo.id} className="calculo-item">
                          
                          <div className="calculo-info-simple">
                            <div>
                              <h4 className="calculo-nombre">{calculo.alias || 'Sin nombre'}</h4>
                              <p className="calculo-descripcion">
                                {calculo.tipoContrato.replace(/_/g, ' ')} - {calculo.tipoBien.replace(/_/g, ' ')}
                              </p>
                              <p className="calculo-fecha-small">
                                {new Date(calculo.fecha).toLocaleDateString('es-UY', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div className="calculo-monto">
                              USD {calculo.honorarioTotal}
                            </div>
                          </div>

                          <div className="calculo-acciones-simple">
                            <button className="btn-simple">Ver detalles</button>
                            <button className="btn-simple">Descargar PDF</button>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

          </div>

        </main>

      </div>

    </div>
  )
}