// Configuración de la aplicación móvil
const config = {
  // Configuración de la API
  api: {
    baseUrl: __DEV__ ? 'http://192.168.1.10:3000/api' : 'https://tu-produccion-api.com/api',
    timeout: 30000, // 30 segundos (aumentado para Overpass)
    retryAttempts: 3,
  },

  // Configuración del mapa
  map: {
    defaultZoom: 15,
    maxZoom: 20,
    minZoom: 10,
    defaultRadius: 5000, // metros
    maxRadius: 50000, // metros
    userLocationUpdateInterval: 30000, // 30 segundos
  },

  // Configuración de ubicación
  location: {
    accuracy: 3, // LocationAccuracy.Balanced (3) en lugar de 10
    timeout: 30000, // 30 segundos (aumentado)
    maximumAge: 60000, // 1 minuto
  },

  // Configuración de la interfaz
  ui: {
    primaryColor: '#4ecdc4',
    secondaryColor: '#2c3e50',
    accentColor: '#f39c12',
    errorColor: '#ff6b6b',
    successColor: '#51cf66',
    borderRadius: 12,
    shadowOpacity: 0.1,
    animationDuration: 300,
  },

  // Configuración de categorías (actualizada para OpenStreetMap)
  categories: [
    { id: 'todos', name: 'Todos', icon: 'map', color: '#4ecdc4' },
    { id: 'museos', name: 'Museos', icon: 'library', color: '#e74c3c' },
    { id: 'parques', name: 'Parques', icon: 'leaf', color: '#27ae60' },
    { id: 'restaurantes', name: 'Restaurantes', icon: 'restaurant', color: '#f39c12' },
    { id: 'hoteles', name: 'Hoteles', icon: 'bed', color: '#3498db' },
    { id: 'monumentos', name: 'Monumentos', icon: 'camera', color: '#9b59b6' },
    { id: 'iglesias', name: 'Iglesias', icon: 'home', color: '#34495e' },
    { id: 'teatros', name: 'Teatros', icon: 'film', color: '#e67e22' },
    { id: 'centros_comerciales', name: 'Centros Comerciales', icon: 'cart', color: '#1abc9c' },
    { id: 'museos_arte', name: 'Galerías de Arte', icon: 'color-palette', color: '#e91e63' },
    { id: 'bibliotecas', name: 'Bibliotecas', icon: 'book', color: '#8e44ad' },
    { id: 'zoos', name: 'Zoológicos', icon: 'paw', color: '#16a085' },
    { id: 'acuarios', name: 'Acuarios', icon: 'water', color: '#2980b9' },
    { id: 'parques_tematicos', name: 'Parques Temáticos', icon: 'happy', color: '#f1c40f' },
    { id: 'estadios', name: 'Estadios', icon: 'football', color: '#e74c3c' },
    { id: 'cines', name: 'Cines', icon: 'film', color: '#e67e22' },
  ],

  // Configuración de límites
  limits: {
    maxPlacesToShow: 50,
    maxPhotosPerPlace: 0, // OpenStreetMap no tiene fotos por defecto
    maxDescriptionLength: 100,
  },

  // Configuración de caché
  cache: {
    enabled: true,
    placesTTL: 600000, // 10 minutos (Overpass es más lento)
    userLocationTTL: 60000, // 1 minuto
  },

  // Configuración de notificaciones
  notifications: {
    enabled: true,
    showNearbyPlaces: true,
    showLocationUpdates: false,
  },

  // Configuración de desarrollo
  development: {
    enableLogs: __DEV__,
    enableDebugMenu: __DEV__,
    mockData: false,
  },
};

export default config;
