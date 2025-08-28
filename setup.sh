#!/bin/bash

echo "🚀 Configurando TurisMap - Explorador Turístico"
echo "================================================"
echo "🗺️  Usando OpenStreetMap + Overpass API (100% GRATIS)"
echo ""

# Verificar si Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker primero."
    exit 1
fi

# Verificar si Docker Compose está instalado
if ! command -v docker compose &> /dev/null; then
    echo "❌ Docker Compose no está instalado. Por favor instala Docker Compose primero."
    exit 1
fi

echo "✅ Docker y Docker Compose están instalados"
echo ""

# Construir y levantar los contenedores
echo "🔨 Construyendo contenedores..."
docker compose build

echo "🚀 Iniciando servicios..."
docker compose up -d

# Esperar un momento para que los servicios se inicien
echo "⏳ Esperando que los servicios se inicien..."
sleep 10

# Verificar estado de los servicios
echo "📊 Estado de los servicios:"
docker compose ps

echo ""
echo "🎉 ¡TurisMap está configurado y ejecutándose!"
echo ""
echo "💰 ¡COMPLETAMENTE GRATIS! No se requiere API Key ni tarjeta de crédito"
echo "🗺️  Usando OpenStreetMap + Overpass API"
echo ""
echo "📍 Servicios disponibles:"
echo "   - Backend API: http://localhost:3000"
echo "   - Expo DevTools: http://localhost:19000"
echo ""
echo "📱 Para usar la app:"
echo "   1. Instala Expo Go en tu dispositivo móvil"
echo "   2. Escanea el código QR desde http://localhost:19000"
echo "   3. ¡Disfruta explorando lugares turísticos!"
echo ""
echo "🔧 Comandos útiles:"
echo "   - Ver logs: docker-compose logs -f"
echo "   - Detener servicios: docker-compose down"
echo "   - Reiniciar servicios: docker-compose restart"
echo ""
echo "💡 Ventajas de OpenStreetMap:"
echo "   ✅ Sin costos ocultos"
echo "   ✅ Sin límites de uso"
echo "   ✅ Sin registro requerido"
echo "   ✅ Datos abiertos y verificados"
echo ""
echo "📚 Para más información, consulta el README.md"
