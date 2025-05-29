import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator, 
  StyleSheet,
  Dimensions,
  Platform
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const LocationPicker = ({ 
  onLocationSelect, 
  initialLocation = null,
  showCurrentLocationButton = true,
  style = {} 
}) => {
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [addressLoading, setAddressLoading] = useState(false);
  const [locationAddress, setLocationAddress] = useState('');
  const [region, setRegion] = useState({
    latitude: initialLocation?.latitude || -22.505570, // Rio de Janeiro como padrão
    longitude: initialLocation?.longitude || -43.172580,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (initialLocation) {
      setSelectedLocation(initialLocation);
      setRegion({
        ...region,
        latitude: initialLocation.latitude,
        longitude: initialLocation.longitude,
      });
      
      // Buscar endereço da localização inicial
      getAddressFromCoordinates(initialLocation);
    }
  }, [initialLocation]);

  const getAddressFromCoordinates = async (coordinates) => {
    try {
      setAddressLoading(true);
      const addresses = await Location.reverseGeocodeAsync(coordinates);
      
      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        const addressString = formatAddress(address);
        setLocationAddress(addressString);
        
        return {
          ...coordinates,
          address: address,
          addressString: addressString
        };
      }
      
      return coordinates;
    } catch (error) {
      console.error('Erro ao obter endereço:', error);
      setLocationAddress('Endereço não disponível');
      return coordinates;
    } finally {
      setAddressLoading(false);
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'Endereço não disponível';
    
    const parts = [];
    
    if (address.street) parts.push(address.street);
    if (address.streetNumber) parts.push(address.streetNumber);
    if (address.district) parts.push(address.district);
    if (address.city) parts.push(address.city);
    if (address.region) parts.push(address.region);
    
    return parts.length > 0 ? parts.join(', ') : 'Endereço não disponível';
  };

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      // Verificar permissões
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Para usar sua localização atual, é necessário permitir o acesso à localização.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { 
              text: 'Configurações', 
              onPress: () => {
                // Orientar usuário a ir nas configurações
                Alert.alert(
                  'Configurações',
                  'Vá em Configurações > Privacidade > Localização e permita o acesso para este aplicativo.'
                );
              }
            }
          ]
        );
        return;
      }

      // Obter localização atual
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // 15 segundos de timeout
      });

      const newLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      // Atualizar estado
      setCurrentLocation(newLocation);
      setSelectedLocation(newLocation);
      setRegion({
        ...region,
        latitude: newLocation.latitude,
        longitude: newLocation.longitude,
      });

      // Obter endereço da localização
      const locationWithAddress = await getAddressFromCoordinates(newLocation);
      
      // Notificar componente pai
      if (onLocationSelect) {
        onLocationSelect(locationWithAddress);
      }

    } catch (error) {
      console.error('Erro ao obter localização:', error);
      
      let errorMessage = 'Não foi possível obter sua localização atual.';
      
      if (error.code === 'E_LOCATION_TIMEOUT') {
        errorMessage = 'Tempo limite excedido. Verifique se o GPS está ativado.';
      } else if (error.code === 'E_LOCATION_UNAVAILABLE') {
        errorMessage = 'Localização não disponível. Verifique se o GPS está ativado.';
      }
      
      Alert.alert('Erro de Localização', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleMapPress = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);

    // Obter endereço da coordenada selecionada
    const locationWithAddress = await getAddressFromCoordinates(coordinate);
    
    // Notificar componente pai
    if (onLocationSelect) {
      onLocationSelect(locationWithAddress);
    }
  };

  const handleMarkerDragEnd = async (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setSelectedLocation(coordinate);

    // Obter endereço da nova coordenada
    const locationWithAddress = await getAddressFromCoordinates(coordinate);
    
    // Notificar componente pai
    if (onLocationSelect) {
      onLocationSelect(locationWithAddress);
    }
  };

  const centerOnLocation = () => {
    if (selectedLocation) {
      setRegion({
        ...region,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
    }
  };

  const clearSelection = () => {
    setSelectedLocation(null);
    setLocationAddress('');
    if (onLocationSelect) {
      onLocationSelect(null);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsBuildings={true}
        showsTraffic={false}
        showsIndoors={true}
        loadingEnabled={true}
        mapType="standard"
      >
        {selectedLocation && (
          <Marker
            coordinate={selectedLocation}
            title="Localização Selecionada"
            description={locationAddress || 'Localização selecionada'}
            draggable={true}
            onDragEnd={handleMarkerDragEnd}
          >
            <View style={styles.markerContainer}>
              <Ionicons name="location" size={30} color="#E74C3C" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Botões de controle */}
      <View style={styles.controlsContainer}>
        {showCurrentLocationButton && (
          <TouchableOpacity
            style={[styles.controlButton, styles.currentLocationButton]}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="locate" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        )}

        {selectedLocation && (
          <>
            <TouchableOpacity
              style={[styles.controlButton, styles.centerButton]}
              onPress={centerOnLocation}
            >
              <Ionicons name="navigate" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, styles.clearButton]}
              onPress={clearSelection}
            >
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Informações da localização */}
      <View style={styles.infoContainer}>
        {selectedLocation ? (
          <View>
            <Text style={styles.coordinatesText}>
              {`${selectedLocation.latitude.toFixed(6)}, ${selectedLocation.longitude.toFixed(6)}`}
            </Text>
            
            {addressLoading ? (
              <View style={styles.addressLoadingContainer}>
                <ActivityIndicator size="small" color="#666" style={styles.addressLoader} />
                <Text style={styles.addressLoadingText}>Buscando endereço...</Text>
              </View>
            ) : (
              <Text style={styles.addressText}>
                {locationAddress || 'Endereço não disponível'}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.infoText}>
            Toque no mapa para selecionar uma localização
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    flexDirection: 'column',
    gap: 10,
  },
  controlButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  currentLocationButton: {
    backgroundColor: '#4A90E2',
  },
  centerButton: {
    backgroundColor: '#27AE60',
  },
  clearButton: {
    backgroundColor: '#E74C3C',
  },
  markerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  addressLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressLoader: {
    marginRight: 8,
  },
  addressLoadingText: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
  },
  addressText: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    lineHeight: 18,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LocationPicker;