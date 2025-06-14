import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Text, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Database from '../database/Database';
import PhotoCard from '../components/PhotoCard';

const HomeScreen = ({ user }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [userProfileImages, setUserProfileImages] = useState({}); // Cache de fotos de perfil

  const loadPhotos = async () => {
    try {
      const allPhotos = await Database.getAllPhotos();
      setPhotos(allPhotos);
      
      // Carregar fotos de perfil dos usuários APÓS carregar as fotos
      await loadUserProfileImages(allPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadUserProfileImages = async (photos) => {
    try {
      // Obter IDs únicos de usuários das fotos
      const userIds = [...new Set(photos.map(photo => photo.user_id))];
      const profileImagesMap = {};

      // Carregar foto de perfil para cada usuário
      for (const userId of userIds) {
        try {
          const profileImage = await Database.getUserProfileImage(userId);
          // Só adiciona ao cache se realmente existe uma imagem
          if (profileImage && profileImage.trim()) {
            profileImagesMap[userId] = profileImage;
          }
        } catch (error) {
          console.error(`Erro ao carregar foto de perfil do usuário ${userId}:`, error);
        }
      }

      setUserProfileImages(profileImagesMap);
    } catch (error) {
      console.error('Erro ao carregar fotos de perfil:', error);
    }
  };

  const loadFavorites = async () => {
    if (user?.id) {
      try {
        const userFavorites = await Database.getUserFavorites(user.id);
        setFavorites(userFavorites.map(fav => fav.photo_id));
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      }
    }
  };

  // Recarrega dados quando a tela ganha foco OU quando o usuário muda
  useFocusEffect(
    useCallback(() => {
      loadPhotos();
      loadFavorites();
    }, [user?.id]) // Dependência do user.id para recarregar quando trocar usuário
  );

  // Effect adicional para garantir que recarregue quando o usuário mudar
  useEffect(() => {
    if (user?.id) {
      loadPhotos();
      loadFavorites();
    }
  }, [user?.id]);

  // Effect para recarregar quando o usuário atual atualizar a foto de perfil
  useEffect(() => {
    // Se o usuário atual atualizou a foto de perfil, recarregar o cache
    if (user?.id && user?.profileImage) {
      setUserProfileImages(prev => ({
        ...prev,
        [user.id]: user.profileImage
      }));
    }
  }, [user?.profileImage]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
    loadFavorites();
  };

  const toggleFavorite = async (photoId) => {
    if (!user?.id) return;

    try {
      const isFavorite = favorites.includes(photoId);
      
      if (isFavorite) {
        await Database.removeFavorite(user.id, photoId);
        setFavorites(prev => prev.filter(id => id !== photoId));
      } else {
        await Database.addFavorite(user.id, photoId);
        setFavorites(prev => [...prev, photoId]);
      }
    } catch (error) {
      console.error('Erro ao alterar favorito:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderPhoto = ({ item }) => {
    // CORREÇÃO: Priorizar o cache de fotos de perfil mais recente
    // Se não tiver no cache, usar a do banco, se não tiver nenhuma, usar null
    let currentUserProfileImage = null;
    
    // 1. Primeiro verifica o cache (mais atualizado)
    if (userProfileImages[item.user_id]) {
      currentUserProfileImage = userProfileImages[item.user_id];
    }
    // 2. Se não tiver no cache, usa a do banco (pode estar desatualizada)
    else if (item.user_profile_image && item.user_profile_image.trim()) {
      currentUserProfileImage = item.user_profile_image;
    }
    // 3. Se for o usuário atual e ele tem profileImage, usar essa
    else if (user?.id === item.user_id && user?.profileImage) {
      currentUserProfileImage = user.profileImage;
    }
    
    return (
      <PhotoCard
        photo={item}
        userName={item.user_name}
        userProfileImage={currentUserProfileImage} // Usar foto de perfil corrigida
        comment={item.comment}
        location={item.location_name}
        date={formatDate(item.taken_at)}
        isFavorite={favorites.includes(item.id)}
        onToggleFavorite={() => toggleFavorite(item.id)}
        showFavorite={!!user?.id} // Só mostra coração se tiver usuário logado
        favoriteIcon="heart" // Mudança de estrela para coração
      />
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Carregando fotos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {photos.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Nenhuma foto ainda!</Text>
          <Text style={styles.emptySubtext}>Seja o primeiro a postar uma foto</Text>
        </View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#073022" // Cor do indicador de refresh
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2e9e1',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  listContainer: {
    paddingVertical: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#073022',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#073022',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#073022',
    opacity: 0.7,
  },
});

export default HomeScreen;