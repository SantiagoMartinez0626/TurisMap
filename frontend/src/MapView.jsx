import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'

import iconUrl from 'leaflet/dist/images/marker-icon.png'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

L.Icon.Default.mergeOptions({
  iconUrl,
  iconRetinaUrl,
  shadowUrl
})

function FlyTo({ center }) {
  const map = useMap()
  useEffect(() => {
    map.flyTo(center, 13, { duration: 0.7 })
  }, [center, map])
  return null
}

function LoadingOverlay({ message = 'Cargando lugares…' }) {
  return (
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, zIndex: 2000 }}>
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="22" cy="22" r="18" stroke="#111827" strokeWidth="4" opacity="0.2"/>
        <path d="M40 22c0-9.941-8.059-18-18-18" stroke="#111827" strokeWidth="4">
          <animateTransform attributeName="transform" type="rotate" from="0 22 22" to="360 22 22" dur="1s" repeatCount="indefinite"/>
        </path>
      </svg>
      <div style={{ fontWeight: 600, color: '#111827' }}>{message}</div>
    </div>
  )
}

export default function MapView() {
  const [center, setCenter] = useState({ lat: 40.4168, lng: -3.7038 }) // Madrid por defecto
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const FIXED_RADIUS = 5000
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState({})
  const [autoFetched, setAutoFetched] = useState(false)
  const [follow, setFollow] = useState(true)
  const watchIdRef = useRef(null)

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const tileAttribution = '&copy; OpenStreetMap contributors'

  useEffect(() => {
    if (navigator.geolocation) {
      const onFirst = (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }
      const opts = { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      navigator.geolocation.getCurrentPosition(onFirst, () => {}, opts)

      if (follow) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
        )
      }
      return () => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      }
    }
  }, [follow])

  // Cargar categorías desde backend
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await axios.get('/api/places/categories')
        const cats = (data?.categories || []).map(c => ({ id: c.id, name: c.name, color: c.color, icon: c.icon }))
        const allowed = new Set(['parques','colegios','clinicas','hospitales','restaurantes','hoteles','centros_comerciales','bibliotecas'])
        const filtered = cats.filter(c => allowed.has(c.id))
        setCategories(filtered)
        // Preseleccionar algunas relevantes por defecto si no hay selección aún
        setSelected((prev) => {
          if (Object.keys(prev).length > 0) return prev
          const defaults = ['parques','colegios','clinicas','hospitales','restaurantes','hoteles','centros_comerciales','bibliotecas']
          const initial = {}
          filtered.forEach(c => { initial[c.id] = defaults.includes(c.id) })
          return initial
        })
      } catch (e) {
        // fallback silencioso
      }
    }
    load()
  }, [])

  // Mapeo de emoji por icono o id de categoría
  const emojiFor = (iconName, id) => {
    const byId = {
      museos: '🏛️',
      parques: '🌳',
      restaurantes: '🍽️',
      hoteles: '🛏️',
      monumentos: '📸',
      iglesias: '⛪',
      teatros: '🎭',
      centros_comerciales: '🛍️',
      bibliotecas: '📚',
      zoos: '🦁',
      acuarios: '🐟',
      parques_tematicos: '🎢',
      estadios: '🏟️',
      cines: '🎬',
      colegios: '🏫',
      clinicas: '🩺',
      hospitales: '🏥',
      estaciones: '🚉'
    }
    const byIcon = {
      library: '🏛️',
      leaf: '🌳',
      restaurant: '🍽️',
      bed: '🛏️',
      camera: '📸',
      home: '⛪',
      film: '🎬',
      cart: '🛍️',
      book: '📚',
      paw: '🐾',
      water: '🐟',
      happy: '🎢',
      football: '🏟️',
      school: '🏫',
      medkit: '🩺',
      medical: '🏥',
      train: '🚉'
    }
    return byId[id] || byIcon[iconName] || '📍'
  }

  // Crear un DivIcon coloreado con emoji
  const createDivIcon = (hexColor = '#111827', emoji = '📍') => {
    const style = `
      display:flex;align-items:center;justify-content:center;
      width:28px;height:28px;border-radius:9999px;
      background:${hexColor};color:#ffffff;
      font-size:16px;box-shadow:0 1px 4px rgba(0,0,0,.25);
    `
    const html = `<div style="${style}">${emoji}</div>`
    return L.divIcon({
      className: 'tm-pin',
      html,
      iconSize: [28, 28],
      iconAnchor: [14, 28],
      popupAnchor: [0, -24]
    })
  }

  // Iconos por categoría memoizados
  const categoryIcons = useMemo(() => {
    const map = {}
    categories.forEach(c => {
      map[c.id] = createDivIcon(c.color, emojiFor(c.icon, c.id))
    })
    return map
  }, [categories])

  // Icono para la ubicación del usuario
  const userIcon = useMemo(() => createDivIcon('#111827', '📍'), [])

  const fetchNearby = async () => {
    try {
      setLoading(true)
      setError(null)
      const enabled = Object.keys(selected).filter((k) => selected[k])
      if (enabled.length === 0) {
        setPlaces([])
        return
      }
      const { data } = await axios.get('/api/places/nearby', {
        params: { lat: center.lat, lng: center.lng, radius: FIXED_RADIUS, category: enabled.join(',') }
      })
      setPlaces(data?.places || [])
    } catch (e) {
      setError(e?.message || 'Error al cargar lugares')
    } finally {
      setLoading(false)
    }
  }

  // Auto-cargar al tener geolocalización por primera vez
  useEffect(() => {
    if (!autoFetched && center) {
      setAutoFetched(true)
      fetchNearby()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center.lat, center.lng])

  function PlacePopupContent({ place }) {
    const [details, setDetails] = useState(null)
    const [loadingDetails, setLoadingDetails] = useState(false)
    const [errorDetails, setErrorDetails] = useState(null)

    useEffect(() => {
      let mounted = true
      const load = async () => {
        try {
          setLoadingDetails(true)
          const { data } = await axios.get(`/api/places/details/${place.id}`)
          if (mounted) setDetails(data)
        } catch (err) {
          if (mounted) setErrorDetails('No se pudo cargar detalles')
        } finally {
          if (mounted) setLoadingDetails(false)
        }
      }
      load()
      return () => { mounted = false }
    }, [place.id])

    return (
      <div style={{ minWidth: 220, textAlign: 'center' }}>
        <div style={{ fontWeight: 700 }}>{place.name}</div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>{place.category || 'Lugar'}</div>
        <div style={{ fontSize: 12 }}>{place.distance} m</div>
        {loadingDetails && <div style={{ fontSize: 12, marginTop: 6 }}>Cargando detalles…</div>}
        {errorDetails && <div style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errorDetails}</div>}
        {details && (
          <div style={{ marginTop: 6, display: 'grid', gap: 4, justifyItems: 'center' }}>
            {details.address && details.address !== 'Dirección no disponible' && <div style={{ fontSize: 12 }}>📍 {details.address}</div>}
            {details.phone && <div style={{ fontSize: 12 }}>📞 {details.phone}</div>}
            {details.website && (
              <div style={{ fontSize: 12 }}>
                🌐 <a href={details.website} target="_blank" rel="noreferrer">Sitio web</a>
              </div>
            )}
            {details.openingHours && <div style={{ fontSize: 12 }}>🕒 {details.openingHours}</div>}
          </div>
        )}
      </div>
    )
  }

  const markers = useMemo(() => places.map((p) => ({
    id: p.id,
    name: p.name,
    lat: p.location.lat,
    lng: p.location.lng,
    distance: p.distance,
    category: p.category
  })), [places])

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <aside style={{ width: 'min(320px, 92vw)', height: '100%', borderRight: '1px solid #e5e7eb', background: '#ffffff', padding: 14, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 800, fontSize: 16, textAlign: 'center' }}>Filtros</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 8, marginBottom: 12 }}>
          {categories.map((c) => {
            const active = !!selected[c.id]
            return (
              <button
                key={c.id}
                onClick={() => setSelected((s) => ({ ...s, [c.id]: !s[c.id] }))}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  borderRadius: 10,
                  padding: '8px 10px',
                  border: active ? `1px solid ${c.color || '#111827'}` : '1px solid #e5e7eb',
                  background: active ? (c.color || '#111827') : '#ffffff',
                  color: active ? '#ffffff' : '#111827',
                  cursor: 'pointer',
                  minWidth: 0
                }}
                title={c.name}
              >
                <span>{emojiFor(c.icon, c.id)}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center' }}>{c.name}</span>
              </button>
            )
          })}
        </div>
        <div style={{ height: 1, background: '#e5e7eb', margin: '10px 0' }} />
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
          <input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} />
          Seguir mi ubicación
        </label>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
          <button
            onClick={fetchNearby}
            disabled={loading}
            style={{
              background: '#111827',
              color: 'white',
              border: 0,
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
          <button
            onClick={() => { setSelected({}); setPlaces([]) }}
            style={{
              background: '#f3f4f6',
              color: '#111827',
              border: '1px solid #e5e7eb',
              borderRadius: 8,
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Limpiar
          </button>
        </div>
        <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 6 }}>{places.length} lugares</div>
        {error && <span style={{ display: 'inline-block', marginTop: 8, color: '#ef4444', background: '#fee2e2', borderRadius: 6, padding: '6px 8px' }}>{error}</span>}
      </aside>
      <div style={{ flex: 1, position: 'relative' }}>
        {!loading && (
          <MapContainer
            center={[center.lat, center.lng]}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <FlyTo center={[center.lat, center.lng]} />
            <TileLayer attribution={tileAttribution} url={tileUrl} />
            <Marker position={[center.lat, center.lng]} icon={userIcon}>
              <Popup>Tu ubicación aproximada</Popup>
            </Marker>
            {markers.map((m) => (
              <Marker key={m.id} position={[m.lat, m.lng]} icon={categoryIcons[m.category]}>
                <Popup>
                  <PlacePopupContent place={m} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
        {loading && <LoadingOverlay />}
      </div>
    </div>
  )
}
