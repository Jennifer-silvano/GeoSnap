import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PhotoCard = ({ 
  photo, 
  userName, 
  userProfileImage, // ← Este parâmetro estava sendo ignorado!
  comment, 
  location, 
  date, 
  isFavorite = false, 
  onToggleFavorite, 
  showFavorite = true 
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {userProfileImage ? (
            <Image 
              source={{ uri: userProfileImage }} 
              style={styles.avatarImage}
              resizeMode="cover"
            />
          ) : (
            <Text style={styles.avatarText}>
              {userName ? userName.charAt(0).toUpperCase() : 'U'}
            </Text>
          )}
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{userName || 'Usuário'}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        {showFavorite && (
          <TouchableOpacity onPress={onToggleFavorite} style={styles.favoriteButton}>
            <Ionicons
              name={isFavorite ? "heart" : "heart-outline"}
              size={24}
              color={isFavorite ? "#FF4458" : "#073022"}
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Image 
        source={{ uri: photo.uri }} 
        style={styles.photo}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        {comment && (
          <Text style={styles.comment}>{comment}</Text>
        )}
        
        {location && (
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color="#073022" />
            <Text style={styles.location}>{location}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    paddingBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#073022',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden', // ← Importante para a imagem ficar redonda
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#073022',
  },
  date: {
    fontSize: 12,
    color: '#073022',
    opacity: 0.7,
    marginTop: 2,
  },
  favoriteButton: {
    padding: 5,
  },
  photo: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  content: {
    padding: 15,
  },
  comment: {
    fontSize: 14,
    color: '#073022',
    lineHeight: 20,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 12,
    color: '#073022',
    opacity: 0.8,
    marginLeft: 4,
  },
});

export default PhotoCard;