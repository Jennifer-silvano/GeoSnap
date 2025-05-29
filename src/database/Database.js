import * as SQLite from 'expo-sqlite';

class Database {
  constructor() {
    this.db = null;
  }

  async init() {
    try {
      this.db = await SQLite.openDatabaseAsync('geosnap.db');
      await this.createTables();
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

    await this.db.execAsync(createUsersTable);
    await this.db.execAsync(createPhotosTable);
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

  async getUserPhotos(userId) {
    const result = await this.db.getAllAsync(
      'SELECT * FROM photos WHERE user_id = ? ORDER BY taken_at DESC',
      [userId]
    );
    return result;
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
        'SELECT COUNT(DISTINCT location_name) as count FROM photos WHERE user_id = ? AND location_name IS NOT NULL',
        [userId]
      );

      return {
        photoCount: photoCount?.count || 0,
        locationsCount: locationsCount?.count || 0
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      return { photoCount: 0, locationsCount: 0 };
    }
  }
}

export default new Database();