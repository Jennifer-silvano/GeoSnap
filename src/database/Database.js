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

  async savePhoto(userId, uri, comment, latitude, longitude, locationName) {
    const result = await this.db.runAsync(
      'INSERT INTO photos (user_id, uri, comment, latitude, longitude, location_name) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, uri, comment, latitude, longitude, locationName]
    );
    return result.lastInsertRowId;
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
}

export default new Database();