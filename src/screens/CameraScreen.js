import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Image, TextInput, ScrollView } from 'react-native';
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
  const cameraRef = useRef(null);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (!permission?.granted) {
      await requestPermission();
    }
    if (!mediaPermission?.granted) {
      await requestMediaPermission();
    }
  };

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedPhoto(photo);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível tirar a foto');
      }
    }
  };

  const getLocation = async () => {
    try {
      const locationData = await LocationService.getCurrentLocation();
      setLocation(locationData);
      Alert.alert('Sucesso', `Localização obtida: ${locationData.name}`);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter a localização');
    }
  };

  const savePhoto = async () => {
    if (!capturedPhoto) return;

    setIsPosting(true);
    try {
      // Salvar na galeria
      const asset = await MediaLibrary.createAssetAsync(capturedPhoto.uri);
      
      // Salvar no banco
      await Database.savePhoto(
        user.id,
        asset.uri,
        comment || null,
        location?.latitude || null,
        location?.longitude || null,
        location?.name || null
      );

      Alert.alert('Sucesso', 'Foto postada com sucesso!', [
        { text: 'OK', onPress: resetCamera }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar a foto');
    }
    setIsPosting(false);
  };

  const resetCamera = () => {
    setCapturedPhoto(null);
    setComment('');
    setLocation(null);
    navigation.navigate('Home');
  };

  if (!permission) {
    return <View style={styles.container}><Text>Solicitando permissão...</Text></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Precisamos de permissão para usar a câmera</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Conceder Permissão</Text>
        </TouchableOpacity>
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
              <Ionicons name="location-outline" size={20} color="#4A90E2" />
              <Text style={styles.secondaryButtonText}>
                {location ? 'Local Obtido' : 'Obter Local'}
              </Text>
            </TouchableOpacity>
          </View>

          {location && (
            <View style={styles.locationInfo}>
              <Ionicons name="location" size={16} color="#666" />
              <Text style={styles.locationText}>{location.name}</Text>
            </View>
          )}

          <TextInput
            style={styles.commentInput}
            placeholder="Adicione um comentário (opcional)"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity 
            style={[styles.button, isPosting && styles.buttonDisabled]} 
            onPress={savePhoto}
            disabled={isPosting}
          >
            <Text style={styles.buttonText}>
              {isPosting ? 'Postando...' : 'Postar'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: 'white',
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
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
    borderRadius: 8,
    minWidth: 120,
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4A90E2',
    marginLeft: 8,
    fontWeight: '500',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    borderRadius: 8,
    marginBottom: 15,
  },
  locationText: {
    marginLeft: 8,
    color: '#666',
    flex: 1,
  },
  commentInput: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#4A90E2',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CameraScreen;