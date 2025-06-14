import React, { useState, useEffect } from 'react';
import * as Sharing from 'expo-sharing';
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
  Platform,
  RefreshControl,
  Share,
  Image,
  Linking
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import Database from '../database/Database';
import PhotoGrid from '../components/PhotoGrid';
import AlbumGrid from '../components/AlbumGrid';

const { width, height } = Dimensions.get('window');
const Tab = createMaterialTopTabNavigator();

const ImagesTab = ({ photos, navigation, onRefresh, refreshing, onDeletePhoto, onSharePhoto, onShareWhatsApp, user }) => (
  <PhotoGrid 
    photos={photos} 
    onPhotoPress={(photo) => {
      // Navegar para uma tela de detalhes da foto
      console.log('Foto pressionada:', photo);
      navigation.navigate('PhotoDetail', { photo, user });
    }}
    onRefresh={onRefresh}
    refreshing={refreshing}
    onDeletePhoto={onDeletePhoto}
    onSharePhoto={onSharePhoto}
    onShareWhatsApp={onShareWhatsApp}
    showDeleteOption={true}
    showShareOption={true}
    showWhatsAppOption={true}
  />
);

const AlbumsTab = ({ photos, navigation, onRefresh, refreshing }) => {
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
      onRefresh={onRefresh}
      refreshing={refreshing}
    />
  );
};

const FavoritesTab = ({ photos, navigation, onRefresh, refreshing, onDeletePhoto, onSharePhoto, onShareWhatsApp, user }) => {
  // Filtrar apenas fotos marcadas como favoritas
  const favoritePhotos = photos.filter(photo => photo.is_favorite);

  if (favoritePhotos.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="heart-outline" size={64} color="#073022" />
        <Text style={styles.emptyText}>Nenhuma foto favorita ainda</Text>
        <Text style={styles.emptySubText}>Marque suas fotos favoritas para vê-las aqui!</Text>
      </View>
    );
  }

  return (
    <PhotoGrid 
      photos={favoritePhotos} 
      onPhotoPress={(photo) => {
        navigation.navigate('PhotoDetail', { photo, user });
      }}
      onRefresh={onRefresh}
      refreshing={refreshing}
      onDeletePhoto={onDeletePhoto}
      onSharePhoto={onSharePhoto}
      onShareWhatsApp={onShareWhatsApp}
      showDeleteOption={true}
      showShareOption={true}
      showWhatsAppOption={true}
    />
  );
};

