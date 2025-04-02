// Script di auto-login che verrà incluso nella pagina HTML principale
(function() {
  // Funzione per effettuare il login e salvare i token
  async function performAutoLogin() {
    try {
      // Controlla se abbiamo già un token valido
      const token = localStorage.getItem('access_token');
      if (token) {
        console.log('Token esistente trovato, verifica validità...');
        return;
      }
      
      console.log('Esecuzione auto-login...');
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
      
      if (!response.ok) {
        throw new Error('Risposta API non valida: ' + response.status);
      }
      
      const data = await response.json();
      
      if (data.access && data.refresh) {
        // Salva i token nel localStorage
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        
        console.log('Auto-login completato con successo! Token salvati.');
        
        // Ricarica la pagina per applicare i nuovi token
        //window.location.reload();
      } else {
        console.error('Token non ricevuti nella risposta:', data);
      }
    } catch (error) {
      console.error('Errore durante l\'auto-login:', error);
    }
  }
  
  // Esegui l'auto-login dopo un breve ritardo per consentire il caricamento della pagina
  setTimeout(performAutoLogin, 1000);
})();
