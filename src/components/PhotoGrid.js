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
const ITEM_SIZE = (width - 40) / 3; // 3 colunas com margem

const PhotoGrid = ({ photos = [], onPhotoPress, onRefresh, refreshing = false }) => {
  const [loading, setLoading] = useState(false);

  const handlePhotoPress = (photo) => {
    if (onPhotoPress) {
      onPhotoPress(photo);
    }
  };

  const renderPhotoItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.photoContainer}
      onPress={() => handlePhotoPress(item)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: item.uri }}
        style={styles.photoImage}
        resizeMode="cover"
      />
      
      {/* Overlay com informações - apenas localização e comentário */}
      {(item.location_name || item.comment) && (
        <View style={styles.photoOverlay}>
          {item.location_name && (
            <View style={styles.photoInfo}>
              <Icon name="place" size={12} color="#fff" />
              <Text style={styles.locationText} numberOfLines={1}>
                {item.location_name}
              </Text>
            </View>
          )}
          
          {item.comment && (
            <View style={styles.commentInfo}>
              <Icon name="chat-bubble-outline" size={12} color="#fff" />
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="photo-camera" size={64} color="#ccc" />
      <Text style={styles.emptyTitle}>Nenhuma foto ainda</Text>
      <Text style={styles.emptySubtitle}>
        Suas fotos capturadas aparecerão aqui
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
        data={photos}
        renderItem={renderPhotoItem}
        keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
        numColumns={3}
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
    padding: 10,
  },
  photoContainer: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  photoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    color: '#fff',
    fontSize: 10,
    marginLeft: 4,
    fontWeight: '500',
  },
  commentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PhotoGrid;