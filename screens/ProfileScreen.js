import { Ionicons } from '@expo/vector-icons';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Alert, Image, Modal, Pressable, ScrollView, Text, TouchableOpacity, View } from 'react-native';

const db = SQLite.openDatabase('geosnap.db');
const Tab = createMaterialTopTabNavigator();

export default function ProfileScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleTheme = () => setDarkMode(!darkMode);
  const themeStyles = {
    background: darkMode ? '#1e1e1e' : '#fff',
    text: darkMode ? '#fff' : '#000',
    secondaryText: darkMode ? '#ccc' : '#555',
    card: darkMode ? '#2c2c2c' : '#fff',
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeStyles.background }}>
      <View style={{ alignItems: 'center', marginTop: 16 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: themeStyles.text }}>GeoSnap</Text>
        <Text style={{ fontSize: 16, color: themeStyles.secondaryText }}>Minhas fotos</Text>
      </View>

      <View style={{ position: 'absolute', right: 16, top: 16 }}>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="settings-outline" size={24} color={themeStyles.text} />
        </TouchableOpacity>
      </View>

      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ width: 280, backgroundColor: themeStyles.card, borderRadius: 16, padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: themeStyles.text, marginBottom: 16 }}>Configurações</Text>

            <Pressable onPress={() => Alert.alert("Editar Dados", "Funcionalidade em desenvolvimento")}> 
              <Text style={{ color: 'blue', marginBottom: 12 }}>Editar dados</Text>
            </Pressable>

            <Pressable onPress={() => Alert.alert("Sair", "Você foi desconectado.")}> 
              <Text style={{ color: 'red', marginBottom: 12 }}>Sair da conta</Text>
            </Pressable>

            <Pressable onPress={toggleTheme}> 
              <Text style={{ color: themeStyles.secondaryText, marginBottom: 12 }}>
                {darkMode ? 'Modo claro' : 'Modo escuro'}
              </Text>
            </Pressable>

            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={{ textAlign: 'center', color: themeStyles.secondaryText }}>Fechar</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Tab.Navigator>
        <Tab.Screen name="Imagens">
          {() => <ImagesTab darkMode={darkMode} />}
        </Tab.Screen>
        <Tab.Screen name="Álbuns">
          {() => <AlbumsTab darkMode={darkMode} />}
        </Tab.Screen>
      </Tab.Navigator>
    </View>
  );
}

function ImagesTab({ darkMode }) {
  const [images, setImages] = useState([]);

  useEffect(() => {
    const loadImages = () => {
      db.transaction(tx => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS photos (id INTEGER PRIMARY KEY AUTOINCREMENT, uri TEXT, comment TEXT, location TEXT, date TEXT);');
        tx.executeSql('SELECT * FROM photos ORDER BY date DESC', [], (_, { rows }) => {
          setImages(rows._array);
        });
      });
    };
    loadImages();
  }, []);

  const bg = darkMode ? '#1e1e1e' : '#f9f9f9';
  const text = darkMode ? '#fff' : '#000';
  const card = darkMode ? '#2c2c2c' : '#fff';

  return (
    <ScrollView style={{ padding: 8, backgroundColor: bg }}>
      {images.map((img, index) => (
        <View key={index} style={{ marginBottom: 16, borderRadius: 10, backgroundColor: card, padding: 8, elevation: 2 }}>
          <Image source={{ uri: img.uri }} style={{ width: '100%', height: 200, borderRadius: 10 }} />
          <Text style={{ fontWeight: 'bold', marginTop: 4, color: text }}>{img.location}</Text>
          {img.comment ? <Text style={{ color: text }}>{img.comment}</Text> : null}
          <Text style={{ color: 'gray' }}>{img.date}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function AlbumsTab({ darkMode }) {
  const [albums, setAlbums] = useState({});

  useEffect(() => {
    const loadAlbums = () => {
      db.transaction(tx => {
        tx.executeSql('SELECT * FROM photos', [], (_, { rows }) => {
          const grouped = {};
          rows._array.forEach(photo => {
            if (!grouped[photo.location]) grouped[photo.location] = [];
            grouped[photo.location].push(photo);
          });
          setAlbums(grouped);
        });
      });
    };
    loadAlbums();
  }, []);

  const bg = darkMode ? '#1e1e1e' : '#f9f9f9';
  const text = darkMode ? '#fff' : '#000';

  return (
    <ScrollView style={{ padding: 8, backgroundColor: bg }}>
      {Object.entries(albums).map(([location, photos]) => (
        <View key={location} style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: text }}>{location}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {photos.map((img, idx) => (
              <Image
                key={idx}
                source={{ uri: img.uri }}
                style={{ width: 120, height: 120, marginRight: 8, borderRadius: 10 }}
              />
            ))}
          </ScrollView>
        </View>
      ))}
    </ScrollView>
  );
}