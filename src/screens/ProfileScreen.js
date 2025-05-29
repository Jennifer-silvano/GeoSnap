import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  Modal, 
  TextInput,
  SafeAreaView,
  Dimensions,
  StatusBar,
  Platform
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import Database from '../database/Database';
import PhotoGrid from '../components/PhotoGrid';
import AlbumGrid from '../components/AlbumGrid';

const { width, height } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

const ImagesTab = ({ photos, navigation }) => (
  <PhotoGrid 
    photos={photos} 
    onPhotoPress={(photo) => {
      // Aqui você pode navegar para uma tela de detalhes da foto
      console.log('Foto pressionada:', photo);
    }}
    onRefresh={() => console.log('Atualizando fotos...')}
  />
);

const AlbumsTab = ({ photos, navigation }) => {
  // Agrupa fotos por localização para criar álbuns
  const albumsArray = Object.entries(
    photos.reduce((acc, photo) => {
      const location = photo.location_name || 'Sem localização';
      if (!acc[location]) {
        acc[location] = {
          id: location,
          title: location,
          photos: [],
          photoCount: 0,
          coverImage: null,
          location: location,
          createdAt: photo.created_at || new Date().toISOString()
        };
      }
      acc[location].photos.push(photo);
      acc[location].photoCount = acc[location].photos.length;
      if (!acc[location].coverImage && photo.uri) {
        acc[location].coverImage = photo.uri;
      }
      return acc;
    }, {})
  ).map(([key, album]) => album);

  return (
    <AlbumGrid 
      albums={albumsArray} 
      onAlbumPress={(album) => {
        // Navegar para tela do álbum com as fotos
        navigation.navigate('AlbumDetail', { 
          album: album,
          photos: album.photos 
        });
      }}
      onRefresh={() => console.log('Atualizando álbuns...')}
    />
  );
};

const ProfileScreen = ({ user, onLogout, navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);

  useEffect(() => {
    loadUserPhotos();
  }, []);

  const loadUserPhotos = async () => {
    try {
      const userPhotos = await Database.getUserPhotos(user.id);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos do usuário:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    try {
      // Aqui você implementaria a atualização no banco
      // await Database.updateUser(user.id, editName);
      Alert.alert('Sucesso', 'Perfil atualizado!');
      setShowEditProfile(false);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível atualizar o perfil');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sair da conta',
      'Tem certeza que deseja sair?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', onPress: onLogout, style: 'destructive' }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header do Perfil */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.photoCount}>
              {photos.length} {photos.length === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={26} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Abas de Conteúdo */}
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Carregando suas aventuras...</Text>
        </View>
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { 
              fontSize: 14, 
              fontWeight: 'bold',
              textTransform: 'none'
            },
            tabBarStyle: { 
              backgroundColor: 'white',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#eee'
            },
            tabBarActiveTintColor: '#4A90E2',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: { 
              backgroundColor: '#4A90E2',
              height: 3
            },
          }}
        >
          <Tab.Screen name="Images" options={{ title: 'Fotos' }}>
            {() => <ImagesTab photos={photos} navigation={navigation} />}
          </Tab.Screen>
          <Tab.Screen name="Albums" options={{ title: 'Álbuns' }}>
            {() => <AlbumsTab photos={photos} navigation={navigation} />}
          </Tab.Screen>
        </Tab.Navigator>
      )}

      {/* Modal de Configurações - Simplificado */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configurações</Text>
            
            <TouchableOpacity 
              style={styles.modalOption}
              onPress={() => {
                setShowSettings(false);
                setShowEditProfile(true);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={22} color="#666" />
              <Text style={styles.modalOptionText}>Editar perfil</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.logoutOption]}
              onPress={() => {
                setShowSettings(false);
                handleLogout();
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={[styles.modalOptionText, styles.logoutText]}>Sair da conta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowSettings(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal de Edição de Perfil */}
      <Modal
        visible={showEditProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditProfile(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <Text style={styles.modalTitle}>Editar Perfil</Text>
            
            <Text style={styles.label}>Nome</Text>
            <TextInput
              style={styles.input}
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.photoLabel}>Foto do perfil</Text>
            <TouchableOpacity style={styles.photoButton}>
              <Ionicons name="camera-outline" size={24} color="#4A90E2" />
              <Text style={styles.photoButtonText}>Alterar foto</Text>
            </TouchableOpacity>
            
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => setShowEditProfile(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelEditButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditProfile}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  photoCount: {
    fontSize: 15,
    color: '#666',
  },
  settingsButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginLeft: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    minWidth: Math.min(width - 40, 300),
    maxWidth: Math.min(width - 40, 350),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 17,
    color: '#333',
    fontWeight: '500',
  },
  logoutOption: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutText: {
    color: '#e74c3c',
  },
  cancelButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 28,
    minWidth: Math.min(width - 40, 320),
    maxWidth: Math.min(width - 40, 380),
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#fafafa',
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#4A90E2',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    backgroundColor: '#f8f9ff',
  },
  photoButtonText: {
    color: '#4A90E2',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 8,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    backgroundColor: '#f8f9fa',
  },
  cancelEditButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 10,
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#4A90E2',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;