// services/db.js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabase('geosnap.db');

export const executeSql = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        sql,
        params,
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });

export const initDB = () =>
  new Promise((resolve, reject) => {
    db.transaction(
      tx => {
        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            birthdate TEXT
          );`,
          [],
          () => console.log('Tabela users criada ✅'),
          (_, error) => {
            console.error('Erro criando tabela users ❌', error);
            return true;
          }
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            image_uri TEXT,
            location_name TEXT,
            location_coords TEXT,
            comment TEXT,
            created_at TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
          );`,
          [],
          () => console.log('Tabela photos criada ✅'),
          (_, error) => {
            console.error('Erro criando tabela photos ❌', error);
            return true;
          }
        );

        tx.executeSql(
          `CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            location_name TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
          );`,
          [],
          () => console.log('Tabela albums criada ✅'),
          (_, error) => {
            console.error('Erro criando tabela albums ❌', error);
            return true;
          }
        );
      },
      error => {
        console.error('Erro geral na transaction do banco ❌', error);
        reject(error);
      },
      () => {
        console.log('Todas tabelas criadas com sucesso 🎉');
        resolve();
      }
    );
  });

export default db;
