'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function Navbar() {
  const pathname = usePathname()
  const { user, logout, isAuthenticated, loading } = useAuth()

  return (
    <nav className="navbar">
      
      <div className="navbar-logo">
        <img src="/logo.jpg" alt="Logo" />
      </div>

      <div className="navbar-links">
        <Link href="/" className={pathname === '/' ? 'active' : ''}>
          Inicio
        </Link>
        {isAuthenticated && !loading ? (
          <Link
            href="/estudio"
            className={pathname?.startsWith('/estudio') ? 'active' : ''}
          >
            Gestión estudio
          </Link>
        ) : null}
        <Link href="/simulador" className={pathname === '/simulador' ? 'active' : ''}>
          Simulador de Arancel Notarial
        </Link>
        <Link href="/sobre-nosotros" className={pathname === '/sobre-nosotros' ? 'active' : ''}>
          Sobre Nosotros
        </Link>
      </div>

      <div className="navbar-auth">
        {isAuthenticated ? (
          <>
            <Link href="/perfil" className="navbar-perfil">
              👤 {user?.nombre}
            </Link>
            <button onClick={logout} className="navbar-logout">
              Cerrar Sesión
            </button>
          </>
        ) : (
          <Link href="/login">Iniciar Sesión / Registrarse</Link>
        )}
      </div>

    </nav>
  )
}