# 🚀 Instalación Rápida - TurisMap

## ⚡ Pasos Rápidos (3 minutos)

### 1. 🐳 Ejecutar Script de Instalación
```bash
# En la raíz del proyecto
./setup.sh
```

### 2. 🎯 ¡Listo!
- **Backend**: http://localhost:3000
- **Expo DevTools**: http://localhost:19000
- **App**: Escanea el código QR con Expo Go

---

## 🎉 ¡Ventajas de OpenStreetMap!

- **💰 100% GRATIS** - No requiere API keys ni tarjetas de crédito
- **🚀 Sin registro** - Comienza a usar inmediatamente
- **🌍 Cobertura global** - Disponible en todo el mundo
- **📊 Datos abiertos** - Información verificada por la comunidad

---

## 🔧 Si el script no funciona

### Instalación Manual

#### Backend
```bash
cd backend
docker-compose exec backend npm install
```

#### Mobile
```bash
cd mobile
docker-compose exec mobile npm install
```

#### Ejecutar
```bash
docker-compose up -d
```

---

## 📱 Usar la App

1. **Instala Expo Go** en tu móvil
2. **Escanea el código QR** desde http://localhost:19000
3. **Permite ubicación** cuando la app lo solicite
4. **¡Explora lugares cercanos!**

---

## 🐛 Problemas Comunes

### Error de ubicación
- Verifica permisos de ubicación
- Activa GPS en tu dispositivo

### Error de conexión
- Verifica que Docker esté ejecutándose
- Revisa logs: `docker-compose logs -f`

### Lenta respuesta
- OpenStreetMap puede ser más lento que Google Places
- Es normal, los datos son gratuitos y de alta calidad

---

## 📞 Ayuda

- **Logs en tiempo real**: `docker-compose logs -f`
- **Reiniciar servicios**: `docker-compose restart`
- **Detener todo**: `docker-compose down`

---

## 🎯 ¿Por qué OpenStreetMap?

**Google Places API** requiere:
- ❌ Tarjeta de crédito para verificación
- ❌ Cuotas mensuales después del período gratuito
- ❌ Límites estrictos de uso
- ❌ Registro en Google Cloud Console

**OpenStreetMap** ofrece:
- ✅ Completamente gratuito
- ✅ Sin límites de uso
- ✅ Sin registro requerido
- ✅ Datos abiertos y verificados

---

¡Disfruta explorando con TurisMap! 🗺️✨
