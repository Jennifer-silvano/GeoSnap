// screens/HomeScreen.js
import { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const dummyPhotos = [
  { id: '1', comment: 'Viagem incrível!', date: '2024-12-20', location: 'Rio de Janeiro' },
  { id: '2', comment: '', date: '2024-11-15', location: 'São Paulo' },
];

export default function HomeScreen() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    setPhotos(dummyPhotos);
  }, []);

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.date}>📅 {item.date}</Text>
      <Text style={styles.location}>📍 {item.location}</Text>
      {item.comment ? <Text style={styles.comment}>💬 {item.comment}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lembranças</Text>
      <FlatList
        data={photos}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#f0f0f0', padding: 15, borderRadius: 10, marginBottom: 15 },
  date: { fontSize: 14, marginBottom: 5 },
  location: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  comment: { fontStyle: 'italic' }
});