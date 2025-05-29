import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, Text } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Database from '../database/Database';
import PhotoCard from '../components/PhotoCard';

const HomeScreen = ({ user }) => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPhotos = async () => {
    try {
      const allPhotos = await Database.getAllPhotos();
      setPhotos(allPhotos);
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPhotos();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadPhotos();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderPhoto = ({ item }) => (
    <PhotoCard
      photo={item}
      userName={item.user_name}
      comment={item.comment}
      location={item.location_name}
      date={formatDate(item.taken_at)}
    />
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text>Carregando fotos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  listContainer: {
    paddingVertical: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
});

export default HomeScreen;