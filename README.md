# 🗺️ TurisMap - Explorador Turístico (Web)

Aplicación web para descubrir atracciones turísticas cercanas a tu ubicación, con filtros por categoría y un mapa interactivo. Se alimenta de OpenStreetMap mediante Overpass API, por lo que es 100% gratuita (no requiere API keys).

> Nota: El frontend fue migrado de Expo/React Native a Web. Ya no se utiliza Expo Go.

## ✨ Características

- 🗺️ **Mapa interactivo** (Leaflet + React)
- 📍 **Ubicación en tiempo real** (opción de seguir tu ubicación)
- 🏛️ **Filtros por categoría** (museos, parques, restaurantes, hospitales, etc.)
- 📱 **UI responsive** con enfoque en simplicidad
- 🔍 **Búsqueda de lugares cercanos** con Overpass API (OSM)
- 📊 **Detalles por lugar**: dirección, teléfono, web y horarios (si existen)

## 🏗️ Arquitectura

- **Frontend**: React 18 + Vite + React-Leaflet
- **Backend**: Node.js + Express
- **Datos**: OpenStreetMap + Overpass API
- **Contenedores**: Docker + Docker Compose

## 🚀 Ejecución

### Opción A: con Docker Compose (recomendada)
Requisitos: Docker y Docker Compose

```bash
docker compose up --build
```

Servicios:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### Opción B: local sin Docker
Requisitos: Node.js 18+

1) Backend
```bash
cd backend
npm install
npm run dev   # arranca en http://localhost:3000
```

2) Frontend
```bash
cd frontend
npm install
# Opcional: export VITE_BACKEND_URL=http://localhost:3000
npm run dev   # arranca en http://localhost:5173
```

El frontend está configurado para proxyear `/api` hacia `VITE_BACKEND_URL` (por defecto `http://backend:3000` en Docker).

## ⚙️ Variables de entorno

- Frontend
  - `VITE_BACKEND_URL` (ej.: `http://localhost:3000`)
- Backend
  - `PORT` (por defecto `3000`)
  - `HOST` (por defecto `0.0.0.0`)
  - `NODE_ENV` (`development` | `production`)
  - `CORS_ORIGIN` (en desarrollo `*`; en producción, configurarlo adecuadamente)

## 🔧 Endpoints de la API

Obtener lugares cercanos:
```
GET /api/places/nearby?lat={lat}&lng={lng}&radius={radius}[&category={category}]
```

Buscar por categoría:
```
GET /api/places/search?lat={lat}&lng={lng}&category={category}[&radius={radius}]
```

Detalles de un lugar:
```
GET /api/places/details/{placeId}
```

Categorías disponibles:
```
GET /api/places/categories
```

## 📱 Uso

1. Permite el acceso a tu ubicación en el navegador.
2. El mapa se centrará en tu posición y cargará lugares cercanos.
3. Usa los filtros de categoría para ajustar resultados.
4. Haz clic en un marcador para ver detalles del lugar.
5. Activa “Seguir mi ubicación” para rastreo en tiempo real.

## 🎨 Categorías (ejemplos)

- Principales: **museos**, **parques**, **restaurantes**, **hoteles**, **monumentos**, **iglesias**, **teatros**, **centros_comerciales**
- Otras: **bibliotecas**, **zoos**, **acuarios**, **parques_tematicos**, **estadios**, **cines**, **colegios**, **clinicas**, **hospitales**, **estaciones**

## 🏭 Producción (sugerencias)

- Frontend:
  - Genera build estático: `cd frontend && npm run build` (salida en `dist/`)
  - Sirve estáticos con Nginx o cualquier hosting de archivos estáticos
- Backend:
  - Ejecutar con `npm start` en lugar de `nodemon`
  - Configurar CORS y variables de entorno adecuadamente
- Docker:
  - Considerar imágenes multi-stage y separar dev/prod

## 🐛 Solución de problemas

- Ubicación: revisa permisos del navegador y GPS/servicios de ubicación.
- Backend: valida que el servicio esté arriba; logs: `docker compose logs backend`.
- Rendimiento: Overpass puede ser lento; ajusta `requestTimeout`/radios en `backend/src/config.js`.

## 📁 Estructura del proyecto

```
TurisMap/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   └── config.js
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── MapView.jsx
│   ├── index.html
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

---

¡Disfruta explorando el mundo con TurisMap! 🌍✨
