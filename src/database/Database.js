import * as SQLite from 'expo-sqlite';

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('geosnap.db');
      await this.createTables();
      await this.updateTables(); // Adicionar para atualizações de schema
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
    }
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        profile_image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const createPhotosTable = `
      CREATE TABLE IF NOT EXISTS photos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        uri TEXT NOT NULL,
        comment TEXT,
        latitude REAL,
        longitude REAL,
        location_name TEXT,
        taken_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
      );
    `;

    const createFavoritesTable = `
      CREATE TABLE IF NOT EXISTS favorites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        photo_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id),
        FOREIGN KEY (photo_id) REFERENCES photos (id),
        UNIQUE(user_id, photo_id)
      );
    `;

    await this.db.execAsync(createUsersTable);
    await this.db.execAsync(createPhotosTable);
    await this.db.execAsync(createFavoritesTable);
  }

  // Método para atualizar tabelas existentes (para usuários que já têm o app)
  async updateTables() {
    try {
      // Verificar se a coluna profile_image já existe
      const tableInfo = await this.db.getAllAsync("PRAGMA table_info(users)");
      const hasProfileImage = tableInfo.some(column => column.name === 'profile_image');
      
      if (!hasProfileImage) {
        await this.db.execAsync('ALTER TABLE users ADD COLUMN profile_image TEXT');
        console.log('Coluna profile_image adicionada à tabela users');
      }
    } catch (error) {
      console.error('Erro ao atualizar tabelas:', error);
    }
  }

  async createUser(name, email, password, birthDate) {
    const result = await this.db.runAsync(
      'INSERT INTO users (name, email, password, birth_date) VALUES (?, ?, ?, ?)',
      [name, email, password, birthDate]
    );
    return result.lastInsertRowId;
  }

  async authenticateUser(email, password) {
    const result = await this.db.getFirstAsync(
      'SELECT * FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    return result;
  }

  // Método savePhoto corrigido para aceitar takenAt personalizado
  async savePhoto(userId, uri, comment, latitude, longitude, locationName, takenAt = null) {
    const timestamp = takenAt || new Date().toISOString();
    const result = await this.db.runAsync(
      'INSERT INTO photos (user_id, uri, comment, latitude, longitude, location_name, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, uri, comment, latitude, longitude, locationName, timestamp]
    );
    return result.lastInsertRowId;
  }

  // Método deletePhoto implementado
  async deletePhoto(photoId) {
    try {
      // Primeiro, remover dos favoritos se existir
      await this.db.runAsync(
        'DELETE FROM favorites WHERE photo_id = ?',
        [photoId]
      );
      
      // Depois, deletar a foto
      const result = await this.db.runAsync(
        'DELETE FROM photos WHERE id = ?',
        [photoId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao deletar foto:', error);
      throw error;
    }
  }

  // Método updateUser implementado
  async updateUser(userId, name) {
    try {
      const result = await this.db.runAsync(
        'UPDATE users SET name = ? WHERE id = ?',
        [name, userId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Método para atualizar foto de perfil do usuário
  async updateUserProfileImage(userId, profileImageUri) {
    try {
      const result = await this.db.runAsync(
        'UPDATE users SET profile_image = ? WHERE id = ?',
        [profileImageUri, userId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao atualizar foto de perfil:', error);
      throw error;
    }
  }

  // Método para obter foto de perfil do usuário
  async getUserProfileImage(userId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT profile_image FROM users WHERE id = ?',
        [userId]
      );
      return result?.profile_image || null;
    } catch (error) {
      console.error('Erro ao buscar foto de perfil:', error);
      return null;
    }
  }

  // Método para obter dados completos do usuário incluindo foto de perfil
  async getUserById(userId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      return result;
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      throw error;
    }
  }

  // MÉTODO PRINCIPAL: Buscar fotos do usuário com informação de favorito
  async getUserPhotos(userId) {
    try {
      const result = await this.db.getAllAsync(`
        SELECT 
          p.*,
          CASE WHEN f.id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
        FROM photos p
        LEFT JOIN favorites f ON p.id = f.photo_id AND f.user_id = ?
        WHERE p.user_id = ?
        ORDER BY p.taken_at DESC
      `, [userId, userId]);
      
      return result;
    } catch (error) {
      console.error('Erro ao buscar fotos do usuário:', error);
      throw error;
    }
  }

  async getAllPhotos() {
    const result = await this.db.getAllAsync(`
      SELECT p.*, u.name as user_name 
      FROM photos p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.taken_at DESC
    `);
    return result;
  }

  // Método para obter estatísticas do usuário
  async getUserStats(userId) {
    try {
      const photoCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM photos WHERE user_id = ?',
        [userId]
      );
      
      const locationsCount = await this.db.getFirstAsync(
        'SELECT COUNT(DISTINCT location_name) as count FROM photos WHERE user_id = ? AND location_name IS NOT NULL AND location_name != ""',
        [userId]
      );

      const favoritesCount = await this.db.getFirstAsync(
        'SELECT COUNT(*) as count FROM favorites WHERE user_id = ?',
        [userId]
      );

      return {
        photoCount: photoCount?.count || 0,
        locationsCount: locationsCount?.count || 0,
        favoritesCount: favoritesCount?.count || 0
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { photoCount: 0, locationsCount: 0, favoritesCount: 0 };
    }
  }

  // Adicionar foto aos favoritos
  async addFavorite(userId, photoId) {
    try {
      await this.db.runAsync(
        'INSERT OR REPLACE INTO favorites (user_id, photo_id) VALUES (?, ?)',
        [userId, photoId]
      );
      return true;
    } catch (error) {
      console.error('Erro ao adicionar favorito:', error);
      throw error;
    }
  }

  // Remover foto dos favoritos
  async removeFavorite(userId, photoId) {
    try {
      const result = await this.db.runAsync(
        'DELETE FROM favorites WHERE user_id = ? AND photo_id = ?',
        [userId, photoId]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao remover favorito:', error);
      throw error;
    }
  }

  // Buscar favoritos do usuário (apenas IDs)
  async getUserFavorites(userId) {
    try {
      const result = await this.db.getAllAsync(
        'SELECT * FROM favorites WHERE user_id = ?',
        [userId]
      );
      return result;
    } catch (error) {
      console.error('Erro ao buscar favoritos:', error);
      throw error;
    }
  }

  // Verificar se uma foto é favorita
  async isFavorite(userId, photoId) {
    try {
      const result = await this.db.getFirstAsync(
        'SELECT id FROM favorites WHERE user_id = ? AND photo_id = ?',
        [userId, photoId]
      );
      return !!result;
    } catch (error) {
      console.error('Erro ao verificar favorito:', error);
      return false;
    }
  }

  // Buscar fotos favoritas do usuário com detalhes (para usar em outras telas se necessário)
  async getUserFavoritePhotos(userId) {
    try {
      const result = await this.db.getAllAsync(`
        SELECT 
          p.*, 
          u.name as user_name, 
          f.created_at as favorited_at,
          1 as is_favorite
        FROM photos p
        JOIN favorites f ON p.id = f.photo_id
        JOIN users u ON p.user_id = u.id
        WHERE f.user_id = ?
        ORDER BY f.created_at DESC
      `, [userId]);
      return result;
    } catch (error) {
      console.error('Erro ao buscar fotos favoritas:', error);
      throw error;
    }
  }

  // MÉTODO ADICIONAL: Alternar status de favorito
  async toggleFavorite(userId, photoId) {
    try {
      const isFav = await this.isFavorite(userId, photoId);
      
      if (isFav) {
        await this.removeFavorite(userId, photoId);
        return false; // Não é mais favorito
      } else {
        await this.addFavorite(userId, photoId);
        return true; // Agora é favorito
      }
    } catch (error) {
      console.error('Erro ao alternar favorito:', error);
      throw error;
    }
  }
}

export default new Database();