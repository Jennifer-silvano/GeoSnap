import { useNavigation } from '@react-navigation/native';
import { Camera } from 'expo-camera';
import * as Location from 'expo-location';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const db = SQLite.openDatabase('geosnap.db');

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraRef, setCameraRef] = useState(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [comment, setComment] = useState('');
  const [location, setLocation] = useState('');
  const navigation = useNavigation();

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      setPhotoUri(photo.uri);
    }
  };

  const getLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão negada', 'Habilite o acesso à localização.');
      return;
    }

    const loc = await Location.getCurrentPositionAsync({});
    const address = await Location.reverseGeocodeAsync(loc.coords);
    const { city, region } = address[0];
    setLocation(`${city}, ${region}`);
  };

  const savePhoto = () => {
    if (!photoUri || !location) {
      Alert.alert('Erro', 'Foto e localização são obrigatórias.');
      return;
    }

    const date = new Date().toLocaleDateString();
    db.transaction(tx => {
      tx.executeSql(
        'INSERT INTO photos (uri, comment, location, date) VALUES (?, ?, ?, ?)',
        [photoUri, comment, location, date],
        () => {
          Alert.alert('Sucesso', 'Foto postada!');
          navigation.navigate('Profile');
        },
        (t, error) => console.log(error)
      );
    });
  };

  if (hasPermission === null) return <View />;
  if (hasPermission === false) return <Text>Sem acesso à câmera</Text>;

  return (
    <View style={styles.container}>
      {photoUri ? (
        <>
          <Image source={{ uri: photoUri }} style={styles.preview} />
          <TextInput
            placeholder="Comentário (opcional)"
            style={styles.input}
            value={comment}
            onChangeText={setComment}
          />
          <TouchableOpacity style={styles.button} onPress={getLocation}>
            <Text style={styles.buttonText}>Obter Localização</Text>
          </TouchableOpacity>
          <Text style={{ marginBottom: 8 }}>{location}</Text>

          <TouchableOpacity style={styles.button} onPress={savePhoto}>
            <Text style={styles.buttonText}>Postar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, { backgroundColor: '#aaa' }]} onPress={() => setPhotoUri(null)}>
            <Text style={styles.buttonText}>Tirar outra</Text>
          </TouchableOpacity>
        </>
      ) : (
        <Camera style={styles.camera} ref={(ref) => setCameraRef(ref)}>
          <View style={styles.cameraButtonContainer}>
            <TouchableOpacity style={styles.cameraButton} onPress={takePhoto} />
          </View>
        </Camera>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 12 },
  camera: { flex: 1, width: '100%' },
  cameraButtonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 20
  },
  cameraButton: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'white' },
  preview: { width: '100%', height: 400, borderRadius: 10, marginBottom: 16 },
  input: { width: '100%', padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 8 },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 8
  },
  buttonText: { color: 'white', fontWeight: 'bold' }
});
