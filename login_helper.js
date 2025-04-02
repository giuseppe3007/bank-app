// Script per effettuare l'accesso automatico
const loginData = {
  username: 'admin',
  password: 'bankapp2024'
};

// Salva i token direttamente nel localStorage
localStorage.setItem('username', 'admin');
localStorage.setItem('access_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzQzNDk4MDM1LCJpYXQiOjE3NDM0OTQ0MzUsImp0aSI6IjE1NzFiYzU4NTQ5YTQzZThhN2FlMGJjODY3NGQ3N2I5IiwidXNlcl9pZCI6MX0.3UHxgmkWxMLZfs5DanaJV5o0psLMi5ltn_uszsuz974');
localStorage.setItem('refresh_token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIsImV4cCI6MTc0MzU4MDgzNSwiaWF0IjoxNzQzNDk0NDM1LCJqdGkiOiJjZDc5YzUxNzE0YjY0NTY1YmZkN2QwNDMxOGJmNDZmYiIsInVzZXJfaWQiOjF9.vp4vpMlXb5vRm9tEHa8PPnwdLqsQWhXWRtb1wSXnkBE');

// Mostra lo stato attuale
console.log('Token salvati, verifica il localStorage.');
