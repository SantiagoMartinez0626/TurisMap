import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import axios from 'axios'
import { AuthContext } from './auth/AuthContext.jsx'

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

export default function MapView({ activeTab = 'filters' }) {
  const { user } = useContext(AuthContext)
  const [center, setCenter] = useState({ lat: 40.4168, lng: -3.7038 }) // Madrid por defecto
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const FIXED_RADIUS = 5000
  const [categories, setCategories] = useState([])
  const [selected, setSelected] = useState({})
  const [autoFetched, setAutoFetched] = useState(false)
  const watchIdRef = useRef(null)
  const [favoritesById, setFavoritesById] = useState({})
  const [selectedFavoriteIds, setSelectedFavoriteIds] = useState({})

  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  const tileAttribution = '&copy; OpenStreetMap contributors'

  useEffect(() => {
    if (navigator.geolocation) {
      const onFirst = (pos) => {
        setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      }
      const opts = { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      navigator.geolocation.getCurrentPosition(onFirst, () => {}, opts)

      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 5000 }
      )

      return () => {
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current)
          watchIdRef.current = null
        }
      }
    }
  }, [])

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
  const userIcon = useMemo(() => createDivIcon('#4f46e5', '📍'), [])
  const profileInitials = useMemo(() => {
    const source = user?.name || user?.email || '?'
    const parts = String(source).trim().split(/\s+/)
    const letters = `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase()
    return letters || String(source).slice(0, 1).toUpperCase()
  }, [user])
  const memberSince = useMemo(() => {
    return user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : null
  }, [user])

  // Favoritos: cargar por usuario
  useEffect(() => {
    if (!user?.id) return
    try {
      const raw = localStorage.getItem(`tm_favs_${user.id}`)
      if (raw) {
        const arr = JSON.parse(raw)
        const map = {}
        arr.forEach((p) => { if (p?.id) map[p.id] = p })
        setFavoritesById(map)
      } else {
        setFavoritesById({})
      }
    } catch {
      setFavoritesById({})
    }
  }, [user?.id])

  // Guardar favoritos
  useEffect(() => {
    if (!user?.id) return
    const arr = Object.values(favoritesById)
    localStorage.setItem(`tm_favs_${user.id}`, JSON.stringify(arr))
  }, [favoritesById, user?.id])

  const favorites = useMemo(() => Object.values(favoritesById), [favoritesById])
  const isFavorite = useCallback((id) => !!favoritesById[id], [favoritesById])
  const toggleFavorite = useCallback((place) => {
    setFavoritesById((prev) => {
      const next = { ...prev }
      if (next[place.id]) {
        delete next[place.id]
      } else {
        next[place.id] = {
          id: place.id,
          name: place.name,
          location: place.location || { lat: place.lat, lng: place.lng },
          category: place.category || null,
          distance: place.distance || 0
        }
      }
      return next
    })
  }, [])
  const toggleFavoriteSelection = useCallback((id) => {
    setSelectedFavoriteIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])
  const clearFavoriteSelection = useCallback(() => setSelectedFavoriteIds({}), [])

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

  function PlacePopupContent({ place, isFav, onToggleFav }) {
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
      <div style={{ minWidth: 220, textAlign: 'center', position: 'relative' }}>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFav(place) }}
          title={isFav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          style={{ position: 'absolute', right: 8, top: 8, background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 9999, width: 28, height: 28, display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <span style={{ color: isFav ? '#ef4444' : '#9ca3af', fontSize: 18, lineHeight: 1 }}>{isFav ? '❤' : '♡'}</span>
        </button>
        <div style={{ fontWeight: 700, padding: '0 64px' }}>{place.name}</div>
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

  const markers = useMemo(() => {
    if (activeTab === 'favorites') {
      const chosen = Object.keys(selectedFavoriteIds).filter((k) => selectedFavoriteIds[k])
      const list = chosen.length > 0 ? favorites.filter((f) => chosen.includes(f.id)) : favorites
      return list.map((p) => ({
        id: p.id,
        name: p.name,
        lat: p.location.lat,
        lng: p.location.lng,
        distance: p.distance,
        category: p.category
      }))
    }
    return places.map((p) => ({
      id: p.id,
      name: p.name,
      lat: p.location.lat,
      lng: p.location.lng,
      distance: p.distance,
      category: p.category
    }))
  }, [activeTab, favorites, selectedFavoriteIds, places])

  return (
    <div style={{ height: '100%', display: 'flex' }}>
      <aside style={{ width: 'min(320px, 92vw)', height: '100%', borderRight: '1px solid #e5e7eb', background: '#ffffff', padding: 14, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ height: 8 }} />

        {activeTab === 'filters' && (
          <>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gridAutoRows: 'minmax(100px, 1fr)', gap: 12, marginBottom: 6 }}>
              {categories.map((c) => {
                const active = !!selected[c.id]
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelected((s) => ({ ...s, [c.id]: !s[c.id] }))}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      borderRadius: 14,
                      padding: '12px',
                      border: active ? '1px solid #c7d2fe' : '1px solid #e5e7eb',
                      background: active ? '#eef2ff' : '#ffffff',
                      color: '#0f172a',
                      cursor: 'pointer',
                      minWidth: 0,
                      height: '100%'
                    }}
                    title={c.name}
                  >
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{emojiFor(c.icon, c.id)}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textAlign: 'center', color: '#0f172a', fontWeight: 600 }}>{c.name}</span>
                  </button>
                )
              })}
            </div>
            <div style={{ height: 1, background: '#e5e7eb', margin: '6px 0' }} />
            <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'center' }}>
              <button
                onClick={fetchNearby}
                disabled={loading}
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  color: 'white',
                  border: 0,
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontWeight: 700
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
                  borderRadius: 10,
                  padding: '10px 12px',
                  cursor: 'pointer',
                  fontWeight: 600
                }}
              >
                Limpiar
              </button>
            </div>
            <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 6 }}>{places.length} lugares</div>
            {error && <span style={{ display: 'inline-block', marginTop: 8, color: '#ef4444', background: '#fee2e2', borderRadius: 6, padding: '6px 8px' }}>{error}</span>}
          </>
        )}

        {activeTab === 'profile' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, boxShadow: '0 12px 30px rgba(2,6,23,0.06)', margin: '10px auto 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12, justifyContent: 'center' }}>
                <div style={{ width: 52, height: 52, borderRadius: 9999, background: 'linear-gradient(135deg, #4f46e5 0%, #8b5cf6 100%)', color: '#ffffff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 18 }}>
                  {profileInitials}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontWeight: 900, fontSize: 18, letterSpacing: 0.2 }}>{user?.name || 'Usuario'}</div>
                  <div style={{ fontSize: 13, color: '#6b7280', wordBreak: 'break-all' }}>{user?.email}</div>
                </div>
              </div>
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ display: 'grid', gap: 6 }}>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Miembro desde</div>
                  <div>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#eef2ff', color: '#4338ca', borderRadius: 9999, padding: '6px 10px', fontWeight: 700, fontSize: 12 }}>
                      📅 {memberSince || '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div style={{ flex: 1, overflowY: 'auto' }}>
            <div style={{ width: '100%', background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: 16, padding: 16, boxShadow: '0 12px 30px rgba(2,6,23,0.06)', margin: '10px auto 0' }}>
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10, textAlign: 'center' }}>Mis favoritos</div>
              {favorites.length === 0 ? (
                <div style={{ fontSize: 12, color: '#6b7280', textAlign: 'center' }}>Aún no tienes favoritos. Abre un lugar y toca el corazón ♡.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateRows: '1fr auto', gap: 8 }}>
                  <div style={{ maxHeight: 320, overflowY: 'auto', display: 'grid', gap: 10 }}>
                    {favorites.map((f) => {
                      const active = !!selectedFavoriteIds[f.id]
                      return (
                        <div
                          key={f.id}
                          onClick={() => toggleFavoriteSelection(f.id)}
                          title={f.name}
                          style={{
                            border: active ? '1px solid #4f46e5' : '1px solid #e5e7eb',
                            background: '#ffffff',
                            borderRadius: 12,
                            padding: 10,
                            boxShadow: '0 8px 20px rgba(2,6,23,0.05)',
                            cursor: 'pointer'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ color: '#ef4444' }}>❤</span>
                            <div style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{f.name}</div>
                          </div>
                          {f.category && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{f.category}</div>}
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ position: 'sticky', bottom: 0, background: '#ffffff', paddingTop: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <button onClick={clearFavoriteSelection} style={{ background: '#f3f4f6', color: '#111827', border: '1px solid #e5e7eb', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', fontWeight: 600 }}>
                        Mostrar todos
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#4b5563', textAlign: 'center', marginTop: 6 }}>
                      Mostrando {Object.keys(selectedFavoriteIds).some((k) => selectedFavoriteIds[k]) ? 'solo selección' : 'todos'} los favoritos en el mapa
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
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
              <Marker key={m.id} position={[m.lat, m.lng]} icon={categoryIcons[m.category] || createDivIcon('#111827', '📍')}>
                <Popup>
                  <PlacePopupContent place={m} isFav={isFavorite(m.id)} onToggleFav={toggleFavorite} />
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
