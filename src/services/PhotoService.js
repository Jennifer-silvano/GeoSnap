import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LocationService from './LocationService';

const PHOTOS_STORAGE_KEY = 'geosnap_photos';

class PhotoService {
  constructor() {
    this.photos = [];
    this.loadPhotos();
  }

  // Solicitar permissões de câmera e galeria
  async requestPermissions() {
    try {
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.requestPermissionsAsync();
      
      return {
        success: true,
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted'
      };
    } catch (error) {
      console.error('Erro ao solicitar permissões:', error);
      return {
        success: false,
        error: 'Erro ao solicitar permissões'
      };
    }
  }

  // Verificar permissões
  async hasPermissions() {
    try {
      const cameraPermission = await ImagePicker.getCameraPermissionsAsync();
      const mediaLibraryPermission = await MediaLibrary.getPermissionsAsync();
      
      return {
        camera: cameraPermission.status === 'granted',
        mediaLibrary: mediaLibraryPermission.status === 'granted'
      };
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return {
        camera: false,
        mediaLibrary: false
      };
    }
  }

  // Tirar foto com a câmera
  async takePhoto(options = {}) {
    try {
      const permissions = await this.hasPermissions();
      
      if (!permissions.camera) {
        const permissionResult = await this.requestPermissions();
        if (!permissionResult.camera) {
          return {
            success: false,
            error: 'Permissão de câmera necessária'
          };
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        exif: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        return await this.processPhoto(asset, options);
      } else {
        return {
          success: false,
          error: 'Captura de foto cancelada'
        };
      }
    } catch (error) {
      console.error('Erro ao tirar foto:', error);
      return {
        success: false,
        error: 'Erro ao capturar foto'
      };
    }
  }

  // Selecionar foto da galeria
  async pickPhoto(options = {}) {
    try {
      const permissions = await this.hasPermissions();
      
      if (!permissions.mediaLibrary) {
        const permissionResult = await this.requestPermissions();
        if (!permissionResult.mediaLibrary) {
          return {
            success: false,
            error: 'Permissão de galeria necessária'
          };
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        aspect: options.aspect || [4, 3],
        quality: options.quality || 0.8,
        exif: true,
        allowsMultipleSelection: options.multiple || false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (options.multiple) {
          const processedPhotos = [];
          for (const asset of result.assets) {
            const processed = await this.processPhoto(asset, options);
            if (processed.success) {
              processedPhotos.push(processed.photo);
            }
          }
          return {
            success: true,
            photos: processedPhotos
          };
        } else {
          const asset = result.assets[0];
          return await this.processPhoto(asset, options);
        }
      } else {
        return {
          success: false,
          error: 'Seleção de foto cancelada'
        };
      }
    } catch (error) {
      console.error('Erro ao selecionar foto:', error);
      return {
        success: false,
        error: 'Erro ao selecionar foto'
      };
    }
  }

  // Processar foto (adicionar localização, redimensionar, etc.)
  async processPhoto(asset, options = {}) {
    try {
      let processedUri = asset.uri;
      
      // Redimensionar se necessário
      if (options.resize) {
        const manipulatorResult = await ImageManipulator.manipulateAsync(
          asset.uri,
          [
            {
              resize: {
                width: options.resize.width || 800,
                height: options.resize.height || 600,
              }
            }
          ],
          {
            compress: options.quality || 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          }
        );
        processedUri = manipulatorResult.uri;
      }

      // Obter localização atual se solicitado
      let location = null;
      if (options.includeLocation !== false) {
        const locationResult = await LocationService.getCurrentLocationFast();
        if (locationResult.success) {
          location = locationResult.location;
          
          // Obter endereço da localização
          const addressResult = await LocationService.reverseGeocode(
            location.latitude,
            location.longitude
          );
          if (addressResult.success) {
            location.address = addressResult.address;
          }
        }
      }

      // Criar objeto da foto
      const photo = {
        id: `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        uri: processedUri,
        width: asset.width,
        height: asset.height,
        location: location,
        timestamp: new Date().toISOString(),
        exif: asset.exif || null,
        fileSize: asset.fileSize || null,
        comment: options.comment || '',
        tags: options.tags || [],
      };

      // Salvar foto no armazenamento local se solicitado
      if (options.saveLocally !== false) {
        await this.savePhoto(photo);
      }

      return {
        success: true,
        photo: photo
      };
    } catch (error) {
      console.error('Erro ao processar foto:', error);
      return {
        success: false,
        error: 'Erro ao processar foto'
      };
    }
  }

  // Salvar foto no armazenamento local
  async savePhoto(photo) {
    try {
      // Copiar arquivo para diretório do app
      const fileName = `${photo.id}.jpg`;
      const newPath = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.copyAsync({
        from: photo.uri,
        to: newPath
      });

      // Atualizar URI da foto
      photo.uri = newPath;
      photo.localPath = newPath;

      // Adicionar à lista de fotos
      this.photos.unshift(photo);

      // Salvar lista atualizada
      await this.savePhotosToStorage();

      return {
        success: true,
        photo: photo
      };
    } catch (error) {
      console.error('Erro ao salvar foto:', error);
      return {
        success: false,
        error: 'Erro ao salvar foto'
      };
    }
  }

  // Carregar fotos do armazenamento
  async loadPhotos() {
    try {
      const storedPhotos = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
      if (storedPhotos) {
        this.photos = JSON.parse(storedPhotos);
        
        // Verificar se os arquivos ainda existem
        const validPhotos = [];
        for (const photo of this.photos) {
          if (photo.localPath) {
            const fileInfo = await FileSystem.getInfoAsync(photo.localPath);
            if (fileInfo.exists) {
              validPhotos.push(photo);
            }
          } else {
            validPhotos.push(photo);
          }
        }
        
        this.photos = validPhotos;
        await this.savePhotosToStorage();
      }
    } catch (error) {
      console.error('Erro ao carregar fotos:', error);
      this.photos = [];
    }
  }

  // Salvar lista de fotos no armazenamento
  async savePhotosToStorage() {
    try {
      await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(this.photos));
    } catch (error) {
      console.error('Erro ao salvar fotos no storage:', error);
    }
  }

  // Obter todas as fotos
  getAllPhotos() {
    return this.photos;
  }

  // Obter foto por ID
  getPhotoById(id) {
    return this.photos.find(photo => photo.id === id);
  }

  // Deletar foto
  async deletePhoto(photoId) {
    try {
      const photoIndex = this.photos.findIndex(photo => photo.id === photoId);
      
      if (photoIndex === -1) {
        return {
          success: false,
          error: 'Foto não encontrada'
        };
      }

      const photo = this.photos[photoIndex];

      // Deletar arquivo local se existir
      if (photo.localPath) {
        const fileInfo = await FileSystem.getInfoAsync(photo.localPath);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(photo.localPath);
        }
      }

      // Remover da lista
      this.photos.splice(photoIndex, 1);

      // Salvar lista atualizada
      await this.savePhotosToStorage();

      return {
        success: true
      };
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      return {
        success: false,
        error: 'Erro ao deletar foto'
      };
    }
  }

  // Atualizar comentário da foto
  async updatePhotoComment(photoId, comment) {
    try {
      const photo = this.getPhotoById(photoId);
      
      if (!photo) {
        return {
          success: false,
          error: 'Foto não encontrada'
        };
      }

      photo.comment = comment;
      photo.updatedAt = new Date().toISOString();

      await this.savePhotosToStorage();

      return {
        success: true,
        photo: photo
      };
    } catch (error) {
      console.error('Erro ao atualizar comentário:', error);
      return {
        success: false,
        error: 'Erro ao atualizar comentário'
      };
    }
  }

  // Adicionar tags à foto
  async addPhotoTags(photoId, tags) {
    try {
      const photo = this.getPhotoById(photoId);
      
      if (!photo) {
        return {
          success: false,
          error: 'Foto não encontrada'
        };
      }

      photo.tags = [...new Set([...photo.tags, ...tags])];
      photo.updatedAt = new Date().toISOString();

      await this.savePhotosToStorage();

      return {
        success: true,
        photo: photo
      };
    } catch (error) {
      console.error('Erro ao adicionar tags:', error);
      return {
        success: false,
        error: 'Erro ao adicionar tags'
      };
    }
  }

  // Filtrar fotos por localização
  getPhotosByLocation(latitude, longitude, radiusInMeters = 1000) {
    return this.photos.filter(photo => {
      if (!photo.location) return false;
      
      const distance = LocationService.calculateDistance(
        latitude,
        longitude,
        photo.location.latitude,
        photo.location.longitude
      );
      
      return distance <= radiusInMeters;
    });
  }

  // Filtrar fotos por data
  getPhotosByDateRange(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return this.photos.filter(photo => {
      const photoDate = new Date(photo.timestamp);
      return photoDate >= start && photoDate <= end;
    });
  }

  // Buscar fotos por tags
  getPhotosByTags(tags) {
    return this.photos.filter(photo => {
      return tags.some(tag => photo.tags.includes(tag));
    });
  }

  // Obter estatísticas das fotos
  getPhotoStats() {
    const totalPhotos = this.photos.length;
    const photosWithLocation = this.photos.filter(photo => photo.location).length;
    const photosWithComments = this.photos.filter(photo => photo.comment).length;
    
    const allTags = this.photos.reduce((acc, photo) => {
      return [...acc, ...photo.tags];
    }, []);
    
    const uniqueTags = [...new Set(allTags)];
    
    return {
      totalPhotos,
      photosWithLocation,
      photosWithComments,
      totalTags: uniqueTags.length,
      mostUsedTags: this.getMostUsedTags(allTags, 5)
    };
  }

  // Obter tags mais usadas
  getMostUsedTags(tags, limit = 5) {
    const tagCount = {};
    
    tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
    
    return Object.entries(tagCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  // Exportar fotos para galeria do dispositivo
  async exportToGallery(photoIds = null) {
    try {
      const permissions = await this.hasPermissions();
      
      if (!permissions.mediaLibrary) {
        const permissionResult = await this.requestPermissions();
        if (!permissionResult.mediaLibrary) {
          return {
            success: false,
            error: 'Permissão de galeria necessária'
          };
        }
      }

      const photosToExport = photoIds 
        ? this.photos.filter(photo => photoIds.includes(photo.id))
        : this.photos;

      const exportedCount = 0;
      
      for (const photo of photosToExport) {
        try {
          await MediaLibrary.saveToLibraryAsync(photo.uri);
          exportedCount++;
        } catch (error) {
          console.error(`Erro ao exportar foto ${photo.id}:`, error);
        }
      }

      return {
        success: true,
        exportedCount: exportedCount,
        totalCount: photosToExport.length
      };
    } catch (error) {
      console.error('Erro ao exportar fotos:', error);
      return {
        success: false,
        error: 'Erro ao exportar fotos'
      };
    }
  }
}

export default new PhotoService();