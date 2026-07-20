'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import { CentroNotificaciones } from '@/components/notificaciones/centro-notificaciones'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated, loading } = useAuth()

  const enEstudio = Boolean(pathname?.startsWith('/estudio'))
  const enSimulador = pathname === '/simulador'
  const enInicio = pathname === '/'

  return (
    <nav className="navbar sticky top-0 z-50" aria-label="Navegación principal">
      <div className="navbar-inner">
        <div className="navbar-logo">
          <Link href="/" aria-label="Inicio">
            <img src="/logo.png" alt="Escribanos Estudio" width={44} height={44} />
          </Link>
        </div>

        <div className="navbar-links">
          <Link href="/" className={enInicio ? 'active' : ''}>
            Inicio
          </Link>
          {isAuthenticated && !loading && !enEstudio ? (
            <Link
              href="/estudio/clientes"
              className="navbar-link-primary"
              title="Gestión del estudio"
            >
              Gestión
            </Link>
          ) : null}
          <Link
            href="/simulador"
            className={enSimulador ? 'active' : ''}
            title="Simulador de Arancel Notarial"
          >
            <span className="navbar-link-short">Simulador</span>
            <span className="navbar-link-full">Simulador de Arancel</span>
          </Link>
          <Link href="/sobre-nosotros" className={pathname === '/sobre-nosotros' ? 'active' : ''}>
            <span className="navbar-link-short">Nosotros</span>
            <span className="navbar-link-full">Sobre Nosotros</span>
          </Link>
          <Link href="/planes" className={pathname === '/planes' ? 'active' : ''}>
            Planes
          </Link>
        </div>

        <div className="navbar-auth">
          {isAuthenticated ? (
            <>
              {enEstudio ? <CentroNotificaciones /> : null}
              <Link href="/perfil" className="navbar-perfil" title={user?.nombre}>
                <span className="navbar-perfil-nombre">{user?.nombre}</span>
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
