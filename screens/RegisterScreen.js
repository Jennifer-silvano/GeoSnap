import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns'; // para formatar a data
import { useState } from 'react';
import { Alert, Button, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { insertUser } from './services/userService'; // importando função de cadastro

export default function RegisterScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  const handleRegister = async () => {
    if (email && password && name && dob) {
      try {
        const birthdateStr = format(dob, 'yyyy-MM-dd'); // formata para salvar no SQLite
        await insertUser({ name, email, password, birthdate: birthdateStr });
        Alert.alert('Cadastro realizado com sucesso!');
        navigation.goBack();
      } catch (error) {
        console.error(error);
        Alert.alert('Erro ao cadastrar', 'Verifique os dados ou tente novamente.');
      }
    } else {
      Alert.alert('Preencha todos os campos.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <Text style={{ marginBottom: 10 }}>Data de nascimento:</Text>
      <Button title={dob.toLocaleDateString()} onPress={() => setShowPicker(true)} />
      {showPicker && (
        <DateTimePicker
          value={dob}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            const currentDate = selectedDate || dob;
            setShowPicker(false);
            setDob(currentDate);
          }}
        />
      )}
      <View style={{ height: 20 }} />
      <Button title="Cadastrar" onPress={handleRegister} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15 }
});
