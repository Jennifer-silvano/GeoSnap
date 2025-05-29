import * as Location from 'expo-location';
import { Alert, Platform } from 'react-native';

class LocationService {
  constructor() {
    this.watchSubscription = null;
    this.currentLocation = null;
  }

  // Solicitar permissões de localização
  async requestLocationPermissions() {
    try {
      // Primeiro verificar se os serviços de localização estão habilitados
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Serviços de localização desabilitados',
          needsLocationServices: true
        };
      }

      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      
      if (foregroundStatus !== 'granted') {
        return {
          success: false,
          error: 'Permissão de localização em primeiro plano negada'
        };
      }

      // Para apps que precisam de localização em background (opcional)
      let backgroundStatus = 'denied';
      try {
        const backgroundResult = await Location.requestBackgroundPermissionsAsync();
        backgroundStatus = backgroundResult.status;
      } catch (error) {
        console.log('Background permission not requested:', error.message);
      }
      
      return {
        success: true,
        foregroundPermission: foregroundStatus === 'granted',
        backgroundPermission: backgroundStatus === 'granted'
      };
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return {
        success: false,
        error: 'Erro ao solicitar permissões de localização'
      };
    }
  }

  // Verificar se as permissões estão concedidas
  async hasLocationPermissions() {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return false;
      }

      const { status } = await Location.getForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }

  // Obter localização atual com alta precisão
  async getCurrentLocation() {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Serviços de localização desabilitados. Ative a localização nas configurações do dispositivo.',
          needsLocationServices: true
        };
      }

      const hasPermission = await this.hasLocationPermissions();
      
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.success) {
          return {
            success: false,
            error: permissionResult.error,
            needsLocationServices: permissionResult.needsLocationServices
          };
        }
      }

      // Tentar obter localização com diferentes configurações de precisão
      let location;
      try {
        // Primeira tentativa - alta precisão
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 10000,
          maximumAge: 5000,
        });
      } catch (highAccuracyError) {
        console.log('High accuracy failed, trying balanced:', highAccuracyError.message);
        try {
          // Segunda tentativa - precisão balanceada
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 8000,
            maximumAge: 10000,
          });
        } catch (balancedError) {
          console.log('Balanced accuracy failed, trying low:', balancedError.message);
          // Terceira tentativa - baixa precisão
          location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Low,
            timeout: 5000,
            maximumAge: 15000,
          });
        }
      }

      this.currentLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        altitude: location.coords.altitude,
        accuracy: location.coords.accuracy,
        timestamp: location.timestamp,
      };

      return {
        success: true,
        location: this.currentLocation
      };
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      
      // Verificar diferentes tipos de erro
      let errorMessage = 'Não foi possível obter a localização atual';
      
      if (error.message.includes('Location request timed out')) {
        errorMessage = 'Timeout ao obter localização. Tente novamente.';
      } else if (error.message.includes('Location services are disabled')) {
        errorMessage = 'Serviços de localização desabilitados';
      } else if (error.message.includes('Location unavailable')) {
        errorMessage = 'Localização indisponível no momento';
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Obter localização com baixa precisão (mais rápido e confiável)
  async getCurrentLocationFast() {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Serviços de localização desabilitados',
          needsLocationServices: true
        };
      }

      const hasPermission = await this.hasLocationPermissions();
      
      if (!hasPermission) {
        return {
          success: false,
          error: 'Permissão de localização necessária'
        };
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Lowest,
        timeout: 5000,
        maximumAge: 30000,
      });

      return {
        success: true,
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          accuracy: location.coords.accuracy,
          timestamp: location.timestamp,
        }
      };
    } catch (error) {
      console.error('Erro ao obter localização rápida:', error);
      return {
        success: false,
        error: 'Não foi possível obter a localização'
      };
    }
  }

  // Converter coordenadas em endereço
  async reverseGeocode(latitude, longitude) {
    try {
      if (!this.isValidCoordinate(latitude, longitude)) {
        return {
          success: false,
          error: 'Coordenadas inválidas'
        };
      }

      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return {
          success: true,
          address: {
            street: address.street || null,
            city: address.city || address.subregion || address.region,
            region: address.region || address.country,
            country: address.country,
            postalCode: address.postalCode,
            name: address.name,
            formattedAddress: this.formatAddress(address)
          }
        };
      } else {
        return {
          success: false,
          error: 'Endereço não encontrado para estas coordenadas'
        };
      }
    } catch (error) {
      console.error('Erro no geocoding reverso:', error);
      return {
        success: false,
        error: 'Erro ao obter endereço das coordenadas'
      };
    }
  }

  // Converter endereço em coordenadas
  async geocode(address) {
    try {
      if (!address || address.trim().length === 0) {
        return {
          success: false,
          error: 'Endereço inválido'
        };
      }

      const locations = await Location.geocodeAsync(address.trim());

      if (locations && locations.length > 0) {
        const location = locations[0];
        return {
          success: true,
          location: {
            latitude: location.latitude,
            longitude: location.longitude
          }
        };
      } else {
        return {
          success: false,
          error: 'Localização não encontrada para este endereço'
        };
      }
    } catch (error) {
      console.error('Erro no geocoding:', error);
      return {
        success: false,
        error: 'Erro ao obter coordenadas do endereço'
      };
    }
  }

  // Calcular distância entre duas coordenadas (em metros)
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!this.isValidCoordinate(lat1, lon1) || !this.isValidCoordinate(lat2, lon2)) {
      return 0;
    }

    const R = 6371000; // Raio da Terra em metros
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return Math.round(distance);
  }

  // Iniciar monitoramento de localização
  async startLocationTracking(callback, options = {}) {
    try {
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      if (!servicesEnabled) {
        return {
          success: false,
          error: 'Serviços de localização desabilitados',
          needsLocationServices: true
        };
      }

      const hasPermission = await this.hasLocationPermissions();
      
      if (!hasPermission) {
        const permissionResult = await this.requestLocationPermissions();
        if (!permissionResult.success) {
          return {
            success: false,
            error: permissionResult.error
          };
        }
      }

      this.watchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.Balanced,
          timeInterval: options.timeInterval || 10000, // 10 segundos
          distanceInterval: options.distanceInterval || 50, // 50 metros
        },
        (location) => {
          this.currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            altitude: location.coords.altitude,
            accuracy: location.coords.accuracy,
            timestamp: location.timestamp,
          };
          
          callback && callback(this.currentLocation);
        }
      );

      return { success: true };
    } catch (error) {
      console.error('Erro ao iniciar tracking:', error);
      return {
        success: false,
        error: 'Erro ao iniciar monitoramento de localização'
      };
    }
  }

  // Parar monitoramento de localização
  stopLocationTracking() {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
      return { success: true };
    }
    return { success: false, error: 'Nenhum monitoramento ativo' };
  }

  // Obter última localização conhecida
  getLastKnownLocation() {
    return this.currentLocation;
  }

  // Verificar se o serviço de localização está habilitado
  async isLocationServiceEnabled() {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      return enabled;
    } catch (error) {
      console.error('Erro ao verificar serviço de localização:', error);
      return false;
    }
  }

  // Mostrar diálogo para habilitar localização
  showLocationServicesAlert() {
    Alert.alert(
      'Localização Desabilitada',
      'Para usar este recurso, é necessário habilitar os serviços de localização nas configurações do dispositivo.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Configurações',
          onPress: () => {
            if (Platform.OS === 'ios') {
              // No iOS, não é possível abrir as configurações diretamente
              Alert.alert(
                'Habilitar Localização',
                'Vá em Configurações > Privacidade > Serviços de Localização e habilite para este app.'
              );
            } else {
              // No Android, você pode tentar abrir as configurações
              try {
                Location.enableNetworkProviderAsync();
              } catch (error) {
                Alert.alert(
                  'Habilitar Localização',
                  'Vá em Configurações > Localização e habilite os serviços de localização.'
                );
              }
            }
          }
        }
      ]
    );
  }

  // Métodos auxiliares
  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  formatAddress(address) {
    const parts = [];
    
    if (address.name && address.name !== address.street) {
      parts.push(address.name);
    }
    if (address.street) parts.push(address.street);
    if (address.city || address.subregion) {
      parts.push(address.city || address.subregion);
    }
    if (address.region && address.region !== (address.city || address.subregion)) {
      parts.push(address.region);
    }
    if (address.country) parts.push(address.country);
    
    return parts.filter(part => part && part.trim().length > 0).join(', ');
  }

  // Formatar distância para exibição
  formatDistance(distance) {
    if (distance < 1000) {
      return `${distance}m`;
    } else {
      return `${(distance / 1000).toFixed(1)}km`;
    }
  }

  // Validar coordenadas
  isValidCoordinate(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !isNaN(latitude) &&
      !isNaN(longitude) &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  // Método para obter localização com fallback
  async getLocationWithFallback() {
    // Tentar localização rápida primeiro
    let result = await this.getCurrentLocationFast();
    
    if (!result.success) {
      // Se falhar, tentar com precisão normal
      result = await this.getCurrentLocation();
    }
    
    return result;
  }
}

export default new LocationService();