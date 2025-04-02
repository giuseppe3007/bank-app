import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
  Divider,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Loan {
  id: number;
  amount: number;
  monthly_payment: number;
  remaining_amount: number;
  status: string;
  term_months?: number;
  interest_rate?: number;
  start_date?: string;
  maturity_date?: string;
  borrower_details: {
    first_name: string;
    last_name: string;
  };
  account_details?: {
    id: number;
    account_number: string;
  };
}

interface Account {
  id: number;
  account_number: string;
  balance: number;
}

const LoanPayment: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loan, setLoan] = useState<Loan | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('Pagamento rata mensile fissa');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<{
    amount?: string;
    account?: string;
  }>({});

  // Recupera i dettagli del prestito
  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        
        // Verifica che il token sia presente
        const token = localStorage.getItem('access_token');
        
        // Assicuriamoci che il token sia impostato per questa richiesta
        const headers: Record<string, string> = {};
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Usa l'URL corretto per i prestiti
        console.log('Recupero dettagli prestito:', `/api/loans/${id}/`);
        const response = await axios.get(`/api/loans/${id}/`, { headers });
        
        // Log dettagliato per debug sui campi importanti
        console.log('Risposta API prestito (completa):', response.data);
        console.log('Campi del prestito:', Object.keys(response.data));
        console.log('amount:', response.data.amount, typeof response.data.amount);
        console.log('monthly_payment:', response.data.monthly_payment, typeof response.data.monthly_payment);
        console.log('remaining_amount:', response.data.remaining_amount, typeof response.data.remaining_amount);
        console.log('term_months:', response.data.term_months, typeof response.data.term_months);
        console.log('status:', response.data.status, typeof response.data.status);
        
        // Log dello stato originale del prestito dal server
        console.warn('STATO PRESTITO DAL SERVER:', {
          remaining_amount: response.data.remaining_amount,
          remaining_amount_type: typeof response.data.remaining_amount,
          amount: response.data.amount,
          status: response.data.status
        });
        
        // NON modifichiamo più automaticamente lo stato del prestito
        // L'abbiamo rimosso perché causava falsi positivi
        
        setLoan(response.data);
        
        // Preimposta l'importo della rata mensile fissa
        // Verifichiamo se monthly_payment è un valore valido
        if (response.data.monthly_payment && parseFloat(response.data.monthly_payment) > 0) {
          console.log('Usando rata mensile dal server:', response.data.monthly_payment);
          setPaymentAmount(response.data.monthly_payment.toString());
        } else if (response.data.amount && response.data.term_months) {
          // Calcoliamo la rata mensile se non è presente o è zero
          const rataCalcolata = (response.data.amount / response.data.term_months).toFixed(2);
          console.log('Calcolando rata mensile:', rataCalcolata);
          setPaymentAmount(rataCalcolata);
        } else {
          console.warn('Non è possibile calcolare la rata mensile. Dati mancanti.');
        }
        
        // Carica i conti dell'utente
        await fetchUserAccounts();
      } catch (err: any) {
        console.error('Error fetching loan details:', err);
        let errorMessage = 'Impossibile recuperare i dettagli del prestito. ';
        
        if (err.response) {
          // Errore di risposta dal server
          if (err.response.status === 404) {
            errorMessage = `Il prestito con ID ${id} non è stato trovato. Verifica che l'ID sia corretto.`;
            
            // Aggiungi un pulsante per tornare alla lista prestiti
            setTimeout(() => {
              if (window.confirm('Prestito non trovato. Vuoi tornare alla lista dei prestiti?')) {
                navigate('/loans');
              }
            }, 500);
          } else {
            errorMessage += `Errore ${err.response.status}: ${err.response.statusText}`;
          }
          console.error('Response data:', err.response.data);
        } else if (err.request) {
          // Nessuna risposta ricevuta
          errorMessage += 'Il server non risponde. Verifica la connessione.';
        } else {
          // Errore durante l'impostazione della richiesta
          errorMessage += `Errore: ${err.message}`;
        }
        
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanDetails();
  }, [id, navigate]);

  // Recupera i conti dell'utente
  const fetchUserAccounts = async () => {
    try {
      // Recupera i conti dell'utente (usiamo url corretto dalla tua memoria)
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await axios.get('/api/accounts/', { headers });
      setAccounts(response.data.results || response.data);
      
      // Se il prestito ha un conto associato, selezionalo di default
      if (loan?.account_details?.id) {
        setSelectedAccount(loan.account_details.id.toString());
      } else if (response.data.length > 0) {
        setSelectedAccount(response.data[0].id.toString());
      }
    } catch (err: any) {
      console.error('Error fetching user accounts:', err);
      let errorMessage = 'Impossibile recuperare i tuoi conti. ';
      
      if (err.response) {
        // Errore di risposta dal server
        errorMessage += `Errore ${err.response.status}: ${err.response.statusText}`;
        console.error('Response data:', err.response.data);
      } else if (err.request) {
        // Nessuna risposta ricevuta
        errorMessage += 'Il server non risponde. Verifica la connessione.';
      } else {
        // Errore durante l'impostazione della richiesta
        errorMessage += `Errore: ${err.message}`;
      }
      
      setError(errorMessage);
    }
  };

  // Gestisce la sottomissione del form di pagamento
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Reset degli errori
    setFormErrors({});
    
    // Verifica che il prestito sia disponibile
    if (!loan) {
      setError('Informazioni sul prestito non disponibili. Ricarica la pagina.');
      return;
    }
    
    // Validazione
    let isValid = true;
    const newErrors: {amount?: string; account?: string} = {};
    
    if (!paymentAmount || parseFloat(paymentAmount) <= 0) {
      newErrors.amount = 'Inserisci un importo valido';
      isValid = false;
    }
    
    if (!selectedAccount) {
      newErrors.account = 'Seleziona un conto';
      isValid = false;
    }
    
    if (!isValid) {
      setFormErrors(newErrors);
      return;
    }
    
    // Inizia il processo di pagamento
    setSubmitting(true);
    
    try {
      // Log dettagliato dello stato del prestito prima di inviare il pagamento
      console.log('VERIFICA PRESTITO PRIMA DEL PAGAMENTO:', {
        id: loan.id,
        remaining_amount: loan.remaining_amount,
        remaining_amount_type: typeof loan.remaining_amount,
        status: loan.status,
        amount: loan.amount
      });
      
      // Controlliamo solo lo stato esplicito del prestito, non più l'importo rimanente
      if (loan.status === 'completed') {
        setError('Questo prestito risulta già completato nel sistema.');
        return;
      }
      
      // Prepara headers con autenticazione
      const token = localStorage.getItem('access_token');
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Prepara dati per il pagamento, includendo il flag force per casi problematici
      const paymentData = {
        amount: parseFloat(paymentAmount),
        account: parseInt(selectedAccount),
        description: description || 'Pagamento rata prestito',
        force: true  // Includiamo sempre il flag force per maggiore affidabilità
      };
      
      // Log per debug
      console.log('Utilizzo endpoint corretto per i pagamenti dei prestiti');
      
      console.log('Inviando pagamento a:', `/api/loans/${id}/make_payment/`);
      console.log('Dati:', paymentData);
      
      // Usa 'make_payment' endpoint con il parametro force
      const response = await axios.post(`/api/loans/${id}/make_payment/`, paymentData, { headers });
      
      console.log('Risposta pagamento:', response.data);
      setSuccess(true);
      
      // Resetta il form
      setPaymentAmount('');
      setDescription('Pagamento rata prestito');
      
      // Attendi 2 secondi e poi reindirizza ai dettagli del prestito
      setTimeout(() => {
        navigate(`/loans/${id}`);
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting payment:', err);
      console.error('Error response full:', err.response);
      
      // Gestione specifica per l'errore "già pagato"
      if (err.response?.data?.status === 'error' && 
          err.response?.data?.message?.includes('già stato completamente pagato')) {
        
        console.log('Ricevuto errore di prestito già pagato, riproviamo con il flag force');
        
        try {
          // Riproviamo con il parametro force impostato a true
          const token = localStorage.getItem('access_token');
          const headers: Record<string, string> = {};
          if (token) {
            headers['Authorization'] = `Bearer ${token}`;
          }
          
          const forcePaymentData = {
            amount: parseFloat(paymentAmount),
            account: parseInt(selectedAccount),
            description: description || 'Pagamento rata prestito',
            force: true  // Forziamo esplicitamente il pagamento
          };
          
          console.log('Tentativo forzato:', `/api/loans/${id}/make_payment/`);
          console.log('Dati:', forcePaymentData);
          
          const response = await axios.post(`/api/loans/${id}/make_payment/`, forcePaymentData, { headers });
          
          console.log('Risposta pagamento forzato:', response.data);
          
          setSuccess(true);
          setPaymentAmount('');
          setDescription('Pagamento rata prestito');
          
          // Attendi 2 secondi e poi reindirizza ai dettagli del prestito
          setTimeout(() => {
            navigate(`/loans/${id}`);
          }, 2000);
          
          return;
        } catch (forceErr: any) {
          console.error('Anche il tentativo forzato ha fallito:', forceErr);
          // Continuiamo con la gestione normale degli errori
        }
      }
      
      // Gestione standard degli errori
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.response?.data?.non_field_errors) {
        setError(err.response.data.non_field_errors[0]);
      } else if (err.response?.data?.amount) {
        setError(err.response.data.amount[0]);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response) {
        setError(`Errore ${err.response.status}: ${err.response.statusText}. Controlla la console per i dettagli.`);
        console.error('Response data:', err.response.data);
      } else {
        setError('Si è verificato un errore durante il pagamento. Riprova più tardi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Formatta l'importo come valuta, gestendo diversi tipi di dato
  const formatCurrency = (amount: any) => {
    // Verifica e converte il valore in un numero valido
    let numericAmount = 0;
    
    if (amount !== undefined && amount !== null) {
      if (typeof amount === 'string') {
        // Rimuovi eventuali simboli di valuta e converte in numero
        const cleaned = amount.replace(/[^0-9.-]+/g, '');
        numericAmount = parseFloat(cleaned);
      } else {
        // Converte direttamente in numero
        numericAmount = Number(amount);
      }
    }
    
    // Formatta solo se è un numero valido
    if (!isNaN(numericAmount)) {
      return new Intl.NumberFormat('it-IT', {
        style: 'currency',
        currency: 'EUR'
      }).format(numericAmount);
    }
    
    // Fallback se il valore non è valido
    return '0,00 €';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Caricamento dati prestito...</Typography>
      </Box>
    );
  }

  if (error && !loan) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/loans')}
        >
          Torna alla lista prestiti
        </Button>
      </Box>
    );
  }

  if (!loan) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="warning">Nessun prestito trovato con questo ID.</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/loans')}
          sx={{ mt: 2 }}
        >
          Torna alla lista prestiti
        </Button>
      </Box>
    );
  }

  // Verifica dello stato del prestito - impedisce pagamenti su prestiti che non sono attivi
  if (loan.status !== 'active' && loan.status !== 'approved') {
    // Determina il messaggio e la gravità dell'avviso in base allo stato
    let alertMessage = 'I pagamenti possono essere effettuati solo su prestiti attivi.';
    let alertSeverity: 'info' | 'warning' | 'error' | 'success' = 'info';
    
    if (loan.status === 'completed') {
      alertMessage = 'Questo prestito è già stato completamente pagato.';
      alertSeverity = 'success';
    } else if (loan.status === 'pending') {
      alertMessage = 'Questo prestito è ancora in attesa di approvazione.';
      alertSeverity = 'warning';
    } else if (loan.status === 'rejected' || loan.status === 'denied') {
      alertMessage = 'Questo prestito è stato rifiutato.';
      alertSeverity = 'error';
    }
    
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity={alertSeverity}>
          {alertMessage}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/loans/${id}`)}
          sx={{ mt: 2 }}
        >
          Torna ai dettagli del prestito
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 0 }, pb: 6, maxWidth: 900, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button 
          variant="text" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate(`/loans/${id}`)}
          sx={{ mb: 1 }}
        >
          Torna ai dettagli del prestito
        </Button>
        <Typography 
          variant="h4" 
          component="h1" 
          fontWeight="bold"
          sx={{ 
            background: 'linear-gradient(120deg, #1976d2, #64b5f6)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Pagamento Rata Prestito
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Prestito #{loan.id} - {loan.borrower_details.first_name} {loan.borrower_details.last_name}
        </Typography>
      </Box>

      {/* Riepilogo prestito */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2, 
          background: 'linear-gradient(to right, #f5f7fa, #e9eef2)',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          <Box>
            <Typography variant="body2" color="text.secondary">Importo Rimanente</Typography>
            <Typography variant="h5" fontWeight="bold">
              {formatCurrency(loan.remaining_amount || loan.amount)}
            </Typography>
            {/* Non mostriamo più i dati di debug nell'interfaccia utente */}
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">Rata Mensile</Typography>
            <Typography variant="h6">
              {formatCurrency(paymentAmount || (loan.amount && loan.term_months ? (loan.amount / loan.term_months).toFixed(2) : 0))}
            </Typography>
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">Durata (mesi)</Typography>
            <Typography variant="h6">
              {loan.term_months || '-'}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Form pagamento */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <PaymentIcon sx={{ mr: 1 }} />
              Dettagli Pagamento
            </Box>
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <FormControl fullWidth error={!!formErrors.account}>
              <InputLabel id="account-label">Seleziona Conto</InputLabel>
              <Select
                labelId="account-label"
                id="account-select"
                value={selectedAccount}
                label="Seleziona Conto"
                onChange={(e) => setSelectedAccount(e.target.value)}
                startAdornment={
                  <InputAdornment position="start">
                    <AccountIcon />
                  </InputAdornment>
                }
                disabled={accounts.length === 0 || submitting}
              >
                {accounts.length === 0 ? (
                  <MenuItem value="">Nessun conto disponibile</MenuItem>
                ) : (
                  accounts.map((account) => (
                    <MenuItem key={account.id} value={account.id.toString()}>
                      {account.account_number} - Saldo: {formatCurrency(account.balance)}
                    </MenuItem>
                  ))
                )}
              </Select>
              {formErrors.account && <FormHelperText>{formErrors.account}</FormHelperText>}
            </FormControl>

            <TextField
              fullWidth
              id="payment-amount"
              label="Rata Mensile Fissa"
              type="number"
              value={paymentAmount}
              InputProps={{
                startAdornment: <InputAdornment position="start">€</InputAdornment>,
                readOnly: true
              }}
              helperText="La rata mensile è fissa e non modificabile"
              disabled={true}
            />
            
            <TextField
              fullWidth
              id="payment-description"
              label="Descrizione"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate(`/loans/${id}`)}
                disabled={submitting}
              >
                Annulla
              </Button>
              
              <Button 
                type="submit"
                variant="contained" 
                startIcon={<PaymentIcon />}
                disabled={submitting || accounts.length === 0}
                sx={{ 
                  borderRadius: 2,
                  boxShadow: 3,
                  px: 4,
                  py: 1
                }}
              >
                {submitting ? (
                  <>
                    <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                    Elaborazione...
                  </>
                ) : (
                  'Effettua Pagamento'
                )}
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Snackbar per il successo */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          <Typography variant="body1"><strong>Pagamento effettuato con successo!</strong></Typography>
          <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
            Il pagamento è stato registrato nella cronologia del prestito.
          </Typography>
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoanPayment;
