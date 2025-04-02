import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  CircularProgress,
  FormHelperText,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Chip,
  Fade,
  Zoom,
  useTheme,
  Avatar
} from '@mui/material';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import EuroIcon from '@mui/icons-material/Euro';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentsIcon from '@mui/icons-material/Payments';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

const NewTransaction: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const transactionTypeFromQuery = queryParams.get('type') || 'deposit';
  const theme = useTheme();
  
  const [formData, setFormData] = useState({
    transaction_type: transactionTypeFromQuery,
    amount: '',
    description: '',
    destination_account: ''
  });
  
  const [account, setAccount] = useState<Account | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  // Determina il colore in base al tipo di transazione - usando useMemo per evitare ricalcoli inutili
  const transactionColor = useMemo(() => {
    switch (formData.transaction_type) {
      case 'deposit':
        return { main: theme.palette.success.main, light: theme.palette.success.light };
      case 'withdraw':
        return { main: theme.palette.error.main, light: theme.palette.error.light };
      case 'transfer':
        return { main: theme.palette.info.main, light: theme.palette.info.light };
      default:
        return { main: theme.palette.primary.main, light: theme.palette.primary.light };
    }
  }, [formData.transaction_type, theme.palette]);
  
  // Restituisce l'icona appropriata per il tipo di transazione
  const getTransactionIcon = () => {
    switch (formData.transaction_type) {
      case 'deposit':
        return <ArrowUpwardIcon fontSize="large" />;
      case 'withdraw':
        return <ArrowDownwardIcon fontSize="large" />;
      case 'transfer':
        return <SwapHorizIcon fontSize="large" />;
      default:
        return <PaymentsIcon fontSize="large" />;
    }
  };

  // Fetch account details and available accounts for transfer
  useEffect(() => {
    const fetchAccountDetails = async () => {
      try {
        setLoading(true);
        // Utilizziamo la struttura corretta dell'URL come configurato nel router
        const response = await axios.get(`/api/accounts/${id}/`);
        setAccount(response.data);
      } catch (err) {
        console.error('Error fetching account details:', err);
      } finally {
        setLoading(false);
      }
    };

    const fetchAccounts = async () => {
      if (formData.transaction_type === 'transfer') {
        try {
          setLoadingAccounts(true);
          // Utilizziamo la struttura corretta dell'URL come configurato nel router
          const response = await axios.get('/api/accounts/');
          const filteredAccounts = (response.data.results || response.data)
            .filter((acc: Account) => acc.id !== Number(id));
          setAccounts(filteredAccounts);
        } catch (err) {
          console.error('Error fetching accounts:', err);
        } finally {
          setLoadingAccounts(false);
        }
      }
    };

    if (id) {
      fetchAccountDetails();
    }
    
    fetchAccounts();
  }, [id, formData.transaction_type]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      errors.amount = "L'importo deve essere positivo";
    }

    if (formData.transaction_type === 'withdraw' && account && parseFloat(formData.amount) > account.balance) {
      errors.amount = "Fondi insufficienti per il prelievo";
    }
    
    if (formData.transaction_type === 'transfer' && !formData.destination_account) {
      errors.destination_account = "Seleziona un conto di destinazione";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestore per campi di testo e numerici
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Per i campi numerici, assicuriamoci che siano validi
    if (name === 'amount') {
      // Accetta solo numeri positivi con massimo 2 decimali
      if (/^\d*\.?\d{0,2}$/.test(value) || value === '') {
        setFormData({
          ...formData,
          [name]: value
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gestore separato per i componenti Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const getTransactionTitle = () => {
    switch (formData.transaction_type) {
      case 'deposit':
        return 'Nuova Entrata';
      case 'withdraw':
        return 'Nuova Uscita';
      case 'transfer':
        return 'Nuovo Trasferimento';
      default:
        return 'Nuova Transazione';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      let response;
      
      // Convertiamo esplicitamente l'importo in string per evitare problemi di tipo
      // come menzionato nei memories e ci assicuriamo che sia una stringa valida
      // Utilizziamo una rappresentazione stringa diretta per evitare errori di conversione
      const amountValue = parseFloat(formData.amount);
      // Formattiamo il numero come stringa esatta per garantire compatibilità con Decimal in Python
      const amount = formData.amount;
      
      // Verifichiamo che l'importo sia valido
      if (isNaN(amountValue) || amountValue <= 0) {
        setError("L'importo deve essere un numero positivo");
        setLoading(false);
        return;
      }
      
      switch (formData.transaction_type) {
        case 'deposit':
          // Utilizziamo la struttura corretta dell'URL come configurato nel router
          response = await axios.post(`/api/accounts/${id}/deposit/`, {
            amount: amount.toString(),
            description: formData.description || `Entrata sul conto`
          });
          break;
        case 'withdraw':
          // Utilizziamo la struttura corretta dell'URL come configurato nel router
          // Ci assicuriamo che l'importo sia gestito correttamente
          response = await axios.post(`/api/accounts/${id}/withdraw/`, {
            amount: amount,
            description: formData.description || `Uscita dal conto`
          });
          break;
        case 'transfer':
          // Utilizziamo la struttura corretta dell'URL come configurato nel router
          response = await axios.post(`/api/accounts/${id}/transfer/`, {
            destination_account: formData.destination_account,
            amount: amount.toString(),
            description: formData.description || `Trasferimento tra conti`
          });
          break;
      }
      
      setSuccess('Transazione completata con successo!');
      
      // Reindirizza alla pagina di dettaglio del conto dopo un breve ritardo
      setTimeout(() => {
        navigate(`/accounts/${id}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error processing transaction:', err);
      setError(
        err.response?.data?.message || 
        err.response?.data?.detail || 
        'Si è verificato un errore durante l\'elaborazione della transazione. Riprova.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          {getTransactionTitle()}
        </Typography>
        <Button
          variant="outlined"
          onClick={() => navigate(`/accounts/${id}`)}
          startIcon={<ArrowBackIcon />}
        >
          Torna al conto
        </Button>
      </Box>

      {account && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Conto: {account.account_number} | Saldo attuale: €{parseFloat(account.balance.toString()).toFixed(2)}
        </Alert>
      )}
      
      <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', borderRadius: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            {success}
          </Alert>
        )}
        
        <Zoom in={true} timeout={300}>
          <Card variant="outlined" sx={{ mb: 3, bgcolor: transactionColor.light + '20', borderColor: transactionColor.main }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: transactionColor.main }}>
                  {getTransactionIcon()}
                </Avatar>
              }
              title={getTransactionTitle()}
              subheader={`Operazione sul conto ${account?.account_number || ''}`}
              sx={{ borderBottom: `1px solid ${transactionColor.light}` }}
            />
          </Card>
        </Zoom>
        
        <Box component="form" onSubmit={handleSubmit} noValidate>
          <FormControl fullWidth sx={{ mb: 3 }}>
            <InputLabel id="transaction-type-label">Tipo di Transazione</InputLabel>
            <Select
              labelId="transaction-type-label"
              id="transaction_type"
              name="transaction_type"
              value={formData.transaction_type}
              label="Tipo di Transazione"
              onChange={handleSelectChange}
              disabled={loading}
              sx={{
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: transactionColor.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: transactionColor.main,
                },
              }}
            >
              <MenuItem value="deposit">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowUpwardIcon sx={{ color: theme.palette.success.main, mr: 1 }} />
                  Entrata
                </Box>
              </MenuItem>
              <MenuItem value="withdraw">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ArrowDownwardIcon sx={{ color: theme.palette.error.main, mr: 1 }} />
                  Uscita
                </Box>
              </MenuItem>
              <MenuItem value="transfer">
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SwapHorizIcon sx={{ color: theme.palette.info.main, mr: 1 }} />
                  Trasferimento
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
          
          {formData.transaction_type === 'transfer' && (
            <Fade in={true} timeout={500}>
              <FormControl 
                fullWidth 
                sx={{ 
                  mb: 3,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: transactionColor.main,
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: transactionColor.main,
                  },
                }} 
                error={!!formErrors.destination_account}
                disabled={loading || loadingAccounts}
              >
                <InputLabel id="destination-account-label">Conto di Destinazione</InputLabel>
                <Select
                  labelId="destination-account-label"
                  id="destination_account"
                  name="destination_account"
                  value={formData.destination_account}
                  label="Conto di Destinazione"
                  onChange={handleSelectChange}
                >
                  {loadingAccounts ? (
                    <MenuItem disabled>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                        Caricamento conti...
                      </Box>
                    </MenuItem>
                  ) : accounts.length === 0 ? (
                    <MenuItem disabled>Nessun altro conto disponibile</MenuItem>
                  ) : (
                    accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.account_number}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                          <Typography fontWeight="medium">{acc.account_number}</Typography>
                          <Chip 
                            label={acc.account_type} 
                            size="small" 
                            variant="outlined"
                            sx={{ ml: 2 }}
                          />
                        </Box>
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formErrors.destination_account && (
                  <FormHelperText>{formErrors.destination_account}</FormHelperText>
                )}
              </FormControl>
            </Fade>
          )}
          
          <Box sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: transactionColor.light + '30',
            borderRadius: 2,
            border: `1px dashed ${transactionColor.main}`,
            boxShadow: `0 4px 12px ${transactionColor.light}60`,
          }}>
            <Typography 
              variant="h6" 
              fontWeight="600" 
              sx={{ 
                mb: 2, 
                display: 'flex', 
                alignItems: 'center',
                color: transactionColor.main,
                letterSpacing: '0.5px',
              }}
            >
              <Avatar sx={{ bgcolor: transactionColor.main, mr: 1.5, width: 32, height: 32 }}>
                <EuroIcon fontSize="small" />
              </Avatar>
              Importo Operazione
            </Typography>
            <TextField
              required
              fullWidth
              id="amount"
              label={formData.transaction_type === 'deposit' ? 'Importo in entrata' : 
                    formData.transaction_type === 'withdraw' ? 'Importo in uscita' : 
                    'Importo da trasferire'}
              name="amount"
              value={formData.amount}
              onChange={handleTextFieldChange}
              disabled={loading}
              error={!!formErrors.amount}
              helperText={formErrors.amount}
              variant="outlined"
              placeholder="0.00"
              InputProps={{
                startAdornment: <InputAdornment position="start">
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: transactionColor.main, 
                      fontWeight: 'bold',
                      mr: 0.5
                    }}
                  >
                    €
                  </Typography>
                </InputAdornment>,
              }}
              sx={{ 
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2,
                  fontSize: '1.1rem',
                  fontWeight: 500,
                  '& fieldset': {
                    borderColor: transactionColor.main,
                    borderWidth: 2,
                  },
                  '&:hover fieldset': {
                    borderColor: transactionColor.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: transactionColor.main,
                  },
                },
                '& .MuiInputLabel-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: transactionColor.main,
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: transactionColor.main,
                },
              }}
            />
          </Box>
                  
          <Box sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: '#f8f9fa',
            borderRadius: 2,
            border: '1px solid #e9ecef',
          }}>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <ReceiptIcon sx={{ mr: 1 }} />
              Dettagli Operazione
            </Typography>
            <TextField
              fullWidth
              id="description"
              label="Descrizione"
              name="description"
              value={formData.description}
              onChange={handleTextFieldChange}
              disabled={loading}
              variant="outlined"
              placeholder={`Inserisci una descrizione per ${getTransactionTitle().toLowerCase()}`}
              sx={{ 
                mb: 0,
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                },
              }}
            />
          </Box>
          
          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/accounts/${id}`)}
              disabled={loading}
              sx={{ 
                borderRadius: 28, 
                px: 3,
                borderColor: transactionColor.main,
                color: transactionColor.main,
                '&:hover': {
                  borderColor: transactionColor.main,
                  backgroundColor: transactionColor.light,
                },
              }}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              sx={{ 
                borderRadius: 28, 
                px: 4,
                backgroundColor: transactionColor.main,
                '&:hover': {
                  backgroundColor: transactionColor.main,
                  opacity: 0.9,
                },
              }}
            >
              {loading ? 
                <CircularProgress size={24} color="inherit" /> : 
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleIcon sx={{ mr: 1 }} />
                  Conferma {formData.transaction_type === 'deposit' ? 'Entrata' : 
                          formData.transaction_type === 'withdraw' ? 'Uscita' : 'Trasferimento'}
                </Box>
              }
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default NewTransaction;
