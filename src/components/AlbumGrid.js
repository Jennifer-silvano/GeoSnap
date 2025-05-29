import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Image,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Text,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');
const ITEM_WIDTH = (width - 60) / 2; // 2 colunas com margem

const AlbumGrid = ({ albums = [], onAlbumPress, onRefresh, refreshing = false }) => {
  const [loading, setLoading] = useState(false);

  const handleAlbumPress = (album) => {
    if (onAlbumPress) {
      // Passar o álbum com todas as informações necessárias
      onAlbumPress(album);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const renderAlbumItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.albumContainer}
      onPress={() => handleAlbumPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.albumImageContainer}>
        <Image
          source={{ uri: item.coverImage || item.photos[0]?.uri }}
          style={styles.albumImage}
          resizeMode="cover"
        />
        
        {/* Badge com número de fotos */}
        <View style={styles.photoBadge}>
          <Icon name="photo" size={12} color="#fff" />
          <Text style={styles.photoCount}>{item.photoCount}</Text>
        </View>
      </View>
      
      <View style={styles.albumInfo}>
        <Text style={styles.albumTitle} numberOfLines={2}>
          {item.title}
        </Text>
        
        <View style={styles.albumMeta}>
          <Icon name="place" size={14} color="#666" />
          <Text style={styles.locationText} numberOfLines={1}>
            {item.location}
          </Text>
        </View>
        
        <Text style={styles.dateText}>
          {formatDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="photo-album" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhum álbum criado</Text>
      <Text style={styles.emptySubtitle}>
        Suas fotos serão organizadas automaticamente por localização
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A90E2" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={albums}
        renderItem={renderAlbumItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#4A90E2']}
          />
        }
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  gridContainer: {
    padding: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  albumContainer: {
    width: ITEM_WIDTH,
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: '#fff',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  albumImageContainer: {
    position: 'relative',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  photoBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  photoCount: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  albumInfo: {
    padding: 12,
  },
  albumTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    lineHeight: 20,
  },
  albumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AlbumGrid;