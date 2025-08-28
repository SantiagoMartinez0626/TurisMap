# 🗺️ TurisMap - Explorador Turístico

Una aplicación móvil que te permite descubrir atracciones turísticas cercanas a tu ubicación actual, con filtros por categoría y un mapa interactivo. **¡Completamente gratuita usando OpenStreetMap!**

## ✨ Características

- 🗺️ **Mapa interactivo** usando React Native Maps
- 📍 **Ubicación en tiempo real** del usuario
- 🏛️ **Filtros por categoría**: Museos, Parques, Restaurantes, Monumentos, Iglesias, Teatros, Centros Comerciales, y más
- 📱 **Interfaz moderna y intuitiva** con diseño responsive
- 🔍 **Búsqueda de lugares cercanos** usando OpenStreetMap + Overpass API
- 💰 **100% GRATIS** - No requiere API keys ni tarjetas de crédito
- 📊 **Información detallada** de cada lugar (dirección, teléfono, web, horarios)

## 🏗️ Arquitectura

- **Frontend**: React Native con Expo
- **Backend**: Node.js + Express
- **Mapas**: React Native Maps
- **API**: OpenStreetMap + Overpass API (completamente gratuito)
- **Ubicación**: Expo Location
- **Contenedores**: Docker

## 🚀 Instalación y Configuración

### Prerrequisitos

- Docker y Docker Compose instalados
- **¡No se requiere API Key!** OpenStreetMap es completamente gratuito

### 1. Ejecutar Script de Instalación

```bash
# En la raíz del proyecto
./setup.sh
```

### 2. ¡Listo!

- **Backend**: http://localhost:3000
- **Expo DevTools**: http://localhost:19000
- **App**: Escanea el código QR con la app Expo Go

---

## 📱 Uso de la Aplicación

1. **Permisos de ubicación**: La app solicitará acceso a tu ubicación
2. **Mapa principal**: Visualiza tu ubicación actual y lugares cercanos
3. **Filtros**: Usa los botones de categoría para filtrar lugares
4. **Información**: Toca las tarjetas de lugares para ver más detalles
5. **Centrar mapa**: Usa el botón de ubicación para volver a tu posición

## 🔧 Endpoints de la API

### Obtener lugares cercanos
```
GET /api/places/nearby?lat={lat}&lng={lng}&radius={radius}
```

### Buscar por categoría
```
GET /api/places/search?lat={lat}&lng={lng}&category={category}
```

### Obtener detalles de un lugar
```
GET /api/places/details/{placeId}
```

### Obtener categorías disponibles
```
GET /api/places/categories
```

## 🎨 Categorías Disponibles

- **museos** → Museos y galerías de arte
- **parques** → Parques y áreas verdes
- **restaurantes** → Restaurantes, cafés y bares
- **hoteles** → Hoteles, hostales y casas de huéspedes
- **monumentos** → Monumentos históricos y atracciones turísticas
- **iglesias** → Iglesias y templos
- **teatros** → Teatros y cines
- **centros_comerciales** → Centros comerciales y mercados
- **bibliotecas** → Bibliotecas públicas
- **zoos** → Zoológicos y acuarios
- **parques_tematicos** → Parques temáticos y de diversiones
- **estadios** → Estadios y centros deportivos

## 💡 Ventajas de OpenStreetMap

- **✅ Completamente gratuito** - No hay costos ocultos
- **✅ Datos abiertos** - Información verificada por la comunidad
- **✅ Sin límites** - No hay cuotas mensuales ni restricciones
- **✅ Actualizaciones en tiempo real** - La comunidad actualiza constantemente
- **✅ Cobertura global** - Disponible en todo el mundo
- **✅ Sin registro requerido** - Comienza a usar inmediatamente

## 🐛 Solución de Problemas

### Error de ubicación
- Verifica que la app tenga permisos de ubicación
- Asegúrate de que el GPS esté activado

### Error de conexión con el backend
- Verifica que el contenedor del backend esté ejecutándose
- Revisa los logs: `docker-compose logs backend`

### Lenta respuesta de la API
- OpenStreetMap puede ser más lento que Google Places
- Aumenta el timeout en la configuración si es necesario

## 📁 Estructura del Proyecto

```
TurisMap/
├── backend/                 # Servidor Node.js
│   ├── src/
│   │   ├── index.js        # API principal con OpenStreetMap
│   │   └── config.js       # Configuración del servidor
│   ├── package.json
│   └── Dockerfile
├── mobile/                  # App React Native
│   ├── app/
│   │   ├── index.js        # Pantalla principal del mapa
│   │   └── config.js       # Configuración de la app
│   ├── package.json
│   └── Dockerfile
└── docker-compose.yml       # Configuración de contenedores
```

## 🛠️ Desarrollo

### Modo desarrollo
```bash
# Backend con auto-reload
docker-compose exec backend npm run dev

# Mobile con Expo
docker-compose exec mobile npm start
```

### Logs en tiempo real
```bash
docker-compose logs -f
```

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes problemas o preguntas:
- Revisa los logs de Docker
- Verifica la conectividad a internet (necesaria para OpenStreetMap)
- Asegúrate de que todas las dependencias estén instaladas

---

## 🎯 ¿Por qué OpenStreetMap?

**Google Places API** requiere:
- Tarjeta de crédito para verificación
- Cuotas mensuales después del período gratuito
- Límites estrictos de uso
- Registro en Google Cloud Console

**OpenStreetMap** ofrece:
- ✅ Completamente gratuito
- ✅ Sin límites de uso
- ✅ Sin registro requerido
- ✅ Datos abiertos y verificados
- ✅ Comunidad activa y actualizaciones constantes

---

¡Disfruta explorando el mundo con TurisMap! 🌍✨
