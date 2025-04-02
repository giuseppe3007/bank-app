import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AuthService from '../api/authService';

// Definiamo l'interfaccia per l'utente
interface User {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

// Definiamo la forma del contesto di autenticazione
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  autoLogin: () => Promise<void>; // Nuova funzione per il login automatico
}

// Creiamo il contesto di autenticazione con valori predefiniti
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  loading: false,
  error: null,
  autoLogin: async () => {}, // Valore predefinito per autoLogin
});

// Hook personalizzato per utilizzare il contesto di autenticazione
export const useAuth = () => useContext(AuthContext);

// Props per il componente AuthProvider
interface AuthProviderProps {
  children: ReactNode;
}

// Componente AuthProvider per avvolgere l'applicazione
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verifica e ripristina l'autenticazione all'avvio
  useEffect(() => {
    const verifyAuth = async () => {
      setLoading(true);
      try {
        // Utilizziamo il metodo verifyAndRestoreAuth dal nostro service
        const isAuth = await AuthService.verifyAndRestoreAuth();
        
        if (isAuth) {
          setIsAuthenticated(true);
          // Recupera i dettagli dell'utente se l'autenticazione è valida
          const userData = await AuthService.getCurrentUser();
          setUser(userData);
        }
      } catch (err) {
        console.error('Error verifying authentication:', err);
        // Non impostiamo alcun errore qui per non disturbare l'utente all'avvio
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  // Funzione di login
  const login = async (username: string, password: string) => {
    try {
      console.log('LoginProcess: Tentativo di login iniziato', { username });
      setLoading(true);
      setError(null);
      
      // Utilizziamo il metodo login dal nostro service
      const userData = await AuthService.login(username, password);
      
      setIsAuthenticated(true);
      setUser(userData);
      console.log('LoginProcess: Login completato con successo');
    } catch (err: any) {
      console.log('LoginProcess: Errore durante il login', err);
      setError(err.response?.data?.detail || 'Login fallito. Controlla le credenziali.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Funzione di logout
  const logout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Funzione per il login automatico (utile per lo sviluppo)
  const autoLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const userData = await AuthService.autoLogin();
      
      if (userData) {
        setIsAuthenticated(true);
        setUser(userData);
        console.log('Auto login completato con successo');
      } else {
        setError('Auto login fallito');
      }
    } catch (err: any) {
      console.error('Auto login error:', err);
      setError('Auto login fallito');
    } finally {
      setLoading(false);
    }
  };

  // Creazione del valore del contesto
  const contextValue: AuthContextType = {
    isAuthenticated,
    user,
    login,
    logout,
    loading,
    error,
    autoLogin,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
