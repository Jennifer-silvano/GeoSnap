import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import SplashScreen from '../screens/SplashScreen';
import { initDB } from '../services/db';
import AppTabs from './AppTabs';
import AuthStack from './AuthStack';

export default function RootNavigation() {
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();

        setTimeout(async () => {
          const userToken = await SecureStore.getItemAsync('userToken');
          setIsAuthenticated(!!userToken);
          setShowSplash(false);
          setLoading(false);
        }, 2000);

      } catch (error) {
        console.log('Erro na inicialização:', error);
        setShowSplash(false);
        setLoading(false);
      }
    };
    initializeApp();
  }, []);

  if (showSplash) return <SplashScreen />;

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return isAuthenticated ? <AppTabs /> : <AuthStack />;
}
