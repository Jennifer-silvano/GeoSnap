import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, ScrollView, StatusBar, Platform} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import Database from '../database/Database';
import LocationService from '../services/LocationService';

const CameraScreen = ({ user, navigation }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = MediaLibrary.usePermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [facing, setFacing] = useState('back'); // Novo estado para controlar câmera frontal/traseira
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  // Resetar estados quando a tela recebe foco
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Resetar estados ao voltar para a tela
      setCapturedPhoto(null);
      setComment('');
      setLocation(null);
      setIsCameraReady(false);
      setFacing('back'); // Resetar para câmera traseira
      
      // Pequeno delay para garantir que a câmera seja reinicializada
      setTimeout(() => {
        setIsCameraReady(true);
      }, 100);
    });

    return unsubscribe;
  }, [navigation]);

  const requestPermissions = async () => {
    try {
      if (!permission?.granted) {
        const cameraResult = await requestPermission();
        if (!cameraResult.granted) {
          Alert.alert('Erro', 'Permissão da câmera é necessária para usar este recurso');
          return;
        }
      }
      
      if (!mediaPermission?.granted) {
        const mediaResult = await requestMediaPermission();
        if (!mediaResult.granted) {
          Alert.alert('Erro', 'Permissão de galeria é necessária para salvar fotos');
          return;
        }
      }
      
      setIsCameraReady(true);
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      Alert.alert('Erro', 'Erro ao solicitar permissões necessárias');
    }
  };

  // Função para alternar entre câmeras
  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Função getLocation movida para fora e corrigida
  const getLocation = async () => {
    try {
      // Usar o método correto do LocationService
      const result = await LocationService.getCurrentLocation();
      
      if (result.success && result.location) {
        const locationData = result.location;
        
        // Tentar obter o endereço das coordenadas
        const addressResult = await LocationService.reverseGeocode(
          locationData.latitude, 
          locationData.longitude
        );
        
        let finalLocation = {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          accuracy: locationData.accuracy,
          timestamp: locationData.timestamp
        };
        
        if (addressResult.success && addressResult.address) {
          finalLocation.name = addressResult.address.formattedAddress;
          setLocation(finalLocation);
          Alert.alert('✅ Localização', `📍 ${addressResult.address.formattedAddress}`);
        } else {
          // Se não conseguir o endereço, usar coordenadas
          finalLocation.name = `${locationData.latitude.toFixed(4)}, ${locationData.longitude.toFixed(4)}`;
          setLocation(finalLocation);
          Alert.alert('⚠️ Localização', 
            `📍 Coordenadas obtidas\nLat: ${locationData.latitude.toFixed(4)}, Lng: ${locationData.longitude.toFixed(4)}`
          );
        }
      } else {
        // Tratar erros específicos do LocationService
        if (result.needsLocationServices) {
          Alert.alert('❌ GPS Desabilitado', 
            'Ative a localização nas configurações do seu dispositivo',
            [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Configurações', onPress: () => LocationService.showLocationServicesAlert() }
            ]
          );
        } else {
          Alert.alert('❌ Erro', result.error || 'Não foi possível obter localização');
        }
      }
    } catch (error) {
      console.error('Erro ao obter localização:', error);
      Alert.alert('❌ Erro', 'Erro inesperado ao obter localização. Tente novamente.');
    }
  };

  const takePicture = async () => {
    if (cameraRef.current && isCameraReady) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedPhoto(photo);
     
        // Tentar obter localização automaticamente após tirar a foto
        getLocation();
      } catch (error) {
        console.error('Erro ao tirar foto:', error);
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      }
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;

    setIsPosting(true);
    try {
      // Salvar na galeria
      const asset = await MediaLibrary.createAssetAsync(capturedPhoto.uri);
      
      // Criar data no horário de Brasília
      const now = new Date();
      const brasiliaOffset = -3 * 60; // UTC-3 em minutos
      const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
      const brasiliaTime = new Date(utcTime + (brasiliaOffset * 60000));
      
      // Salvar no banco
      await Database.savePhoto(
        user.id,
        asset.uri,
        comment || null,
        location?.latitude || null,
        location?.longitude || null,
        location?.name || null,
        brasiliaTime.toISOString() // Passar data no formato ISO
      );

      Alert.alert('Sucesso', 'Foto postada com sucesso!', [
        { text: 'OK', onPress: () => {
          // Resetar estados e navegar
          setCapturedPhoto(null);
          setComment('');
          setLocation(null);
          navigation.navigate('Home');
        }}
      ]);
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      Alert.alert('Erro', 'Não foi possível salvar a foto');
    }
    setIsPosting(false);
  };

  const resetCamera = () => {
    // Resetar estados para voltar à câmera
    setCapturedPhoto(null);
    setComment('');
    setLocation(null);
    setIsCameraReady(true);
  };

  const onCameraReady = () => {
    setIsCameraReady(true);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Verificando permissões...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#4A90E2" />
          <Text style={styles.permissionTitle}>Acesso à Câmera</Text>
          <Text style={styles.permissionMessage}>
            Precisamos de permissão para usar a câmera e capturar suas aventuras
          </Text>
          <TouchableOpacity style={styles.button} onPress={requestPermissions}>
            <Text style={styles.buttonText}>Conceder Permissão</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (capturedPhoto) {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.previewContainer}>
          <Image source={{ uri: capturedPhoto.uri }} style={styles.preview} />
          
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={resetCamera}>
              <Ionicons name="camera-outline" size={20} color="#4A90E2" />
              <Text style={styles.secondaryButtonText}>Tirar Outra</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} onPress={getLocation}>
              <Ionicons 
                name={location ? "location" : "location-outline"} 
                size={20} 
                color={location ? "#27ae60" : "#4A90E2"} 
              />
              <Text style={[
                styles.secondaryButtonText,
                location && { color: "#27ae60" }
              ]}>
                {location ? 'Local Obtido' : 'Obter Local'}
              </Text>
            </TouchableOpacity>
          </View>

          {location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#27ae60" />
              <Text style={styles.locationText}>
                {location.name || `${location.latitude?.toFixed(4)}, ${location.longitude?.toFixed(4)}`}
              </Text>
            </View>
          )}

          <TextInput
            style={styles.commentInput}
            placeholder="Adicione um comentário sobre sua aventura..."
            placeholderTextColor="#999"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            maxLength={500}
          />

          <TouchableOpacity 
            style={[styles.button, isPosting && styles.buttonDisabled]} 
            onPress={savePhoto}
            disabled={isPosting}
          >
            <Text style={styles.buttonText}>
              {isPosting ? 'Postando...' : 'Postar Aventura'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      {isCameraReady ? (
        <CameraView 
          style={styles.camera} 
          ref={cameraRef}
          facing={facing} // Prop para controlar qual câmera usar
          onCameraReady={onCameraReady}
        >
          <View style={styles.cameraControls}>
            {/* Botão para alternar câmera */}
            <TouchableOpacity 
              style={styles.flipButton} 
              onPress={toggleCameraFacing}
              activeOpacity={0.8}
            >
              <Ionicons 
                name="camera-reverse-outline" 
                size={28} 
                color="white" 
              />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.captureButton} 
              onPress={takePicture}
              activeOpacity={0.8}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </CameraView>
      ) : (
        <View style={styles.loadingContainer}>
          <Ionicons name="camera-outline" size={48} color="#4A90E2" />
          <Text style={styles.loadingText}>Inicializando câmera...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e9e1',
       paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,

  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '##f2e9e1',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 16,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 50,
    position: 'relative',
  },
  flipButton: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  preview: {
    width: '100%',
    height: 400,
    resizeMode: 'cover',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    backgroundColor: 'white',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#335d4b',
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#335d4b',
    marginLeft: 8,
    fontWeight: '600',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#335d4b',
  },
  locationText: {
    marginLeft: 8,
    color: '#27ae60',
    flex: 1,
    fontWeight: '500',
  },
  commentInput: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#335d4b',
    minHeight: 80,
  },
  button: {
    backgroundColor: '#335d4b',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    shadowColor: '#335d4b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#335d4b',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen;