import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Updates from 'expo-updates'; // ← para reiniciar o app
import { useState } from 'react';
import { Alert, Button, StyleSheet, Text, TextInput, View } from 'react-native';
import { getUserByEmailAndPassword } from './services/userService'; // importando do banco

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Preencha todos os campos.');
      return;
    }

    try {
      const user = await getUserByEmailAndPassword(email, password);
      if (!user) {
        Alert.alert('Email ou senha inválidos.');
        return;
      }

      const biometricAuth = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Confirme sua identidade'
      });

      if (biometricAuth.success) {
        await SecureStore.setItemAsync('userToken', 'valid_token');
        await Updates.reloadAsync(); // ← reinicia o app e força RootNavigation
      } else {
        Alert.alert('Autenticação biométrica falhou.');
      }

    } catch (error) {
      console.error(error);
      Alert.alert('Erro ao fazer login. Tente novamente.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>GeoSnap</Text>
      <Text style={styles.subtitle}>Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
      <Button title="Entrar" onPress={handleLogin} />
      <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>Cadastrar-se</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 24, marginBottom: 20 },
  input: { width: '100%', height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 15 },
  registerLink: { color: 'blue', marginTop: 15 }
});
