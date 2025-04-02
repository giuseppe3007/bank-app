// Script per l'autenticazione automatica
import axios from './axiosConfig';

// Funzione per effettuare l'accesso
export const loginUser = async (username = 'admin', password = 'bankapp2024') => {
  try {
    console.log('Tentativo di login automatico...');
    const response = await axios.post('/api/token/', { username, password });
    
    const { access, refresh } = response.data;
    
    // Salva i token nel localStorage
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    
    // Imposta l'header di autorizzazione
    axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
    
    console.log('Login automatico completato con successo');
    return true;
  } catch (error) {
    console.error('Errore durante il login automatico:', error);
    return false;
  }
};

// Verifica se l'utente è autenticato e in caso contrario effettua l'accesso
export const ensureAuthenticated = async () => {
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    console.log('Nessun token trovato, tentativo di login...');
    return await loginUser();
  }
  
  // Imposta l'header di autorizzazione se esiste un token
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
  return true;
};
