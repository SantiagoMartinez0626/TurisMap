import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import LoginRegister from './LoginRegister.jsx'
import MapView from './MapView.jsx'
import { useContext } from 'react'
import { AuthContext } from './auth/AuthContext.jsx'

function MapLayout() {
  const { logout } = useContext(AuthContext)
  const [activeTab, setActiveTab] = React.useState('filters') // 'filters' | 'favorites' | 'profile'
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', background: 'linear-gradient(90deg, #312e81, #4f46e5, #8b5cf6)', color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 'min(320px, 92vw)', marginLeft: 0 }}>
          <div style={{ background: 'rgba(255,255,255,0.15)', padding: 4, borderRadius: 9999, display: 'flex', gap: 4 }}>
            <button onClick={() => setActiveTab('filters')} style={{ border: 0, borderRadius: 9999, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, background: activeTab === 'filters' ? '#ffffff' : 'transparent', color: activeTab === 'filters' ? '#111827' : '#ffffff' }}>
              Filtros
            </button>
            <button onClick={() => setActiveTab('favorites')} style={{ border: 0, borderRadius: 9999, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, background: activeTab === 'favorites' ? '#ffffff' : 'transparent', color: activeTab === 'favorites' ? '#111827' : '#ffffff' }}>
              Favoritos
            </button>
            <button onClick={() => setActiveTab('profile')} style={{ border: 0, borderRadius: 9999, padding: '6px 10px', cursor: 'pointer', fontWeight: 700, background: activeTab === 'profile' ? '#ffffff' : 'transparent', color: activeTab === 'profile' ? '#111827' : '#ffffff' }}>
              Mi perfil
            </button>
          </div>
        </div>
        <span style={{ fontWeight: 900, fontSize: 20, letterSpacing: 0.3, textAlign: 'center' }}>🗺️ TurisMap</span>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '6px 10px', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
            Cerrar sesión
          </button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapView activeTab={activeTab} />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<LoginRegister />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/app" replace />} />
        <Route path="/app" element={<MapLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/app" replace />} />
    </Routes>
  )
}


