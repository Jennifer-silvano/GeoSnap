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
  RefreshControl,
  Alert,
  Modal,
  ScrollView,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import Database from '../database/Database';

const { width, height } = Dimensions.get('window');
const ITEM_SIZE = (width - 40) / 3; // 3 colunas com margem

const PhotoGrid = ({ 
  photos = [], 
  onPhotoPress, 
  onRefresh, 
  refreshing = false, 
  user,
  onDeletePhoto,
  onSharePhoto,
  onShareWhatsApp,
  showDeleteOption = false,
  showShareOption = false,
  showWhatsAppOption = false
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePhotoPress = (photo) => {
    setSelectedPhoto(photo);
    setModalVisible(true);
  };

  const handleDeletePhoto = async () => {
    if (!selectedPhoto) return;

    Alert.alert(
      'Excluir Foto',
      'Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              // Se existe uma função onDeletePhoto externa, usa ela
              if (onDeletePhoto) {
                await onDeletePhoto(selectedPhoto.id);
              } else {
                // Caso contrário, usa a função interna
                await Database.deletePhoto(selectedPhoto.id);
                Alert.alert('Sucesso', 'Foto excluída com sucesso!');
              }
              
              setModalVisible(false);
              setSelectedPhoto(null);
              
              // Atualizar a lista de fotos
              if (onRefresh) {
                onRefresh();
              }
            } catch (error) {
              console.error('Erro ao excluir foto:', error);
              Alert.alert('Erro', 'Não foi possível excluir a foto');
            }
            setDeleting(false);
          }
        }
      ]
    );
  };

  // NOVA FUNÇÃO DE COMPARTILHAMENTO MELHORADA
  const handleSharePhoto = async () => {
    if (!selectedPhoto) return;
    
    try {
      // Verificar se o dispositivo suporta compartilhamento
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Compartilhar usando Expo Sharing (mais confiável para imagens)
        await Sharing.shareAsync(selectedPhoto.uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Compartilhar foto do GeoSnap',
          UTI: 'public.jpeg'
        });
      } else if (onSharePhoto) {
        // Fallback para a função externa
        onSharePhoto(selectedPhoto);
      } else {
        Alert.alert('Erro', 'Compartilhamento não disponível neste dispositivo');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar a foto');
    }
  };

  // NOVA FUNÇÃO DE COMPARTILHAMENTO WHATSAPP MELHORADA
  const handleShareWhatsApp = async () => {
    if (!selectedPhoto) return;
    
    try {
      // Solicitar permissão para acessar a biblioteca de mídia
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permissão necessária', 'Precisamos de permissão para salvar a foto temporariamente');
        return;
      }

      // Salvar a foto na galeria
      const asset = await MediaLibrary.createAssetAsync(selectedPhoto.uri);
      
      // Preparar mensagem
      const message = `Olha essa foto incrível${selectedPhoto.location_name ? ` tirada no ${selectedPhoto.location_name}` : ''}! 📸 Compartilhada via GeoSnap!`;
      
      // Tentar abrir WhatsApp
      const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(message)}`;
      
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
        
        Alert.alert(
          'WhatsApp aberto!', 
          'A foto foi salva na galeria. No WhatsApp, toque no clipe para anexar a foto.',
          [
            {
              text: 'Entendi'
            },
            {
              text: 'Remover da Galeria',
              onPress: async () => {
                try {
                  await MediaLibrary.deleteAssetsAsync([asset]);
                  Alert.alert('OK', 'Foto temporária removida da galeria');
                } catch (error) {
                  console.log('Erro ao remover foto temporária:', error);
                }
              }
            }
          ]
        );
      } else {
        // WhatsApp não instalado, usar compartilhamento geral
        await handleSharePhoto();
      }
    } catch (error) {
      console.error('Erro no WhatsApp:', error);
      if (onShareWhatsApp) {
        onShareWhatsApp(selectedPhoto);
      } else {
        Alert.alert('Erro', 'Não foi possível preparar para WhatsApp');
      }
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPhoto(null);
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Data inválida';
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

  const renderPhotoModal = () => (
    <Modal
      animationType="fade"
      transparent={true}
      visible={modalVisible}
      onRequestClose={closeModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header com botão fechar */}
            <View style={styles.modalHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeModal}
              >
                <Icon name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            {/* Imagem */}
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />

                {/* Informações da foto */}
                <View style={styles.photoDetails}>
                  {selectedPhoto.created_at && (
                    <View style={styles.detailRow}>
                      <Icon name="schedule" size={20} color="#666" />
                      <Text style={styles.detailText}>
                        {formatDate(selectedPhoto.created_at)}
                      </Text>
                    </View>
                  )}

                  {selectedPhoto.location_name && (
                    <View style={styles.detailRow}>
                      <Icon name="place" size={20} color="#666" />
                      <Text style={styles.detailText}>
                        {selectedPhoto.location_name}
                      </Text>
                    </View>
                  )}

                  {selectedPhoto.comment && (
                    <View style={styles.detailRow}>
                      <Icon name="chat-bubble-outline" size={20} color="#666" />
                      <Text style={styles.detailText}>
                        {selectedPhoto.comment}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Botões de ação */}
                <View style={styles.actionButtons}>
                  {/* Botões de compartilhamento */}
                  {(showShareOption || showWhatsAppOption) && (
                    <View style={styles.shareButtons}>
                      
                      {showShareOption && (
                            <TouchableOpacity
                              style={[styles.actionButton, styles.shareButton]}
                            onPress={handleSharePhoto}
                                      >
                    <Icon name="ios-share" size={20} color="#fff" />
                     <Text style={styles.shareButtonText}>
                               Compartilhar
                                  </Text>
                                     </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* Botão de deletar */}
                  {showDeleteOption && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={handleDeletePhoto}
                      disabled={deleting}
                    >
                      <Icon 
                        name="delete" 
                        size={20} 
                        color="#fff" 
                      />
                      <Text style={styles.deleteButtonText}>
                        {deleting ? 'Excluindo...' : 'Excluir Foto'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
      
      {renderPhotoModal()}
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
    alignments: 'center',
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    maxHeight: height * 0.9,
    width: width * 0.95,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  closeButton: {
    padding: 5,
  },
  modalImage: {
    width: '100%',
    height: 300,
    backgroundColor: '#f5f5f5',
  },
  photoDetails: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  actionButtons: {
    padding: 20,
    paddingTop: 0,
  },
  
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flex: 1,
  },
  shareButton: {
    backgroundColor: '#073022',
    marginLeft: 5,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  
  deleteButton: {
    backgroundColor: '#e74c3c',
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default PhotoGrid;