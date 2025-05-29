import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, Modal, TextInput } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import Database from '../database/Database';
import PhotoGrid from '../components/PhotoGrid';
import AlbumGrid from '../components/AlbumGrid';

const Tab = createMaterialTopTabNavigator();

const ImagesTab = ({ photos }) => (
  <PhotoGrid photos={photos} />
);

const AlbumsTab = ({ photos }) => {
  const albums = photos.reduce((acc, photo) => {
    if (photo.location_name) {
      if (!acc[photo.location_name]) {
        acc[photo.location_name] = [];
      }
      acc[photo.location_name].push(photo);
    }
    return acc;
  }, {});

  return <AlbumGrid albums={albums} />;
};

const ProfileScreen = ({ user, onLogout }) => {
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
    <View style={styles.container}>
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
        >
          <Ionicons name="settings-outline" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      {/* Abas de Conteúdo */}
      {loading ? (
        <View style={styles.centered}>
          <Text>Carregando...</Text>
        </View>
      ) : (
        <Tab.Navigator
          screenOptions={{
            tabBarLabelStyle: { fontSize: 14, fontWeight: 'bold' },
            tabBarStyle: { backgroundColor: 'white' },
            tabBarActiveTintColor: '#4A90E2',
            tabBarInactiveTintColor: '#666',
            tabBarIndicatorStyle: { backgroundColor: '#4A90E2' },
          }}
        >
          <Tab.Screen name="Images" options={{ title: 'Imagens' }}>
            {() => <ImagesTab photos={photos} />}
          </Tab.Screen>
          <Tab.Screen name="Albums" options={{ title: 'Álbuns' }}>
            {() => <AlbumsTab photos={photos} />}
          </Tab.Screen>
        </Tab.Navigator>
      )}

      {/* Modal de Configurações */}
      <Modal
        visible={showSettings}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSettings(false)}
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
            >
              <Ionicons name="person-outline" size={20} color="#666" />
              <Text style={styles.modalOptionText}>Editar dados</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.logoutOption]}
              onPress={() => {
                setShowSettings(false);
                handleLogout();
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#e74c3c" />
              <Text style={[styles.modalOptionText, styles.logoutText]}>Sair da conta</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => setShowSettings(false)}
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
            />
            
            <View style={styles.editButtons}>
              <TouchableOpacity 
                style={styles.cancelEditButton}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.cancelEditButtonText}>Cancelar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleEditProfile}
              >
                <Text style={styles.saveButtonText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  avatarText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  photoCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  settingsButton: {
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    minWidth: 250,
    maxWidth: 300,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  logoutOption: {
    borderBottomWidth: 0,
  },
  logoutText: {
    color: '#e74c3c',
  },
  cancelButton: {
    marginTop: 15,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
  editModalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 25,
    minWidth: 300,
    maxWidth: 350,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelEditButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelEditButtonText: {
    color: '#666',
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;