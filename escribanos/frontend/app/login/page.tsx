'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../context/AuthContext'

function LoginForm() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    login,
    register,
    loading: authLoading,
    isAuthenticated,
    syncEstudioCookies,
  } = useAuth()

  const nextAfterAuth = searchParams.get('next') || '/perfil'

  /** Ya logueado (p. ej. token en localStorage) y el middleware mandó acá: sincronizar cookies y entrar a gestión. */
  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (!isAuthenticated) {
      return;
    }
    const next = searchParams.get('next');
    if (!next?.startsWith('/estudio')) {
      return;
    }
    void (async () => {
      const { ok } = await syncEstudioCookies();
      if (ok) {
        window.location.assign(next);
      }
    })();
  }, [authLoading, isAuthenticated, searchParams, syncEstudioCookies])

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    ci: '',
    confirmPassword: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (isLogin) {
        await login(formData.email, formData.password)
        if (nextAfterAuth.startsWith('/estudio')) {
          window.location.assign(nextAfterAuth)
        } else {
          router.push(nextAfterAuth)
        }
      } else {
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden')
          setLoading(false)
          return
        }

        await register({
          email: formData.email,
          password: formData.password,
          nombre: formData.nombre,
          apellido: formData.apellido,
          ci: formData.ci,
        })
        if (nextAfterAuth.startsWith('/estudio')) {
          window.location.assign(nextAfterAuth)
        } else {
          router.push(nextAfterAuth)
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-container">
        <div className="login-header">
          <h1>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
          <p>{isLogin ? 'Bienvenido de vuelta' : 'Creá tu cuenta gratuita'}</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <>
              <div className="form-group">
                <label>Nombre</label>
                <input 
                  type="text" 
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Juan" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellido</label>
                <input 
                  type="text" 
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Pérez" 
                  required
                />
              </div>
              <div className="form-group">
                <label>Cédula de Identidad</label>
                <input 
                  type="text" 
                  name="ci"
                  value={formData.ci}
                  onChange={handleChange}
                  placeholder="1234567-8" 
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="tu@email.com" 
              required
            />
          </div>

          <div className="form-group">
            <label>Contraseña</label>
            <input 
              type="password" 
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••" 
              required
              minLength={6}
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Confirmar contraseña</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••" 
                required
                minLength={6}
              />
            </div>
          )}

          {isLogin && (
            <div className="forgot-password-link">
              <a href="/restablecer-contrasena">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          )}

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Ingresar' : 'Crear cuenta')}
          </button>
        </form>

        <div className="login-toggle">
          <p>
            {isLogin ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}
            <button type="button" onClick={() => setIsLogin(!isLogin)}>
              {isLogin ? 'Registrate' : 'Iniciá sesión'}
            </button>
          </p>
        </div>
      </div>
    </main>
  )
}

export default function Login() {
  return (
    <Suspense fallback={
      <main className="login-page">
        <div className="login-container">
          <p className="login-header">Cargando…</p>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  )
}
