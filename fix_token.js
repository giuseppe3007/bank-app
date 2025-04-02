// Script per correggere i token di autenticazione e verificare che funzionino correttamente
(function() {
  // Token presi da login_helper.js
  const accessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzNDk4MDM1LCJpYXQiOjE3NDM0OTQ0MzUsImp0aSI6IjE1NzFiYzU4NTQ5YTQzZThhN2FlMGJjODY3NGQ3N2I5IiwidXNlcl9pZCI6MX0.3UHxgmkWxMLZfs5DanaJV5o0psLMi5ltn_uszsuz974';
  const refreshToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0MzU4MDgzNSwiaWF0IjoxNzQzNDk0NDM1LCJqdGkiOiJjZDc5YzUxNzE0YjY0NTY1YmZkN2QwNDMxOGJmNDZmYiIsInVzZXJfaWQiOjF9.vp4vpMlXb5vRm9tEHa8PPnwdLqsQWhXWRtb1wSXnkBE';

  // Salva i token nel localStorage
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
  console.log('Token di accesso salvato:', accessToken.substring(0, 15) + '...');
  
  // Verifica se axios è disponibile globalmente
  if (typeof axios !== 'undefined') {
    axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    console.log('Header di autorizzazione impostato per axios');
    
    // Test di una chiamata API
    axios.get('/api/current-user/')
      .then(response => {
        console.log('✅ API test riuscito!', response.data);
        alert('API test riuscito! UserID: ' + response.data.id);
      })
      .catch(error => {
        console.error('❌ API test fallito:', error);
        alert('API test fallito: ' + (error.response?.data?.detail || error.message));
      });
  } else {
    console.error('❌ axios non è disponibile globalmente. Assicurati di essere sulla pagina dell\'applicazione.');
    alert('axios non disponibile. Assicurati di essere sulla pagina dell\'applicazione e prova a ricaricarla.');
  }
})();

// Istruzioni per l'uso:
// 1. Apri la console del browser (F12)
// 2. Copia e incolla tutto questo script nella console
// 3. Premi Invio per eseguirlo
// 4. Verifica che il test API abbia successo
// 5. Prova nuovamente a sottoscrivere una polizza
