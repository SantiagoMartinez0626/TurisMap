const express = require('express');
const cors = require('cors');
const axios = require('axios');
const config = require('./config');

const app = express();
const PORT = config.server.port;
const HOST = config.server.host;

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Función para construir consulta Overpass QL
function buildOverpassQuery(lat, lng, radius, categoriesInput) {
  const bbox = calculateBoundingBox(lat, lng, radius);
  
  let query = `[out:json][timeout:25];(`;
  
  const categories = Array.isArray(categoriesInput)
    ? categoriesInput
    : (typeof categoriesInput === 'string' && categoriesInput.length > 0
        ? categoriesInput.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
        : null);

  if (categories && categories.length > 0) {
    categories.forEach(cat => {
      const categoryConfig = config.categories[cat];
      if (categoryConfig && categoryConfig.tags) {
        categoryConfig.tags.forEach(tag => {
          const [key, value] = tag.split('=');
          if (value) {
            query += `\n  node["${key}"="${value}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
            query += `\n  way["${key}"="${value}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
            query += `\n  relation["${key}"="${value}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
          } else {
            query += `\n  node["${key}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
            query += `\n  way["${key}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
            query += `\n  relation["${key}"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
          }
        });
      }
    });
  } else {
    // Buscar todos los lugares turísticos
    query += `\n  node["tourism"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  way["tourism"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  relation["tourism"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  node["amenity"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  way["amenity"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  relation["amenity"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  node["leisure"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  way["leisure"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  relation["leisure"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  node["historic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  way["historic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
    query += `\n  relation["historic"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});`;
  }
  
  // Pedimos center para ways/relations para poder ubicarlos en el mapa
  query += `\n);\nout center qt;`;
  
  return query;
}

// Función para calcular bounding box basado en lat, lng y radio
function calculateBoundingBox(lat, lng, radius) {
  const latDelta = radius / 111320; // Aproximadamente 111.32 km por grado de latitud
  const lngDelta = radius / (111320 * Math.cos(lat * Math.PI / 180));
  
  return {
    north: lat + latDelta,
    south: lat - latDelta,
    east: lng + lngDelta,
    west: lng - lngDelta
  };
}

// Función para obtener lugares turísticos cercanos usando OpenStreetMap
async function getNearbyPlaces(lat, lng, radius = config.osm.defaultRadius, categories = null) {
  try {
    const query = buildOverpassQuery(lat, lng, radius, categories);
    const payload = `data=${encodeURIComponent(query)}`;
    const response = await axios.post(config.osm.overpassBaseUrl, payload, {
      timeout: config.osm.requestTimeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'TurisMap/1.0'
      }
    });
    
    if (response.data && response.data.elements) {
      const places = [];
      const seenPlaces = new Set();
      
      response.data.elements.forEach(element => {
        if (element.tags && element.tags.name) {
          const placeId = `${element.type}_${element.id}`;
          
          if (!seenPlaces.has(placeId)) {
            seenPlaces.add(placeId);
            
            // Calcular distancia desde el punto de origen
            const elLat = element.lat || (element.center && element.center.lat);
            const elLon = element.lon || (element.center && element.center.lon);
            if (typeof elLat !== 'number' || typeof elLon !== 'number') {
              return;
            }
            const distance = calculateDistance(lat, lng, elLat, elLon);
            
            if (distance <= radius) {
              const place = {
                id: placeId,
                name: element.tags.name,
                location: {
                  lat: elLat,
                  lng: elLon
                },
                tags: element.tags,
                distance: Math.round(distance),
                photos: [], // OpenStreetMap no tiene fotos por defecto
                openNow: null, // OpenStreetMap no tiene horarios por defecto
                rating: null, // OpenStreetMap no tiene ratings
                userRatingsTotal: null,
                priceLevel: null,
                vicinity: element.tags['addr:street'] || element.tags['addr:city'] || 'Ubicación disponible',
                category: determineCategory(element.tags)
              };
              
              places.push(place);
            }
          }
        }
      });
      
      // Ordenar por distancia y limitar resultados
      return places
        .sort((a, b) => a.distance - b.distance);
    }
    
    return [];
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    console.error('Error obteniendo lugares de OpenStreetMap:', status, message);
    const err = new Error(typeof message === 'string' ? message : 'Error en Overpass');
    err.status = status;
    throw err;
  }
}

// Función para calcular distancia entre dos puntos (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Función para determinar la categoría basada en los tags
function determineCategory(tags) {
  for (const [categoryId, categoryConfig] of Object.entries(config.categories)) {
    if (categoryConfig.tags) {
      for (const tag of categoryConfig.tags) {
        const [key, value] = tag.split('=');
        if (value && tags[key] === value) {
          return categoryId;
        } else if (!value && tags[key]) {
          return categoryId;
        }
      }
    }
  }
  return 'otros';
}

// Función para obtener detalles de un lugar específico
async function getPlaceDetails(placeId) {
  try {
    // Para OpenStreetMap, necesitamos extraer la información del ID
    const [type, id] = placeId.split('_');
    
    if (!type || !id) {
      return null;
    }
    
    // Construir consulta para obtener detalles específicos
    const query = `[out:json][timeout:25];${type}(${id});out center;`;
    const payload = `data=${encodeURIComponent(query)}`;
    const response = await axios.post(config.osm.overpassBaseUrl, payload, {
      timeout: config.osm.requestTimeout,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'User-Agent': 'TurisMap/1.0'
      }
    });
    
    if (response.data && response.data.elements && response.data.elements.length > 0) {
      const element = response.data.elements[0];
      
      const elLat = element.lat || (element.center && element.center.lat);
      const elLon = element.lon || (element.center && element.center.lon);
      return {
        id: placeId,
        name: element.tags.name || 'Sin nombre',
        location: {
          lat: elLat,
          lng: elLon
        },
        tags: element.tags,
        address: buildAddress(element.tags),
        phone: element.tags.phone || element.tags['contact:phone'] || null,
        website: element.tags.website || element.tags['contact:website'] || null,
        openingHours: element.tags.opening_hours || null,
        photos: [],
        openNow: null,
        rating: null,
        userRatingsTotal: null,
        priceLevel: null,
        vicinity: element.tags['addr:street'] || element.tags['addr:city'] || 'Ubicación disponible',
        category: determineCategory(element.tags),
        distance: 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error obteniendo detalles del lugar:', error.message);
    throw error;
  }
}

// Función para construir dirección a partir de tags
function buildAddress(tags) {
  const parts = [];
  
  if (tags['addr:housenumber']) parts.push(tags['addr:housenumber']);
  if (tags['addr:street']) parts.push(tags['addr:street']);
  if (tags['addr:city']) parts.push(tags['addr:city']);
  if (tags['addr:postcode']) parts.push(tags['addr:postcode']);
  if (tags['addr:country']) parts.push(tags['addr:country']);
  
  return parts.length > 0 ? parts.join(', ') : 'Dirección no disponible';
}

// Función para validar coordenadas
function validateCoordinates(lat, lng) {
  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  
  if (isNaN(latNum) || isNaN(lngNum)) {
    return false;
  }
  
  if (latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
    return false;
  }
  
  return true;
}

// Función para validar radio
function validateRadius(radius) {
  const radiusNum = parseInt(radius);
  if (isNaN(radiusNum) || radiusNum <= 0 || radiusNum > config.osm.maxRadius) {
    return false;
  }
  return true;
}

// Rutas de la API
app.get('/', (req, res) => {
  res.json({ 
    message: 'API de TurisMap funcionando 🚀 (OpenStreetMap)',
    version: '1.0.0',
    environment: config.server.environment,
    dataSource: 'OpenStreetMap + Overpass API',
    endpoints: {
      '/api/places/nearby': 'GET - Obtener lugares cercanos',
      '/api/places/details/:placeId': 'GET - Obtener detalles de un lugar',
      '/api/places/search': 'GET - Buscar lugares por categoría',
      '/api/places/categories': 'GET - Obtener categorías disponibles'
    },
    documentation: 'Consulta el README.md para más información'
  });
});

// Obtener categorías disponibles
app.get('/api/places/categories', (req, res) => {
  const categories = Object.keys(config.categories).map(key => ({
    id: key,
    name: config.categories[key].name,
    icon: config.categories[key].icon,
    color: config.categories[key].color,
    tags: config.categories[key].tags
  }));
  
  res.json({ categories, count: categories.length });
});

// Obtener lugares cercanos
app.get('/api/places/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = config.osm.defaultRadius, category } = req.query;
    
    // Validar parámetros
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Se requieren las coordenadas lat y lng',
        example: '/api/places/nearby?lat=40.4168&lng=-3.7038&radius=5000'
      });
    }
    
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas. Lat debe estar entre -90 y 90, lng entre -180 y 180' 
      });
    }
    
    if (!validateRadius(radius)) {
      return res.status(400).json({ 
        error: `Radio inválido. Debe estar entre 1 y ${config.osm.maxRadius} metros` 
      });
    }
    
    const categories = category ? String(category).split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : null;
    const places = await getNearbyPlaces(parseFloat(lat), parseFloat(lng), parseInt(radius), categories);
    res.json({ 
      places, 
      count: places.length,
      query: { lat, lng, radius, category: categories },
      timestamp: new Date().toISOString(),
      dataSource: 'OpenStreetMap'
    });
    
  } catch (error) {
    const status = error.status || error.response?.status || 500;
    console.error('Error en /api/places/nearby:', error.message || error);
    res.status(status).json({ 
      error: 'Error en servicio de datos',
      message: config.server.environment === 'development' ? (error.message || 'Error') : 'Error al consultar datos'
    });
  }
});

// Obtener detalles de un lugar específico
app.get('/api/places/details/:placeId', async (req, res) => {
  try {
    const { placeId } = req.params;
    
    if (!placeId) {
      return res.status(400).json({ error: 'Se requiere el ID del lugar' });
    }
    
    const placeDetails = await getPlaceDetails(placeId);
    
    if (!placeDetails) {
      return res.status(404).json({ error: 'Lugar no encontrado' });
    }
    
    res.json(placeDetails);
    
  } catch (error) {
    console.error('Error en /api/places/details:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: config.server.environment === 'development' ? error.message : 'Error interno'
    });
  }
});

// Buscar lugares por categoría
app.get('/api/places/search', async (req, res) => {
  try {
    const { lat, lng, radius = config.osm.defaultRadius, category } = req.query;
    
    // Validar parámetros
    if (!lat || !lng || !category) {
      return res.status(400).json({ 
        error: 'Se requieren las coordenadas lat, lng y la categoría',
        example: '/api/places/search?lat=40.4168&lng=-3.7038&category=museos&radius=5000'
      });
    }
    
    if (!validateCoordinates(lat, lng)) {
      return res.status(400).json({ 
        error: 'Coordenadas inválidas. Lat debe estar entre -90 y 90, lng entre -180 y 180' 
      });
    }
    
    if (!validateRadius(radius)) {
      return res.status(400).json({ 
        error: `Radio inválido. Debe estar entre 1 y ${config.osm.maxRadius} metros` 
      });
    }
    
    if (!config.categories[category.toLowerCase()]) {
      return res.status(400).json({ 
        error: 'Categoría no válida',
        availableCategories: Object.keys(config.categories)
      });
    }
    
    const places = await getNearbyPlaces(parseFloat(lat), parseFloat(lng), parseInt(radius), [category]);
    
    res.json({ 
      places, 
      count: places.length, 
      category, 
      query: { lat, lng, radius, category },
      timestamp: new Date().toISOString(),
      dataSource: 'OpenStreetMap'
    });
    
  } catch (error) {
    console.error('Error en /api/places/search:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      message: config.server.environment === 'development' ? error.message : 'Error interno'
    });
  }
});

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    availableEndpoints: [
      'GET /',
      'GET /api/places/categories',
      'GET /api/places/nearby',
      'GET /api/places/details/:placeId',
      'GET /api/places/search'
    ]
  });
});

// Middleware para manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: config.server.environment === 'development' ? error.message : 'Error interno'
  });
});

// Iniciar servidor
app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor de TurisMap corriendo en http://${HOST}:${PORT}`);
  console.log(`📍 Entorno: ${config.server.environment}`);
  console.log(`🗺️  Fuente de datos: OpenStreetMap + Overpass API`);
  console.log(`📚 Endpoints disponibles:`);
  console.log(`   - GET / - Información de la API`);
  console.log(`   - GET /api/places/categories - Categorías disponibles`);
  console.log(`   - GET /api/places/nearby - Lugares cercanos`);
  console.log(`   - GET /api/places/search - Búsqueda por categoría`);
  console.log(`   - GET /api/places/details/:placeId - Detalles de un lugar`);
  console.log(`✅ ¡No se requiere API Key! OpenStreetMap es completamente gratuito.`);
});
