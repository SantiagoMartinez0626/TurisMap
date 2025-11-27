import React, { useContext, useState } from 'react'
import axios from 'axios'
import { AuthContext } from './auth/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function LoginRegister() {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const payload = mode === 'login' ? { email, password } : { name, email, password }
      const { data } = await axios.post(endpoint, payload)
      if (data?.token) {
        login(data.token, data.user)
        navigate('/app', { replace: true })
      } else {
        setError('Respuesta inválida del servidor')
      }
    } catch (err) {
      const status = err?.response?.status
      const msg = err?.response?.data?.error || 'Error de autenticación'
      if (mode === 'login' && status === 404) {
        setError('Usuario no registrado. Crea una cuenta para continuar.')
      } else if (mode === 'login' && status === 401) {
        setError('Contraseña incorrecta')
      } else {
        setError(msg)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
      <aside style={{ background: 'linear-gradient(135deg, #312e81 0%, #4f46e5 50%, #8b5cf6 100%)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div style={{ width: 'min(560px, 92%)', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', fontSize: 20 }}>🗺️</div>
            <div style={{ fontWeight: 900, fontSize: 36, letterSpacing: 0.3 }}>TurisMap</div>
          </div>
          <div style={{ fontWeight: 900, fontSize: 52, lineHeight: 1.05, marginBottom: 14 }}>
            Explora el mundo cerca de ti
          </div>
          <div style={{ fontSize: 18, opacity: 0.95 }}>
            Encuentra parques, restaurantes, museos y más con datos abiertos de OpenStreetMap. Rápido, privado y sin llaves de API.
          </div>
        </div>
      </aside>
      <section style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#ffffff' }}>
        <div style={{ width: 'min(460px, 90%)', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 18, boxShadow: '0 12px 36px rgba(2,6,23,0.07)', padding: 26, textAlign: 'center' }}>
          <div style={{ fontWeight: 800, fontSize: 26, marginBottom: 8 }}>
            {mode === 'login' ? 'Bienvenido de vuelta' : 'Crea tu cuenta'}
          </div>
          <div style={{ fontSize: 14, color: '#6b7280', marginBottom: 18 }}>
            {mode === 'login' ? 'Inicia sesión para continuar explorando.' : 'Regístrate para empezar a explorar.'}
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, textAlign: 'left' }}>Nombre</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none' }}
                  onFocus={(e) => e.currentTarget.style.borderColor = '#a5b4fc'}
                  onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                />
              </div>
            )}
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, textAlign: 'left' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#a5b4fc'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#374151', marginBottom: 6, textAlign: 'left' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                required
                style={{ width: '100%', padding: '12px 14px', borderRadius: 10, border: '1px solid #e5e7eb', outline: 'none' }}
                onFocus={(e) => e.currentTarget.style.borderColor = '#a5b4fc'}
                onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
              />
            </div>
            {error && <div style={{ color: '#b91c1c', fontSize: 12, background: '#fee2e2', padding: '10px 12px', borderRadius: 10 }}>{error}</div>}
            <button
              type="submit"
              disabled={loading}
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: '#ffffff', border: 0, borderRadius: 12, padding: '12px 14px', cursor: 'pointer', fontWeight: 700, letterSpacing: 0.2 }}
            >
              {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar' : 'Registrarse')}
            </button>
          </form>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 12 }}>
            {mode === 'login' ? (
              <span>¿No tienes cuenta? <button onClick={() => setMode('register')} style={{ color: '#4f46e5', background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Regístrate</button></span>
            ) : (
              <span>¿Ya tienes cuenta? <button onClick={() => setMode('login')} style={{ color: '#4f46e5', background: 'transparent', border: 0, cursor: 'pointer', textDecoration: 'underline', fontWeight: 600 }}>Inicia sesión</button></span>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}


