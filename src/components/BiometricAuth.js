import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import { Ionicons } from '@expo/vector-icons';

const BiometricAuth = ({ onAuthSuccess, onAuthFail, title = "Autenticação Biométrica" }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [biometricTypes, setBiometricTypes] = useState([]);

  useEffect(() => {
    checkBiometricSupport();
  }, []);

  const checkBiometricSupport = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      setIsBiometricSupported(compatible);
      
      if (compatible) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        setBiometricTypes(types);
      }
    } catch (error) {
      console.error('Erro ao verificar suporte biométrico:', error);
    }
  };

  const authenticateWithBiometrics = async () => {
    try {
      const savedBiometrics = await LocalAuthentication.isEnrolledAsync();
      
      if (!savedBiometrics) {
        Alert.alert(
          'Biometria não configurada',
          'Configure a autenticação biométrica nas configurações do dispositivo.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: title,
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar senha',
        disableDeviceFallback: false,
      });

      if (result.success) {
        onAuthSuccess && onAuthSuccess();
      } else {
        onAuthFail && onAuthFail(result.error);
      }
    } catch (error) {
      console.error('Erro na autenticação biométrica:', error);
      onAuthFail && onAuthFail(error.message);
    }
  };

  const getBiometricIcon = () => {
    if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face-outline';
    } else if (biometricTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'finger-print-outline';
    }
    return 'shield-checkmark-outline';
  };

  if (!isBiometricSupported) {
    return (
      <View style={styles.container}>
        <Text style={styles.notSupportedText}>
          Autenticação biométrica não disponível neste dispositivo
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.biometricButton}
        onPress={authenticateWithBiometrics}
      >
        <Ionicons 
          name={getBiometricIcon()} 
          size={50} 
          color="#4A90E2" 
        />
        <Text style={styles.buttonText}>
          Usar {biometricTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION) 
            ? 'Face ID' 
            : 'Digital'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = {
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  biometricButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 15,
    padding: 20,
    borderWidth: 2,
    borderColor: '#4A90E2',
    minWidth: 150,
  },
  buttonText: {
    marginTop: 10,
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  notSupportedText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
};

export default BiometricAuth;