import React from 'react'
import MapView from './MapView.jsx'

export default function App() {
  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#f8fafc' }}>
      <header style={{ padding: '14px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(90deg, #111827, #1f2937)', color: 'white' }}>
        <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.3 }}>TurisMap</span>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <MapView />
      </div>
    </div>
  )
}


