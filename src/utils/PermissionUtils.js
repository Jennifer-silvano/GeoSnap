import { Alert, Platform, Linking } from 'react-native';
import { request, PERMISSIONS, RESULTS, check } from 'react-native-permissions';

class PermissionUtils {
  // Verificar se a permissão de localização está concedida
  static async checkLocationPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Erro ao verificar permissão de localização:', error);
      return false;
    }
  }

  // Solicitar permissão de localização
  static async requestLocationPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.LOCATION_WHEN_IN_USE 
        : PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION;
      
      const result = await request(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          this.showPermissionDeniedAlert('localização');
          return false;
        case RESULTS.BLOCKED:
          this.showPermissionBlockedAlert('localização');
          return false;
        case RESULTS.UNAVAILABLE:
          Alert.alert(
            'Recurso Indisponível',
            'O GPS não está disponível neste dispositivo.'
          );
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de localização:', error);
      return false;
    }
  }

  // Verificar se a permissão de câmera está concedida
  static async checkCameraPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await check(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Erro ao verificar permissão de câmera:', error);
      return false;
    }
  }

  // Solicitar permissão de câmera
  static async requestCameraPermission() {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.CAMERA 
        : PERMISSIONS.ANDROID.CAMERA;
      
      const result = await request(permission);
      
      switch (result) {
        case RESULTS.GRANTED:
          return true;
        case RESULTS.DENIED:
          this.showPermissionDeniedAlert('câmera');
          return false;
        case RESULTS.BLOCKED:
          this.showPermissionBlockedAlert('câmera');
          return false;
        case RESULTS.UNAVAILABLE:
          Alert.alert(
            'Recurso Indisponível',
            'A câmera não está disponível neste dispositivo.'
          );
          return false;
        default:
          return false;
      }
    } catch (error) {
      console.error('Erro ao solicitar permissão de câmera:', error);
      return false;
    }
  }

  // Verificar e solicitar ambas as permissões necessárias
  static async requestAllPermissions() {
    try {
      const locationGranted = await this.requestLocationPermission();
      const cameraGranted = await this.requestCameraPermission();
      
      return {
        location: locationGranted,
        camera: cameraGranted,
        all: locationGranted && cameraGranted
      };
    } catch (error) {
      console.error('Erro ao solicitar todas as permissões:', error);
      return {
        location: false,
        camera: false,
        all: false
      };
    }
  }

  // Verificar se todas as permissões estão concedidas
  static async checkAllPermissions() {
    try {
      const locationGranted = await this.checkLocationPermission();
      const cameraGranted = await this.checkCameraPermission();
      
      return {
        location: locationGranted,
        camera: cameraGranted,
        all: locationGranted && cameraGranted
      };
    } catch (error) {
      console.error('Erro ao verificar todas as permissões:', error);
      return {
        location: false,
        camera: false,
        all: false
      };
    }
  }

  // Exibir alerta quando permissão é negada
  static showPermissionDeniedAlert(permissionType) {
    Alert.alert(
      'Permissão Necessária',
      `O GeoSnap precisa acessar sua ${permissionType} para funcionar corretamente. Deseja tentar novamente?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Tentar Novamente',
          onPress: () => {
            if (permissionType === 'localização') {
              this.requestLocationPermission();
            } else if (permissionType === 'câmera') {
              this.requestCameraPermission();
            }
          }
        }
      ]
    );
  }

  // Exibir alerta quando permissão é bloqueada
  static showPermissionBlockedAlert(permissionType) {
    Alert.alert(
      'Permissão Bloqueada',
      `A permissão de ${permissionType} foi bloqueada. Para usar o GeoSnap, você precisa habilitá-la manualmente nas configurações do dispositivo.`,
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Abrir Configurações',
          onPress: () => Linking.openSettings()
        }
      ]
    );
  }

  // Solicitar permissão específica com retry
  static async requestPermissionWithRetry(permissionType, maxRetries = 2) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      let granted = false;
      
      if (permissionType === 'location') {
        granted = await this.requestLocationPermission();
      } else if (permissionType === 'camera') {
        granted = await this.requestCameraPermission();
      }
      
      if (granted) {
        return true;
      }
      
      attempts++;
      
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return false;
  }

  // Verificar se o app tem todas as permissões necessárias no startup
  static async initializePermissions() {
    try {
      const permissions = await this.checkAllPermissions();
      
      if (!permissions.all) {
        Alert.alert(
          'Permissões Necessárias',
          'O GeoSnap precisa acessar sua localização e câmera para funcionar. Vamos configurar isso agora?',
          [
            {
              text: 'Mais Tarde',
              style: 'cancel'
            },
            {
              text: 'Configurar',
              onPress: async () => {
                await this.requestAllPermissions();
              }
            }
          ]
        );
      }
      
      return permissions;
    } catch (error) {
      console.error('Erro ao inicializar permissões:', error);
      return {
        location: false,
        camera: false,
        all: false
      };
    }
  }
}

export default PermissionUtils;