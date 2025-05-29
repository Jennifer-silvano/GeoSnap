import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Alert } from 'react-native';

const AUTH_TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const REFRESH_TOKEN_KEY = 'refresh_token';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authToken = null;
  }

  // Simular API de login (substitua pela sua API real)
  async login(email, password) {
    try {
      // Simulação de chamada para API
      const response = await this.mockLoginAPI(email, password);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        // Armazenar dados do usuário
        await this.storeUserData(user);
        await this.storeAuthToken(token);
        await this.storeRefreshToken(refreshToken);
        
        this.currentUser = user;
        this.authToken = token;
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Simular API de registro
  async register(userData) {
    try {
      const response = await this.mockRegisterAPI(userData);
      
      if (response.success) {
        const { user, token, refreshToken } = response.data;
        
        await this.storeUserData(user);
        await this.storeAuthToken(token);
        await this.storeRefreshToken(refreshToken);
        
        this.currentUser = user;
        this.authToken = token;
        
        return { success: true, user };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  // Logout
  async logout() {
    try {
      await AsyncStorage.removeItem(USER_DATA_KEY);
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      
      this.currentUser = null;
      this.authToken = null;
      
      return { success: true };
    } catch (error) {
      console.error('Erro no logout:', error);
      return { success: false, error: 'Erro ao fazer logout' };
    }
  }

  // Verificar se o usuário está logado
  async isLoggedIn() {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      const userData = await AsyncStorage.getItem(USER_DATA_KEY);
      
      if (token && userData) {
        this.authToken = token;
        this.currentUser = JSON.parse(userData);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erro ao verificar login:', error);
      return false;
    }
  }

  // Obter dados do usuário atual
  getCurrentUser() {
    return this.currentUser;
  }

  // Obter token de autenticação
  getAuthToken() {
    return this.authToken;
  }

  // Atualizar dados do usuário
  async updateUserData(userData) {
    try {
      const updatedUser = { ...this.currentUser, ...userData };
      await this.storeUserData(updatedUser);
      this.currentUser = updatedUser;
      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('Erro ao atualizar dados do usuário:', error);
      return { success: false, error: 'Erro ao atualizar dados' };
    }
  }

  // Alterar senha
  async changePassword(currentPassword, newPassword) {
    try {
      // Simulação de verificação de senha atual
      const response = await this.mockChangePasswordAPI(
        this.currentUser.id,
        currentPassword,
        newPassword
      );
      
      if (response.success) {
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error);
      return { success: false, error: 'Erro ao alterar senha' };
    }
  }

  // Recuperar senha
  async forgotPassword(email) {
    try {
      const response = await this.mockForgotPasswordAPI(email);
      return response;
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      return { success: false, error: 'Erro ao enviar email de recuperação' };
    }
  }

  // Métodos auxiliares para armazenamento
  async storeUserData(userData) {
    await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
  }

  async storeAuthToken(token) {
    await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
  }

  async storeRefreshToken(refreshToken) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  }

  // Mock APIs (substitua pelas suas APIs reais)
  async mockLoginAPI(email, password) {
    // Simulação de delay de rede
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Usuários mock para teste
    const mockUsers = [
      {
        id: 1,
        email: 'user@test.com',
        password: '123456',
        name: 'Usuário Teste',
        avatar: null
      }
    ];
    
    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      return {
        success: true,
        data: {
          user: userWithoutPassword,
          token: 'mock_token_' + Date.now(),
          refreshToken: 'mock_refresh_token_' + Date.now()
        }
      };
    } else {
      return {
        success: false,
        error: 'Email ou senha incorretos'
      };
    }
  }

  async mockRegisterAPI(userData) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulação de verificação de email existente
    if (userData.email === 'existing@test.com') {
      return {
        success: false,
        error: 'Email já cadastrado'
      };
    }
    
    const newUser = {
      id: Date.now(),
      email: userData.email,
      name: userData.name,
      avatar: null,
      createdAt: new Date().toISOString()
    };
    
    return {
      success: true,
      data: {
        user: newUser,
        token: 'mock_token_' + Date.now(),
        refreshToken: 'mock_refresh_token_' + Date.now()
      }
    };
  }

  async mockChangePasswordAPI(userId, currentPassword, newPassword) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulação de verificação de senha atual
    if (currentPassword !== '123456') {
      return {
        success: false,
        error: 'Senha atual incorreta'
      };
    }
    
    return { success: true };
  }

  async mockForgotPasswordAPI(email) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      message: 'Email de recuperação enviado com sucesso'
    };
  }
}

export default new AuthService();