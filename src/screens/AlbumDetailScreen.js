import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DateUtils } from '../utils/DateUtils';

const { width } = Dimensions.get('window');
const photoWidth = (width - 60) / 3; // 3 colunas com espaçamento

const AlbumDetailScreen = ({ route, navigation }) => {
  const { album, photos = [] } = route.params || {};
  const [albumPhotos, setAlbumPhotos] = useState(photos);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!album) {
      Alert.alert('Erro', 'Álbum não encontrado', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
      return;
    }

    // Configurar o header
    navigation.setOptions({
      title: album.title || 'Álbum',
      headerStyle: {
        backgroundColor: '#fff',
        elevation: 2,
        shadowOpacity: 0.1,
      },
      headerTitleStyle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
      },
      headerTintColor: '#4A90E2',
      headerBackTitleVisible: false,
    });
  }, [album, navigation]);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return DateUtils.formatDate(dateString, 'DD/MM/YYYY');
  };

  const formatLocation = (location) => {
    if (!location) return 'Sem localização';
    
    // Se for uma string simples
    if (typeof location === 'string') {
      return location === 'Sem localização' ? location : location;
    }
    
    // Se for um objeto com endereço estruturado
    if (location && typeof location === 'object') {
      // Verificar se tem propriedades de endereço
      if (location.address) {
        const { street, city, region, country } = location.address;
        const parts = [street, city, region, country].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'Sem localização';
      }
      
      // Verificar se tem coordenadas
      if (location.latitude && location.longitude) {
        return `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`;
      }
      
      // Verificar se tem propriedade name ou title
      if (location.name) return location.name;
      if (location.title) return location.title;
    }
    
    return 'Sem localização';
  };

  const handlePhotoPress = (photo, index) => {
    try {
      // Verificar se existe a tela PhotoDetail
      const state = navigation.getState();
      const hasPhotoDetail = state.routes.some(route => 
        route.name === 'PhotoDetail' || 
        (route.state && route.state.routes && 
         route.state.routes.some(subroute => subroute.name === 'PhotoDetail'))
      );
      
      if (hasPhotoDetail) {
        navigation.navigate('PhotoDetail', { 
          photo: photo, 
          photos: albumPhotos,
          initialIndex: index 
        });
      } else {
        // Fallback: mostrar informações da foto
        const photoInfo = [];
        
        if (photo.comment) {
          photoInfo.push(`Comentário: ${photo.comment}`);
        }
        
        const photoDate = formatDate(photo.created_at || photo.taken_at);
        if (photoDate) {
          photoInfo.push(`Data: ${photoDate}`);
        }
        
        const photoLocation = formatLocation(photo.location || photo.location_name);
        if (photoLocation && photoLocation !== 'Sem localização') {
          photoInfo.push(`Local: ${photoLocation}`);
        }
        
        Alert.alert(
          'Detalhes da Foto',
          photoInfo.length > 0 ? photoInfo.join('\n\n') : 'Sem informações adicionais',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Erro ao navegar para detalhes da foto:', error);
      Alert.alert('Erro', 'Não foi possível abrir os detalhes da foto');
    }
  };

  const renderPhoto = ({ item, index }) => {
    if (!item || !item.uri) {
      return null;
    }

    const hasOverlayInfo = item.comment || item.created_at || item.taken_at || 
                          item.location || item.location_name;

    return (
      <TouchableOpacity
        style={styles.photoContainer}
        onPress={() => handlePhotoPress(item, index)}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: item.uri }} 
          style={styles.photo}
          resizeMode="cover"
          onError={(error) => {
            console.log('Erro ao carregar imagem:', error);
          }}
        />
        
        {/* Overlay com informações */}
        {hasOverlayInfo && (
          <View style={styles.photoOverlay}>
            {item.comment && (
              <View style={styles.commentContainer}>
                <Text style={styles.commentText} numberOfLines={2}>
                  {item.comment}
                </Text>
              </View>
            )}
            
            {(item.created_at || item.taken_at) && (
              <View style={styles.dateContainer}>
                <Ionicons name="calendar-outline" size={12} color="#fff" />
                <Text style={styles.dateText}>
                  {formatDate(item.created_at || item.taken_at)}
                </Text>
              </View>
            )}

            {(item.location || item.location_name) && (
              <View style={styles.locationContainer}>
                <Ionicons name="location-outline" size={12} color="#fff" />
                <Text style={styles.locationText} numberOfLines={1}>
                  {formatLocation(item.location || item.location_name)}
                </Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Informações do álbum */}
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle}>{album?.title || 'Álbum'}</Text>
        
        <View style={styles.albumStats}>
          <View style={styles.statItem}>
            <Ionicons name="images-outline" size={16} color="#666" />
            <Text style={styles.statText}>
              {albumPhotos.length} {albumPhotos.length === 1 ? 'foto' : 'fotos'}
            </Text>
          </View>
          
          {album?.location && (
            <View style={styles.statItem}>
              <Ionicons name="location-outline" size={16} color="#666" />
              <Text style={styles.statText} numberOfLines={1}>
                {formatLocation(album.location)}
              </Text>
            </View>
          )}

          {album?.createdAt && (
            <View style={styles.statItem}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
              <Text style={styles.statText}>
                Criado em {formatDate(album.createdAt)}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Foto de capa */}
      {album?.coverImage && (
        <View style={styles.coverImageContainer}>
          <Image 
            source={{ uri: album.coverImage }} 
            style={styles.coverImage}
            resizeMode="cover"
            onError={(error) => {
              console.log('Erro ao carregar imagem de capa:', error);
            }}
          />
        </View>
      )}
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="images-outline" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhuma foto encontrada</Text>
      <Text style={styles.emptySubtitle}>
        Este álbum não possui fotos no momento
      </Text>
      <TouchableOpacity 
        style={styles.addPhotoButton}
        onPress={() => {
          // Navegar para a aba da câmera
          navigation.navigate('Camera');
        }}
        activeOpacity={0.8}
      >
        <Ionicons name="camera-outline" size={24} color="#4A90E2" />
        <Text style={styles.addPhotoButtonText}>Adicionar Fotos</Text>
      </TouchableOpacity>
    </View>
  );

  if (!album) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          barStyle="dark-content" 
          backgroundColor="#f2e9e1" 
          translucent={false}
        />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#e74c3c" />
          <Text style={styles.errorText}>Álbum não encontrado</Text>
          <TouchableOpacity 
            style={styles.backToHomeButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Text style={styles.backToHomeButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor="#f2e9e1" 
        translucent={false}
      />
      
      <FlatList
        data={albumPhotos}
        renderItem={renderPhoto}
        keyExtractor={(item, index) => {
          // Melhor handling do keyExtractor
          if (item?.id) return item.id.toString();
          if (item?.uri) return item.uri;
          return `photo-${index}`;
        }}
        numColumns={3}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={[
          styles.listContainer,
          albumPhotos.length === 0 && styles.emptyListContainer
        ]}
        columnWrapperStyle={albumPhotos.length > 0 ? styles.row : null}
        showsVerticalScrollIndicator={false}
        refreshing={loading}
        onRefresh={() => {
          setLoading(true);
          // Simular um refresh
          setTimeout(() => setLoading(false), 1000);
        }}
        initialNumToRender={9}
        maxToRenderPerBatch={6}
        windowSize={10}
        removeClippedSubviews={Platform.OS === 'android'}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e9e1',
    ...Platform.select({
      android: {
        paddingTop: StatusBar.currentHeight,
      },
    }),
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  headerContainer: {
    backgroundColor: '#f2e9e1',
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  albumInfo: {
    flex: 1,
    paddingRight: 16,
  },
  albumTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  albumStats: {
    flexDirection: 'column',
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  coverImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  photoContainer: {
    width: photoWidth,
    height: photoWidth,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  commentContainer: {
    marginBottom: 4,
  },
  commentText: {
    color: '#fff',
    fontSize: 11,
    lineHeight: 14,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  dateText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  addPhotoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f8ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#073022',
  },
  addPhotoButtonText: {
    color: '#073022',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginTop: 16,
    marginBottom: 20,
  },
  backToHomeButton: {
    backgroundColor: '#073022',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backToHomeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AlbumDetailScreen;