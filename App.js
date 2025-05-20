// App.js
import { NavigationContainer } from '@react-navigation/native';
import { useEffect } from 'react';
import RootNavigation from './navigation/RootNavigation';
import { initDB } from './services/db'; // ← importe a função

export default function App() {
  useEffect(() => {
    // cria as tabelas se ainda não existirem
    initDB()
      .then(() => console.log('Banco SQLite pronto ✅'))
      .catch(err => console.error('Erro ao iniciar DB:', err));
  }, []);

  return (
    <NavigationContainer>
      <RootNavigation />
    </NavigationContainer>
  );
}
