import db from './db';

// Inserir novo usuário (cadastro)
export const insertUser = ({ name, email, password, birthdate }) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `INSERT INTO users (name, email, password, birthdate) VALUES (?, ?, ?, ?)`,
        [name, email, password, birthdate],
        (_, result) => resolve(result),
        (_, error) => reject(error)
      );
    });
  });
};

// Buscar usuário por email e senha (login)
export const getUserByEmailAndPassword = (email, password) => {
  return new Promise((resolve, reject) => {
    db.transaction(tx => {
      tx.executeSql(
        `SELECT * FROM users WHERE email = ? AND password = ?`,
        [email, password],
        (_, { rows }) => {
          if (rows.length > 0) {
            resolve(rows.item(0));
          } else {
            resolve(null);
          }
        },
        (_, error) => reject(error)
      );
    });
  });
};
