// Script per autenticare l'utente manualmente
async function authenticateUser() {
  try {
    console.log('Tentativo di autenticazione...');
    const response = await fetch('http://localhost:8000/api/token/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'bankapp2024'
      })
    });
    
    const data = await response.json();
    
    if (data.access && data.refresh) {
      // Salva i token nel localStorage
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      console.log('Autenticazione completata con successo!');
      console.log('Ricarica ora la pagina per accedere ai tuoi conti.');
      
      return true;
    } else {
      console.error('Token non ricevuti nella risposta:', data);
      return false;
    }
  } catch (error) {
    console.error('Errore durante l\'autenticazione:', error);
    return false;
  }
}

// Esegui l'autenticazione
authenticateUser();
