// Configuración del servidor
const config = {
  // Configuración del servidor
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'development',
  },

  // Configuración de OpenStreetMap + Overpass API
  osm: {
    overpassBaseUrl: 'https://overpass-api.de/api/interpreter',
    nominatimBaseUrl: 'https://nominatim.openstreetmap.org',
    maxRadius: 50000, // Radio máximo en metros
    defaultRadius: 5000, // Radio por defecto en metros
    requestTimeout: 15000, // 15 segundos (Overpass puede ser lento)
  },

  // Configuración de CORS
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },

  // Configuración de categorías de lugares (tags de OpenStreetMap)
  categories: {
    museos: {
      tags: ['tourism=museum', 'amenity=arts_centre'],
      name: 'Museos',
      icon: 'library',
      color: '#e74c3c'
    },
    parques: {
      tags: ['leisure=park', 'leisure=garden', 'natural=park'],
      name: 'Parques',
      icon: 'leaf',
      color: '#27ae60'
    },
    restaurantes: {
      tags: ['amenity=restaurant', 'amenity=cafe', 'amenity=bar', 'amenity=fast_food'],
      name: 'Restaurantes',
      icon: 'restaurant',
      color: '#f39c12'
    },
    hoteles: {
      tags: ['tourism=hotel', 'tourism=hostel', 'tourism=guest_house'],
      name: 'Hoteles',
      icon: 'bed',
      color: '#3498db'
    },
    monumentos: {
      tags: ['historic=monument', 'historic=castle', 'historic=ruins', 'tourism=attraction'],
      name: 'Monumentos',
      icon: 'camera',
      color: '#9b59b6'
    },
    iglesias: {
      tags: ['amenity=place_of_worship'],
      name: 'Iglesias',
      icon: 'home',
      color: '#34495e'
    },
    teatros: {
      tags: ['amenity=theatre', 'amenity=cinema'],
      name: 'Teatros',
      icon: 'film',
      color: '#e67e22'
    },
    centros_comerciales: {
      tags: ['shop=mall', 'amenity=marketplace'],
      name: 'Centros Comerciales',
      icon: 'cart',
      color: '#1abc9c'
    },
    museos_arte: {
      tags: ['tourism=gallery', 'amenity=arts_centre'],
      name: 'Galerías de Arte',
      icon: 'color-palette',
      color: '#e91e63'
    },
    bibliotecas: {
      tags: ['amenity=library'],
      name: 'Bibliotecas',
      icon: 'book',
      color: '#8e44ad'
    },
    zoos: {
      tags: ['tourism=zoo'],
      name: 'Zoológicos',
      icon: 'paw',
      color: '#16a085'
    },
    acuarios: {
      tags: ['tourism=aquarium'],
      name: 'Acuarios',
      icon: 'water',
      color: '#2980b9'
    },
    parques_tematicos: {
      tags: ['tourism=theme_park'],
      name: 'Parques Temáticos',
      icon: 'happy',
      color: '#f1c40f'
    },
    estadios: {
      tags: ['leisure=sports_centre', 'amenity=stadium'],
      name: 'Estadios',
      icon: 'football',
      color: '#e74c3c'
    },
    cines: {
      tags: ['amenity=cinema'],
      name: 'Cines',
      icon: 'film',
      color: '#e67e22'
    },
  },

  // Configuración de límites de API
  limits: {
    maxPlacesPerRequest: 50,
    maxPhotosPerPlace: 0, // OpenStreetMap no tiene fotos por defecto
    maxReviewsPerPlace: 0, // OpenStreetMap no tiene reviews
    requestTimeout: 15000, // 15 segundos
  },

  // Configuración de caché (para implementación futura)
  cache: {
    enabled: process.env.CACHE_ENABLED === 'true' || false,
    ttl: 600000, // 10 minutos en milisegundos (Overpass es más lento)
  },

  // Configuración de logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    enableConsole: true,
    enableFile: false,
  },
};

module.exports = config;
