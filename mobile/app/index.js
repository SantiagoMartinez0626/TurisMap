import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Platform } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Ionicons } from '@expo/vector-icons';
import config from './config';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const mapRef = useRef(null);

  // Handler de autenticación al pulsar el botón
  const handleAuthenticate = async () => {
    setAuthLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      const hasFace = types?.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
      const hasTouch = types?.includes(LocalAuthentication.AuthenticationType.FINGERPRINT);

      if (config.development.enableLogs) {
        console.log('[Auth] hasHardware:', hasHardware);
        console.log('[Auth] isEnrolled:', isEnrolled);
        console.log('[Auth] supported types:', types);
      }

      if (!hasHardware || (!hasFace && !hasTouch)) {
        setIsUnlocked(false);
        setError('Tu dispositivo no soporta Face ID/Touch ID.');
        return;
      }

      if (!isEnrolled) {
        setIsUnlocked(false);
        setError('No hay datos biométricos registrados en este dispositivo.');
        return;
      }

      const prompt = hasFace ? 'Usa Face ID para continuar' : 'Usa Touch ID para continuar';
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: prompt,
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        ...(Platform.OS === 'ios' ? { fallbackLabel: '' } : {}),
      });

      if (config.development.enableLogs) {
        console.log('[Auth] result:', result);
      }

      if (result.success) {
        setIsUnlocked(true);
        await ensureBackendSession();
        setIsAuthenticated(true);
        setShowWelcome(false);
        setError(null);
      } else {
        setIsUnlocked(false);
        const reason = result?.error || 'cancel';
        const mapped = reason === 'lockout' 
          ? 'Face ID/Touch ID bloqueado. Desbloquea con tu código en Ajustes y reintenta.'
          : reason === 'not_enrolled'
          ? 'No hay datos biométricos registrados. Configura Face ID/Touch ID en el dispositivo.'
          : reason === 'system_cancel'
          ? 'El sistema canceló la autenticación. Vuelve a intentarlo.'
          : 'Autenticación cancelada o fallida';
        setError(mapped);
      }
    } catch (e) {
      setIsUnlocked(false);
      setError('Error en autenticación biométrica.');
      if (config.development.enableLogs) {
        console.log('[Auth] exception:', e);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  // Crear sesión en backend (devuelve y guarda token)
  const ensureBackendSession = async () => {
    // Obtener o crear deviceId persistente
    let deviceId = await SecureStore.getItemAsync('tm_device_id');
    if (!deviceId) {
      deviceId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
      await SecureStore.setItemAsync('tm_device_id', deviceId);
    }

    // Si ya hay token, no repetir
    const existingToken = await SecureStore.getItemAsync('tm_token');
    if (existingToken) return;

    try {
      const res = await fetch(`${config.api.baseUrl.replace(/\/$/, '')}/auth/biometric-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId }),
      });
      const data = await res.json();
      if (res.ok && data?.token) {
        await SecureStore.setItemAsync('tm_token', data.token);
        if (data.refreshToken) await SecureStore.setItemAsync('tm_refresh', data.refreshToken);
      }
    } catch (e) {
      // si falla, seguimos sin token
    }
  };

  // Obtener ubicación actual del usuario al desbloquear
  useEffect(() => {
    if (!isUnlocked) return;
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Se requiere permiso para acceder a la ubicación');
          setLoading(false);
          return;
        }

        let currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.LocationAccuracy.Balanced, // Usar enum correcto
          timeout: config.location.timeout,
          maximumAge: config.location.maximumAge,
        });
        
        setLocation(currentLocation);
        
        // Obtener lugares cercanos
        await fetchNearbyPlaces(
          currentLocation.coords.latitude,
          currentLocation.coords.longitude
        );
      } catch (error) {
        console.error('Error obteniendo ubicación:', error);
        setError('Error al obtener la ubicación');
        setLoading(false);
      }
    })();
  }, [isUnlocked]);

  // Función para obtener lugares cercanos
  const fetchNearbyPlaces = async (lat, lng, category = null) => {
    try {
      setLoading(true);
      let url = `${config.api.baseUrl}/places/nearby?lat=${lat}&lng=${lng}&radius=${config.map.defaultRadius}`;
      
      if (category && category !== 'todos') {
        url = `${config.api.baseUrl}/places/search?lat=${lat}&lng=${lng}&radius=${config.map.defaultRadius}&category=${category}`;
      }
      
      if (config.development.enableLogs) {
        console.log('[TurisMap] API baseUrl:', config.api.baseUrl);
        console.log('[TurisMap] Request URL:', url);
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.api.timeout);
      
      const token = await SecureStore.getItemAsync('tm_token');
      const response = await fetch(url, {
        signal: controller.signal,
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (response.ok) {
        setPlaces(data.places || []);
        if (config.development.enableLogs) {
          console.log(`Lugares obtenidos: ${data.count}`);
        }
      } else {
        setError(data.error || 'Error al obtener lugares');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Tiempo de espera agotado al conectar con el servidor');
      } else {
        setError('Error de conexión con el servidor');
      }
      if (config.development.enableLogs) {
        console.error('Error en fetchNearbyPlaces:', error);
        console.log('[TurisMap] API baseUrl (on error):', config.api.baseUrl);
        console.log('[TurisMap] Última URL solicitada:', url);
        console.log('[TurisMap] Error name/message:', error?.name, error?.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para filtrar por categoría
  const handleCategoryFilter = async (category) => {
    setSelectedCategory(category);
    if (location) {
      await fetchNearbyPlaces(
        location.coords.latitude,
        location.coords.longitude,
        category
      );
    }
  };

  // Función para centrar el mapa en la ubicación actual
  const centerOnUserLocation = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  // Función para mostrar detalles de un lugar
  const showPlaceDetails = (place) => {
    const details = [
      place.vicinity,
      place.distance ? `Distancia: ${place.distance}m` : null,
      place.tags?.phone ? `Teléfono: ${place.tags.phone}` : null,
      place.tags?.website ? `Web: ${place.tags.website}` : null,
      place.tags?.opening_hours ? `Horarios: ${place.tags.opening_hours}` : null,
    ].filter(Boolean).join('\n\n');
    
    Alert.alert(
      place.name,
      details || 'Información adicional no disponible',
      [
        { text: 'Cerrar', style: 'cancel' },
        { text: 'Ver en mapa', onPress: () => {
          if (mapRef.current) {
            mapRef.current.animateToRegion({
              latitude: place.location.lat,
              longitude: place.location.lng,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            });
          }
        }},
      ]
    );
  };

  // Pantalla de bienvenida antes de autenticar
  if (showWelcome && !isUnlocked) {
    return (
      <View style={styles.welcomeContainer}>
        <View style={styles.welcomeContent}>
          <Text style={styles.welcomeTitle}>Bienvenido a TurisMap</Text>
          <Text style={styles.welcomeSubtitle}>
            Esta app te ayuda a descubrir atracciones turísticas cercanas usando mapas libres de OpenStreetMap.
          </Text>
        </View>
        {error && (
          <Text style={[styles.errorText, { textAlign: 'center', marginHorizontal: 24 }]}>{error}</Text>
        )}
        <TouchableOpacity
          style={[styles.welcomeAuthButton, { backgroundColor: authLoading ? '#ccc' : config.ui.primaryColor }]}
          onPress={handleAuthenticate}
          disabled={authLoading}
        >
          {authLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.welcomeAuthText}>Autenticarse</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={config.ui.errorColor} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={[styles.retryButton, { backgroundColor: config.ui.primaryColor }]} 
          onPress={() => {
            // Reintentar biometría si no está desbloqueado; si no, refrescar ubicación
            if (!isUnlocked) {
              // Forzar reintento de biometría
              setError(null);
              (async () => {
                try {
                  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                  const hasFace = types?.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION);
                  const prompt = hasFace ? 'Usa Face ID para continuar' : 'Usa Touch ID para continuar';
                  const result = await LocalAuthentication.authenticateAsync({
                    promptMessage: prompt,
                    cancelLabel: 'Cancelar',
                    disableDeviceFallback: false,
                    ...(Platform.OS === 'ios' ? { fallbackLabel: '' } : {}),
                  });
                  if (result.success) setIsUnlocked(true);
                } catch {}
              })();
            } else {
              setError(null);
            }
          }}
        >
          <Text style={styles.retryButtonText}>Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isUnlocked) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.ui.primaryColor} />
        <Text style={styles.loadingText}>Verificando identidad...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={config.ui.primaryColor} />
        <Text style={styles.loadingText}>Obteniendo tu ubicación...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Mapa */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        maxZoomLevel={config.map.maxZoom}
        minZoomLevel={config.map.minZoom}
      >
        {/* Marcadores de lugares */}
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{
              latitude: place.location.lat,
              longitude: place.location.lng,
            }}
            title={place.name}
            description={place.vicinity}
            onPress={() => showPlaceDetails(place)}
          />
        ))}
      </MapView>

      {/* Botón para centrar en ubicación actual */}
      <TouchableOpacity 
        style={[styles.centerButton, { backgroundColor: config.ui.primaryColor }]} 
        onPress={centerOnUserLocation}
      >
        <Ionicons name="locate" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Filtros de categoría */}
      <View style={styles.categoryContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {config.categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
                { backgroundColor: selectedCategory === category.id ? category.color : '#fff' }
              ]}
              onPress={() => handleCategoryFilter(category.id)}
            >
              <Ionicons
                name={category.icon}
                size={20}
                color={selectedCategory === category.id ? '#fff' : category.color}
              />
              <Text
                style={[
                  styles.categoryButtonText,
                  { color: selectedCategory === category.id ? '#fff' : category.color },
                  selectedCategory === category.id && styles.categoryButtonTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Información de lugares */}
      {places.length > 0 && (
        <View style={styles.placesContainer}>
          <Text style={styles.placesTitle}>
            {selectedCategory === 'todos' ? 'Lugares cercanos' : `${config.categories.find(c => c.id === selectedCategory)?.name} cercanos`}
            {' '}({places.length})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {places.slice(0, config.limits.maxPlacesToShow).map((place) => (
              <TouchableOpacity 
                key={place.id} 
                style={styles.placeCard}
                onPress={() => showPlaceDetails(place)}
              >
                {place.photos.length > 0 && (
                  <View style={styles.placeImageContainer}>
                    <Text style={styles.placeImagePlaceholder}>📷</Text>
                  </View>
                )}
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName} numberOfLines={2}>
                    {place.name}
                  </Text>
                  <Text style={styles.placeVicinity} numberOfLines={1}>
                    {place.vicinity}
                  </Text>
                  {place.distance && (
                    <View style={styles.distanceContainer}>
                      <Ionicons name="location" size={14} color={config.ui.accentColor} />
                      <Text style={styles.distanceText}>{place.distance}m</Text>
                    </View>
                  )}
                  {place.tags?.phone && (
                    <View style={styles.phoneContainer}>
                      <Ionicons name="call" size={12} color={config.ui.successColor} />
                      <Text style={styles.phoneText} numberOfLines={1}>
                        {place.tags.phone}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Indicador de carga */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={config.ui.primaryColor} />
          <Text style={styles.loadingOverlayText}>Buscando lugares...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  welcomeContainer: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'space-between',
    paddingTop: 100,
    paddingBottom: 40,
  },
  welcomeContent: {
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#2c3e50',
    marginBottom: 10,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    lineHeight: 22,
    textAlign: 'center',
  },
  welcomeAuthButton: {
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 28,
    alignItems: 'center',
  },
  welcomeAuthText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  map: {
    flex: 1,
  },
  centerButton: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  categoryContainer: {
    position: 'absolute',
    top: 170,
    left: 20,
    right: 20,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  categoryButtonActive: {
    // El color se aplica dinámicamente
  },
  categoryButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#fff',
  },
  placesContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2c3e50',
  },
  placeCard: {
    width: 200,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  placeImageContainer: {
    height: 120,
    backgroundColor: '#f1f3f4',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeImagePlaceholder: {
    fontSize: 40,
  },
  placeInfo: {
    padding: 15,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  placeVicinity: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#f39c12',
  },
  totalRatingsText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7f8c8d',
  },
  priceContainer: {
    marginTop: 2,
  },
  priceText: {
    fontSize: 12,
    color: '#27ae60',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorText: {
    marginTop: 20,
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 30,
  },
  retryButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 15,
    fontSize: 16,
    color: '#7f8c8d',
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  distanceText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#7f8c8d',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  phoneText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#27ae60',
  },
});
