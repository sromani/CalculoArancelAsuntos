'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function RestablecerContrasena() {
  const [emailEnviado, setEmailEnviado] = useState(false)
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // TODO: Aquí llamarías a tu API para enviar el email
    console.log('Enviando email a:', email)
    
    // Simulamos que se envió
    setEmailEnviado(true)
  }

  return (
    <main className="login-page">
      <div className="login-container">
        {!emailEnviado ? (
          <>
            <div className="login-header">
              <h1>Restablecer Contraseña</h1>
              <p>Te enviaremos un link a tu email para crear una nueva contraseña</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="login-button">
                Enviar instrucciones
              </button>
            </form>

            <div className="login-toggle">
              <p>
                <Link href="/login">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="login-header">
              <h1>✓ Email Enviado</h1>
              <p>Si existe una cuenta con el email <strong>{email}</strong>, recibirás instrucciones para restablecer tu contraseña.</p>
            </div>

            <div className="email-sent-message">
              <p>Revisá tu casilla de correo y seguí los pasos indicados.</p>
              <p className="text-hint">No te olvides de revisar la carpeta de spam.</p>
            </div>

            <div className="login-toggle">
              <p>
                <Link href="/login">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </div>
          </>
        )}
      </div>
    </main>
  )
}