// Script per verificare quali URL dell'API sono disponibili
(function() {
  // Array di possibili URL da testare
  const urlsToTest = [
    '/api/insurance/',
    '/api/insurance/insurance/',
    '/api/insurance/policies/',
    '/api/insurance-policies/',
    '/api/policies/',
    '/api/insurance/insurance-policies/'
  ];
  
  console.log('Inizio test degli URL...');
  
  // Token per l'autenticazione
  const accessToken = localStorage.getItem('access_token');
  
  if (!accessToken) {
    console.error('Token di accesso non trovato nel localStorage!');
    return;
  }
  
  // Funzione per testare un URL
  function testUrl(url) {
    return axios.get(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })
    .then(response => {
      console.log(`✅ URL ${url} è valido:`, response.status);
      return { url, valid: true, status: response.status, data: response.data };
    })
    .catch(error => {
      console.log(`❌ URL ${url} non è valido:`, error.response ? error.response.status : error.message);
      return { url, valid: false, status: error.response ? error.response.status : null, error: error.message };
    });
  }
  
  // Test di tutti gli URL
  Promise.all(urlsToTest.map(testUrl))
    .then(results => {
      console.log('==== RISULTATI DEI TEST ====');
      const validUrls = results.filter(r => r.valid);
      
      if (validUrls.length > 0) {
        console.log('URL validi trovati:');
        validUrls.forEach(r => console.log(`- ${r.url} (status: ${r.status})`));
      } else {
        console.log('Nessun URL valido trovato tra quelli testati.');
      }
      
      console.log('\nProvare a usare uno degli URL validi per la creazione della polizza.');
    });
})();

// Istruzioni:
// 1. Copia questo script nella console del browser
// 2. Premi invio per eseguirlo
// 3. Controlla i risultati per vedere quali URL sono validi