const ProfileScreen = ({ user, onLogout, navigation }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [userStats, setUserStats] = useState({ photoCount: 0, locationsCount: 0, favoritesCount: 0 });
  const [profileImage, setProfileImage] = useState(null);

  // Carregar foto de perfil ao inicializar
  useEffect(() => {
    loadProfileImage();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadUserPhotos();
      loadUserStats();
      loadProfileImage();
    }, [])
  );

  const loadProfileImage = async () => {
    try {
      const savedProfileImage = await Database.getUserProfileImage(user.id);
      if (savedProfileImage) {
        setProfileImage(savedProfileImage);
      }
    } catch (error) {
      console.error('Erro ao carregar foto de perfil:', error);
    }
  };

  const loadUserPhotos = async () => {
    try {
      const userPhotos = await Database.getUserPhotos(user.id);
      setPhotos(userPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar suas fotos');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const stats = await Database.getUserStats(user.id);
      // Calcular favoritos
      const userPhotos = await Database.getUserPhotos(user.id);
      const favoritesCount = userPhotos.filter(photo => photo.is_favorite).length;
      
      setUserStats({
        ...stats,
        favoritesCount
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadUserPhotos();
    loadUserStats();
  };

  const handleDeletePhoto = async (photoId) => {
    Alert.alert(
      'Excluir Foto',
      'Tem certeza que deseja excluir esta foto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Excluir', 
          style: 'destructive',
          onPress: async () => {
            try {
              const success = await Database.deletePhoto(photoId);
              if (success) {
                Alert.alert('Sucesso', 'Foto removida com sucesso!');
                // Recarregar fotos após deletar
                loadUserPhotos();
                loadUserStats();
              } else {
                Alert.alert('Erro', 'Não foi possível remover a foto');
              }
            } catch (error) {
              console.error('Erro ao deletar foto:', error);
              Alert.alert('Erro', 'Erro inesperado ao remover foto');
            }
          }
        }
      ]
    );
  };

 const handleSharePhoto = async (photo) => {
  try {
    // Verificar se a foto ainda existe
    const fileInfo = await FileSystem.getInfoAsync(photo.uri);
    if (!fileInfo.exists) {
      Alert.alert('Erro', 'A foto não foi encontrada');
      return;
    }

    // Preparar mensagem personalizada
    const message = `Olha essa foto incrível que tirei${photo.location_name ? ` no ${photo.location_name}` : ''}! 📸 Tirada com o GeoSnap!`;
    
    // Verificar se o dispositivo suporta compartilhamento
    const isAvailable = await Sharing.isAvailableAsync();
    
    if (isAvailable) {
      // Usar Expo Sharing para compartilhar a imagem diretamente
      await Sharing.shareAsync(photo.uri, {
        mimeType: 'image/jpeg',
        dialogTitle: 'Compartilhar foto do GeoSnap',
        UTI: 'public.jpeg'
      });
    } else {
      // Fallback para Share nativo (apenas texto em alguns casos)
      const shareOptions = {
        title: 'Compartilhar foto do GeoSnap',
        message: message,
      };
      
      await Share.share(shareOptions);
      
      // Informar ao usuário que só o texto foi compartilhado
      Alert.alert(
        'Compartilhamento', 
        'O texto foi compartilhado. Para enviar a foto, você pode salvá-la na galeria e anexar manualmente.',
        [
          {
            text: 'OK'
          },
          {
            text: 'Salvar na Galeria',
            onPress: () => saveToGallery(photo)
          }
        ]
      );
    }
  } catch (error) {
    console.error('Erro ao compartilhar foto:', error);
    Alert.alert('Erro', 'Não foi possível compartilhar a foto');
  }
};


// Adicione esta função auxiliar para salvar na galeria
const saveToGallery = async (photo) => {
  try {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para salvar a foto na galeria');
      return;
    }

    await MediaLibrary.createAssetAsync(photo.uri);
    Alert.alert('Sucesso', 'Foto salva na galeria!');
  } catch (error) {
    console.error('Erro ao salvar na galeria:', error);
    Alert.alert('Erro', 'Não foi possível salvar a foto na galeria');
  }
};

  const handlePickProfileImage = async () => {
    try {
      // Solicitar permissão para acessar a galeria
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
        return;
      }

      // Abrir seletor de imagem (removido allowsEditing e aspect)
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const newProfileImage = result.assets[0].uri;
        setProfileImage(newProfileImage);
        
        // Salvar a nova foto de perfil no banco de dados
        try {
          const success = await Database.updateUserProfileImage(user.id, newProfileImage);
          if (success) {
            Alert.alert('Sucesso', 'Foto de perfil atualizada!');
            // Atualizar o objeto user para persistir durante a sessão
            user.profileImage = newProfileImage;
          } else {
            Alert.alert('Erro', 'Não foi possível salvar a foto de perfil');
            setProfileImage(null); // Reverter em caso de erro
          }
        } catch (error) {
          console.error('Erro ao salvar foto de perfil:', error);
          Alert.alert('Erro', 'Não foi possível salvar a foto de perfil');
          setProfileImage(null); // Reverter em caso de erro
        }
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      Alert.alert('Erro', 'Não foi possível selecionar a foto');
    }
  };

  const handleEditProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Erro', 'O nome não pode estar vazio');
      return;
    }

    try {
      const success = await Database.updateUser(user.id, editName.trim());
      if (success) {
        // Atualizar o objeto user
        user.name = editName.trim();
        Alert.alert('Sucesso', 'Perfil atualizado!');
        setShowEditProfile(false);
      } else {
        Alert.alert('Erro', 'Não foi possível atualizar o perfil');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      Alert.alert('Erro', 'Erro inesperado ao atualizar perfil');
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
      <StatusBar barStyle="dark-content" backgroundColor="#f2e9e1" />
      
      {/* Header do Perfil */}
      <View style={styles.header}>
        <View style={styles.profileInfo}>
          <TouchableOpacity style={styles.avatar} onPress={handlePickProfileImage} activeOpacity={0.7}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.name.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={styles.statsContainer}>
              <Text style={styles.statItem}>
                {userStats.photoCount} {userStats.photoCount === 1 ? 'foto' : 'fotos'}
              </Text>
              {userStats.locationsCount > 0 && (
                <>
                  <Text style={styles.statSeparator}>•</Text>
                  <Text style={styles.statItem}>
                    {userStats.locationsCount} {userStats.locationsCount === 1 ? 'local' : 'locais'}
                  </Text>
                </>
              )}
              {userStats.favoritesCount > 0 && (
                <>
                  <Text style={styles.statSeparator}>•</Text>
                  <Text style={styles.statItem}>
                    {userStats.favoritesCount} {userStats.favoritesCount === 1 ? 'favorita' : 'favoritas'}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>
        
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => setShowSettings(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color="#073022" />
        </TouchableOpacity>
      </View>

      {/* Abas de Conteúdo */}
      {loading ? (
        <View style={styles.centered}>
          <Ionicons name="images-outline" size={48} color="#073022" />
          <Text style={styles.loadingText}>Carregando suas aventuras...</Text>
        </View>
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { 
              fontSize: 12, 
              fontWeight: '600',
              textTransform: 'none'
            },
            tabBarStyle: { 
              backgroundColor: '#f2e9e1',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#073022'
            },
            tabBarActiveTintColor: '#073022',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: { 
              backgroundColor: '#073022',
              height: 3,
              borderRadius: 1.5
            },
            tabBarScrollEnabled: true,
          }}
        >
          <Tab.Screen name="Images" options={{ title: 'Fotos' }}>
            {() => (
              <ImagesTab 
                photos={photos} 
                navigation={navigation} 
                onRefresh={handleRefresh}
                refreshing={refreshing}
                onDeletePhoto={handleDeletePhoto}
                onSharePhoto={handleSharePhoto}
              
                user={user}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Albums" options={{ title: 'Álbuns' }}>
            {() => (
              <AlbumsTab 
                photos={photos} 
                navigation={navigation}
                onRefresh={handleRefresh}
                refreshing={refreshing}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="Favorites" options={{ title: 'Favoritos' }}>
            {() => (
              <FavoritesTab 
                photos={photos} 
                navigation={navigation}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                onDeletePhoto={handleDeletePhoto}
                onSharePhoto={handleSharePhoto}
                
                user={user}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      )}

      {/* Modal de Configurações */}
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
                setTimeout(() => setShowEditProfile(true), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="person-outline" size={22} color="#073022" />
              <Text style={styles.modalOptionText}>Editar perfil</Text>
              <Ionicons name="chevron-forward" size={18} color="#073022" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.logoutOption]}
              onPress={() => {
                setShowSettings(false);
                setTimeout(() => handleLogout(), 200);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={22} color="#e74c3c" />
              <Text style={[styles.modalOptionText, styles.logoutText]}>Sair da conta</Text>
              <Ionicons name="chevron-forward" size={18} color="#e74c3c" />
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
              maxLength={50}
            />
            
            <Text style={styles.photoLabel}>Foto de Perfil</Text>
            <TouchableOpacity 
              style={styles.photoButton}
              onPress={handlePickProfileImage}
              activeOpacity={0.7}
            >
              <Ionicons name="camera-outline" size={20} color="#f2e9e1" />
              <Text style={styles.photoButtonText}>Alterar Foto</Text>
            </TouchableOpacity>
            
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => {
                  setEditName(user.name);
                  setShowEditProfile(false);
                }}
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
    backgroundColor: '#f2e9e1',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f2e9e1',
    borderBottomWidth: 1,
    borderBottomColor: '#073022',
    ...Platform.select({
      ios: {
        shadowColor: '#073022',
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
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#073022',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#073022',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarText: {
    color: '#f2e9e1',
    fontSize: 22,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#073022',
    marginBottom: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statItem: {
    fontSize: 13,
    color: '#073022',
    fontWeight: '500',
  },
  statSeparator: {
    fontSize: 13,
    color: '#073022',
    marginHorizontal: 6,
  },
  settingsButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#f2e9e1',
    borderWidth: 1,
    borderColor: '#073022',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 19,
  },
  loadingText: {
    fontSize: 16,
    color: '#073022',
    marginTop: 12,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#073022',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#f2e9e1',
    borderRadius: 16,
    padding: 24,
    minWidth: Math.min(width - 40, 300),
    maxWidth: Math.min(width - 40, 350),
    borderWidth: 2,
    borderColor: '#073022',
    ...Platform.select({
      ios: {
        shadowColor: '#073022',
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
    color: '#073022',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#073022',
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 17,
    color: '#073022',
    fontWeight: '500',
    flex: 1,
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
    backgroundColor: '#073022',
    borderRadius: 10,
  },
  cancelButtonText: {
    color: '#f2e9e1',
    fontSize: 16,
    fontWeight: '500',
  },
  editModalContent: {
    backgroundColor: '#f2e9e1',
    borderRadius: 16,
    padding: 28,
    minWidth: Math.min(width - 40, 320),
    maxWidth: Math.min(width - 40, 380),
    borderWidth: 2,
    borderColor: '#073022',
    ...Platform.select({
      ios: {
        shadowColor: '#073022',
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
    color: '#073022',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#073022',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: '#f2e9e1',
    color: '#073022',
  },
  photoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#073022',
    marginBottom: 8,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#073022',
    borderRadius: 10,
    padding: 14,
    marginBottom: 24,
    backgroundColor: '#073022',
  },
  photoButtonText: {
    color: '#f2e9e1',
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
    borderColor: '#073022',
    borderRadius: 10,
    backgroundColor: '#f2e9e1',
  },
  cancelEditButtonText: {
    color: '#073022',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#073022',
    borderRadius: 10,
    marginLeft: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#073022',
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
    color: '#f2e9e1',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;