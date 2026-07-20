'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

/** Estilo “módulo” solo en la ruta actual; si no, mismo aspecto que el resto del menú. */
function navPrimaryClass(active: boolean) {
  return active ? 'active navbar-link-primary' : ''
}

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated } = useAuth()

  const enClientes = Boolean(pathname?.startsWith('/estudio/clientes'))
  const enAsuntos = Boolean(pathname?.startsWith('/estudio/asuntos'))
  const enGastos = pathname === '/gastos'
  const enPresupuesto = pathname === '/presupuesto-cliente'
  const enPagos = pathname === '/pagos'

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <Link href="/" aria-label="Inicio">
            <img src="/logo.jpg" alt="" />
          </Link>
        </div>

        <div className="navbar-links">
          <Link href="/" className={pathname === '/' ? 'active' : ''}>
            Inicio
          </Link>
          <Link href="/estudio/clientes" className={navPrimaryClass(enClientes)}>
            Clientes
          </Link>
          <Link href="/estudio/asuntos" className={navPrimaryClass(enAsuntos)}>
            Asuntos
          </Link>
          <Link
            href="/simulador"
            className={pathname === '/simulador' ? 'active' : ''}
            title="Simulador de Arancel Notarial"
          >
            <span className="navbar-link-short">Simulador</span>
            <span className="navbar-link-full">Simulador de Arancel</span>
          </Link>
          <Link href="/gastos" className={navPrimaryClass(enGastos)} title="Gastos">
            Gastos
          </Link>
          <Link
            href="/presupuesto-cliente"
            className={navPrimaryClass(enPresupuesto)}
            title="Presupuesto al Cliente"
          >
            <span className="navbar-link-short">Presupuesto</span>
            <span className="navbar-link-full">Presupuesto al Cliente</span>
          </Link>
          <Link href="/pagos" className={navPrimaryClass(enPagos)} title="Pagos">
            Pagos
          </Link>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              <Link href="/perfil" className="navbar-perfil" title={user?.nombre}>
                👤 <span className="navbar-perfil-nombre">{user?.nombre}</span>
              </Link>
              <button type="button" onClick={logout} className="navbar-logout">
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link href="/login">Iniciar sesión</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
