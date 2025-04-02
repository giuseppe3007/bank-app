import axios from 'axios';

// Imposta l'URL di base per tutte le richieste axios
axios.defaults.baseURL = 'http://localhost:8000';

// Recupera token dal localStorage e lo applica se esiste
const token = localStorage.getItem('access_token');
if (token) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Configura interceptor per la gestione automatica del refresh token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
  config: any;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.config.headers['Authorization'] = `Bearer ${token}`;
      promise.resolve(axios(promise.config));
    }
  });
  
  failedQueue = [];
};

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Se l'errore non è 401 o la richiesta ha già tentato di refresh, rifiuta
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject, config: originalRequest });
      });
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        // Se non c'è refresh token, logout
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        delete axios.defaults.headers.common['Authorization'];
        return Promise.reject(new Error('No refresh token'));
      }
      
      // Ottieni nuovo access token
      const response = await axios.post('/api/token/refresh/', {
        refresh: refreshToken
      });
      
      const { access } = response.data;
      
      // Aggiorna il token nel localStorage
      localStorage.setItem('access_token', access);
      axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
      
      // Aggiorna la richiesta originale con il nuovo token
      originalRequest.headers['Authorization'] = `Bearer ${access}`;
      
      // Processa le richieste in coda
      processQueue(null, access);
      
      return axios(originalRequest);
    } catch (refreshError) {
      // In caso di errore di refresh, logout
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      
      // Rifiuta tutte le richieste in coda
      processQueue(refreshError, null);
      
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default axios;
