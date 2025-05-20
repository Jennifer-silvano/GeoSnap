import { executeSql } from './db';

// Salvar foto
export const addPhoto = ({
  userId,
  imageUri,
  locationName,
  locationCoords,
  comment = ''
}) =>
  executeSql(
    `INSERT INTO photos
     (user_id, image_uri, location_name, location_coords, comment, created_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    [userId, imageUri, locationName, locationCoords, comment]
  );

// Buscar TODAS as fotos do usuário
export const getPhotosByUser = userId =>
  executeSql(
    'SELECT * FROM photos WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );

// Buscar apenas fotos antigas (ex: >90 dias) para “Lembranças”
export const getOldPhotos = (userId, days = 90) =>
  executeSql(
    `
    SELECT * FROM photos
    WHERE user_id = ?
      AND julianday('now') - julianday(created_at) > ?
    ORDER BY created_at DESC
    `,
    [userId, days]
  );
