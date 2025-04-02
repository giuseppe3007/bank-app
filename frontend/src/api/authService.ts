import axios from './axiosConfig';

// Interfaccia per le risposte dell'API di autenticazione
interface AuthResponse {
  access: string;
  refresh: string;
}

interface UserData {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
}

class AuthService {
  // Memorizza i token nella sessione
  private static saveTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    // Impostare l'header per tutte le future richieste API
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
  }

  // Rimuove i token dalla sessione
  public static clearTokens(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete axios.defaults.headers.common['Authorization'];
  }

  // Controlla se l'utente è autenticato
  public static isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  // Ottiene il token di accesso corrente
  public static getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  // Ottiene il token di refresh
  public static getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  // Login con username e password
  public static async login(username: string, password: string): Promise<UserData> {
    try {
      const response = await axios.post<AuthResponse>('/api/token/', { 
        username, 
        password 
      });
      
      const { access, refresh } = response.data;
      this.saveTokens(access, refresh);
      
      // Ottieni i dati dell'utente
      return await this.getCurrentUser();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  // Logout
  public static logout(): void {
    this.clearTokens();
  }

  // Refresh del token
  public static async refreshToken(): Promise<string> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post<{ access: string }>('/api/token/refresh/', {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      
      // Aggiorna solo il token di accesso, mantenendo lo stesso refresh token
      localStorage.setItem('access_token', access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      return access;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens(); // In caso di errore, logout
      throw error;
    }
  }

  // Ottieni i dati dell'utente corrente
  public static async getCurrentUser(): Promise<UserData> {
    try {
      const response = await axios.get<UserData>('/api/user/');
      return response.data;
    } catch (error) {
      console.error('Error fetching current user:', error);
      throw error;
    }
  }

  // Auto login (utile per lo sviluppo)
  public static async autoLogin(credentials = { username: 'admin', password: 'bankapp2024' }): Promise<UserData | null> {
    try {
      return await this.login(credentials.username, credentials.password);
    } catch (error) {
      console.error('Auto login failed:', error);
      return null;
    }
  }

  // Verifica e ripristina l'autenticazione (utile al caricamento dell'app)
  public static async verifyAndRestoreAuth(): Promise<boolean> {
    const token = this.getAccessToken();
    
    if (!token) {
      return false;
    }
    
    // Imposta l'header di autorizzazione
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    try {
      // Verifica che il token sia valido tentando di ottenere i dati dell'utente
      await this.getCurrentUser();
      return true;
    } catch (error) {
      // Se otteniamo un errore 401, proviamo a fare il refresh del token
      const axiosError = error as any;
      if (axiosError.response?.status === 401) {
        try {
          await this.refreshToken();
          return true;
        } catch (refreshError) {
          this.clearTokens();
          return false;
        }
      }
      
      this.clearTokens();
      return false;
    }
  }
}

export default AuthService;
