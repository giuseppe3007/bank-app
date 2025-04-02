import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  CircularProgress,
  Alert,
  Grid,
  FormHelperText,
  Slider,
  Divider,
  Card,
  CardContent,
  CardHeader,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Tooltip,
  Container
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Paid as PaidIcon,
  RequestQuote as RequestQuoteIcon,
  Description as DescriptionIcon,
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
  Info as InfoIcon,
  Percent as PercentIcon,
  ReceiptLong as ReceiptIcon
} from '@mui/icons-material';

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

const NewLoan: React.FC = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    amount: '',
    purpose: '',
    term_months: 24,
    destination_account: '',
    loan_type: 'personal'
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [interestRate, setInterestRate] = useState<number>(4.5);
  const [monthlyPayment, setMonthlyPayment] = useState<number | null>(null);
  const [totalPayment, setTotalPayment] = useState<number | null>(null);

  // Caricamento degli account disponibili
  const { isAuthenticated, autoLogin } = useAuth();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        console.log('Recupero conti...');
        
        // Assicuriamoci che axios abbia il baseURL e l'header di autorizzazione corretti
        axios.defaults.baseURL = 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        
        // Se non abbiamo un token, facciamo login manualmente
        if (!token) {
          console.log('Nessun token trovato, eseguo login manuale...');
          try {
            const loginResponse = await axios.post('http://localhost:8000/api/token/', {
              username: 'admin', 
              password: 'bankapp2024'
            });
            
            const { access, refresh } = loginResponse.data;
            localStorage.setItem('access_token', access);
            localStorage.setItem('refresh_token', refresh);
            axios.defaults.headers.common['Authorization'] = `Bearer ${access}`;
            console.log('Login manuale completato');
          } catch (loginErr) {
            console.error('Errore nel login manuale:', loginErr);
            throw new Error('Autenticazione fallita');
          }
        } else {
          // Utilizza il token esistente
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        
        // Recupera i conti con il token configurato
        const response = await axios.get('http://localhost:8000/api/accounts/');
        console.log('Accounts response:', response.data);
        
        // Assicuriamoci di gestire correttamente la risposta
        const accountsData = response.data.results || response.data || [];
        console.log('Processed accounts data:', accountsData);
        
        setAccounts(accountsData);
      } catch (err) {
        console.error('Error fetching accounts:', err);
        setError('Errore nel recupero dei conti disponibili. Riprova dopo aver effettuato nuovamente l\'accesso.');
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Calcolo della rata mensile quando cambiano importo, tasso o durata
  useEffect(() => {
    if (formData.amount) {
      // Calcolo del tasso d'interesse basato sull'importo (puramente dimostrativo)
      const amount = parseFloat(formData.amount.toString());
      let newRate = 4.5; // Tasso base
      
      if (amount > 10000) {
        newRate = 4.0;
      }
      if (amount > 30000) {
        newRate = 3.75;
      }
      setInterestRate(newRate);
      
      // Calcolo della rata mensile
      const principal = amount;
      const ratePerMonth = newRate / 100 / 12;
      const numberOfPayments = formData.term_months;
      
      // Formula per calcolare la rata mensile
      const monthlyPayment = principal * (ratePerMonth * Math.pow(1 + ratePerMonth, numberOfPayments)) / 
                           (Math.pow(1 + ratePerMonth, numberOfPayments) - 1);
                           
      setMonthlyPayment(monthlyPayment);
      setTotalPayment(monthlyPayment * numberOfPayments);
    } else {
      setMonthlyPayment(null);
      setTotalPayment(null);
    }
  }, [formData.amount, formData.term_months]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.amount || parseFloat(formData.amount.toString()) <= 0) {
      errors.amount = "L'importo deve essere positivo";
    } else if (parseFloat(formData.amount.toString()) < 1000) {
      errors.amount = "L'importo minimo è di €1000";
    } else if (parseFloat(formData.amount.toString()) > 50000) {
      errors.amount = "L'importo massimo è di €50000";
    }
    
    if (!formData.purpose.trim()) {
      errors.purpose = "Lo scopo del prestito è obbligatorio";
    }
    
    if (!formData.destination_account) {
      errors.destination_account = "Seleziona un conto di destinazione";
    }
    
    if (!formData.loan_type) {
      errors.loan_type = "Seleziona un tipo di prestito";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    
    // Per i campi numerici, assicuriamoci che siano validi
    if (name === 'amount') {
      const stringValue = value as string;
      // Accetta solo numeri positivi con massimo 2 decimali
      if (/^\d*\.?\d{0,2}$/.test(stringValue) || stringValue === '') {
        setFormData({
          ...formData,
          [name]: stringValue
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Gestore specifico per i componenti Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSliderChange = (name: string) => (_: Event, value: number | number[]) => {
    // Assicuriamoci che il valore sia un numero singolo
    const numericValue = typeof value === 'number' ? value : value[0];
    setFormData({
      ...formData,
      [name]: numericValue
    });
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
      // Calcola la data di scadenza (maturity date) in base alla durata del prestito
      const startDate = new Date();
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + formData.term_months);
      
      // Formatta le date nel formato ISO 8601 (YYYY-MM-DD)
      const formattedStartDate = startDate.toISOString().split('T')[0];
      const formattedMaturityDate = maturityDate.toISOString().split('T')[0];
      
      console.log('Data inizio prestito:', formattedStartDate);
      console.log('Data scadenza prestito:', formattedMaturityDate);
      
      // Convertiamo esplicitamente i valori numerici in stringhe per evitare problemi di tipo
      // come menzionato nei memories
      const payload = {
        amount: formData.amount.toString(),
        purpose: formData.purpose,
        term_months: formData.term_months,
        interest_rate: interestRate.toString(),
        linked_account: parseInt(formData.destination_account), // Convertiamo in numero per assicurarci che sia un ID valido
        loan_type: formData.loan_type,
        borrower: 1,  // Impostiamo borrower all'ID utente corrente (admin ha ID 1)
        start_date: formattedStartDate,
        maturity_date: formattedMaturityDate  // Aggiungiamo la data di scadenza calcolata
      };
      
      // Chiamata API per richiedere un nuovo prestito
      const response = await axios.post('/api/loans/', payload);
      
      setSuccess('Richiesta di prestito inviata con successo! Sarà valutata dal nostro team.');
      
      // Reindirizza alla pagina dei prestiti dopo un breve ritardo
      setTimeout(() => {
        navigate('/loans');
      }, 2000);
      
    } catch (err: any) {
      console.error('Error requesting loan:', err);
      setError(
        err.response?.data?.detail || 
        err.response?.data?.message || 
        'Si è verificato un errore durante la richiesta del prestito. Riprova.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 5,
          gap: 2
        }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold"
            sx={{ 
              mb: 1,
              background: 'linear-gradient(120deg, #1565c0, #42a5f5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Richiedi un Nuovo Prestito
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Compila il modulo con i dettagli della tua richiesta di prestito
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => navigate('/loans')}
          startIcon={<ArrowBackIcon />}
          sx={{ 
            borderRadius: '28px', 
            px: 3,
            py: 1,
            textTransform: 'none',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            '&:hover': {
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }
          }}
        >
          Torna ai Prestiti
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' } }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: '16px', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
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
            
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                  sx={{
                    bgcolor: 'primary.light',
                    width: 48,
                    height: 48,
                    mr: 2,
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <RequestQuoteIcon />
                </Avatar>
                <Typography variant="h5" fontWeight="bold">
                  Dettagli del Prestito
                </Typography>
              </Box>
              <Divider sx={{ mb: 4 }} />
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                mb: 4,
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1, md: 2 }
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(25, 118, 210, 0.1)',
                    color: 'primary.main',
                    width: 40,
                    height: 40,
                    mt: { xs: 0, md: 2 }
                  }}
                >
                  <MoneyIcon />
                </Avatar>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="amount"
                  label="Importo Richiesto"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!formErrors.amount}
                  helperText={formErrors.amount}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">€</InputAdornment>,
                  }}
                  sx={{
                    mb: 0,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(25, 118, 210, 0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 'medium'
                    },
                    flex: 1
                  }}
                />
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                mb: 4,
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1, md: 2 }
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(245, 124, 0, 0.1)',
                    color: 'warning.main',
                    width: 40,
                    height: 40,
                    mt: { xs: 0, md: 2 }
                  }}
                >
                  <DescriptionIcon />
                </Avatar>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="purpose"
                  label="Scopo del Prestito"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  disabled={loading}
                  error={!!formErrors.purpose}
                  helperText={formErrors.purpose}
                  multiline
                  rows={3}
                  placeholder="Descrivi il motivo per cui stai richiedendo questo prestito..."
                  sx={{
                    mb: 0,
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&.Mui-focused': {
                        boxShadow: '0 0 0 3px rgba(245, 124, 0, 0.1)'
                      }
                    },
                    '& .MuiInputLabel-root': {
                      fontWeight: 'medium'
                    },
                    flex: 1
                  }}
                />
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                mb: 4,
                flexDirection: { xs: 'column', md: 'row' },
                gap: { xs: 1, md: 2 }
              }}>
                <Avatar
                  sx={{
                    bgcolor: 'rgba(46, 125, 50, 0.1)',
                    color: 'success.main',
                    width: 40,
                    height: 40,
                    mt: { xs: 0, md: 2 }
                  }}
                >
                  <CalendarIcon />
                </Avatar>
                
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle1" fontWeight="medium">
                      Durata del Prestito
                    </Typography>
                    <Typography 
                      variant="h6" 
                      sx={{
                        color: 'success.main',
                        fontWeight: 'bold',
                        bgcolor: 'rgba(46, 125, 50, 0.08)',
                        px: 2,
                        py: 0.5,
                        borderRadius: '20px',
                        minWidth: '80px',
                        textAlign: 'center'
                      }}
                    >
                      {formData.term_months} {formData.term_months === 1 ? 'mese' : 'mesi'}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    position: 'relative',
                    px: 1,
                    py: 4,
                    mt: 2,
                    mb: 1
                  }}>
                    {/* Timeline track */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      right: 0,
                      height: '8px',
                      bgcolor: 'rgba(46, 125, 50, 0.12)',
                      borderRadius: '4px',
                      transform: 'translateY(-50%)',
                      zIndex: 0
                    }} />
                    
                    {/* Timeline progress */}
                    <Box sx={{
                      position: 'absolute',
                      top: '50%',
                      left: 0,
                      width: `${((formData.term_months - 6) / (36 - 6)) * 100}%`,
                      height: '8px',
                      bgcolor: 'success.main',
                      borderRadius: '4px',
                      transform: 'translateY(-50%)',
                      transition: 'width 0.3s ease',
                      zIndex: 1
                    }} />
                    
                    {/* Timeline markers */}
                    {[6, 12, 18, 24, 30, 36].map((months, index) => {
                      const position = index / 5;
                      const isActive = formData.term_months >= months;
                      
                      return (
                        <Tooltip key={months} title={`${months} mesi`} arrow placement="top">
                          <Box
                            sx={{
                              position: 'absolute',
                              left: `calc(${position * 100}% - 12px)`,
                              top: '50%',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              bgcolor: isActive ? 'success.main' : 'white',
                              border: isActive ? 'none' : '2px solid',
                              borderColor: 'success.light',
                              transform: 'translateY(-50%)',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              boxShadow: isActive ? '0 3px 8px rgba(46, 125, 50, 0.25)' : 'none',
                              '&:hover': {
                                transform: 'translateY(-50%) scale(1.1)',
                                boxShadow: '0 4px 10px rgba(46, 125, 50, 0.3)'
                              }
                            }}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                term_months: months
                              });
                            }}
                          >
                            <Typography 
                              variant="caption" 
                              component="div"
                              sx={{ 
                                fontSize: '10px', 
                                fontWeight: 'bold',
                                color: isActive ? 'white' : 'success.main',
                                lineHeight: 1
                              }}
                            >
                              {months}
                            </Typography>
                          </Box>
                        </Tooltip>
                      );
                    })}
                    
                    <Slider
                      name="term_months"
                      value={formData.term_months}
                      onChange={handleSliderChange('term_months')}
                      min={6}
                      max={36}
                      step={1}
                      disabled={loading}
                      sx={{
                        position: 'absolute',
                        top: '50%',
                        left: 0,
                        right: 0,
                        transform: 'translateY(-50%)',
                        zIndex: 3,
                        opacity: 0,
                        height: '30px',
                        '& .MuiSlider-thumb': {
                          width: '28px',
                          height: '28px'
                        }
                      }}
                    />
                  </Box>
                  
                  {/* Month labels */}
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    px: 1,
                    mt: 1
                  }}>
                    {[6, 12, 18, 24, 30, 36].map((months) => (
                      <Typography 
                        key={months} 
                        variant="caption" 
                        sx={{
                          color: formData.term_months >= months ? 'success.main' : 'text.secondary',
                          fontWeight: formData.term_months === months ? 'bold' : 'normal',
                          width: '24px',
                          textAlign: 'center'
                        }}
                      >
                        {months}
                      </Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
              
              {/* Tipo di prestito */}
              <FormControl
                fullWidth
                sx={{ mb: 3 }}
                error={!!formErrors.loan_type}
                disabled={loading}
              >
                <InputLabel id="loan-type-label">Tipo di Prestito</InputLabel>
                <Select
                  labelId="loan-type-label"
                  id="loan_type"
                  name="loan_type"
                  value={formData.loan_type}
                  label="Tipo di Prestito"
                  onChange={handleSelectChange}
                  startAdornment={
                    <InputAdornment position="start">
                      <RequestQuoteIcon />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="personal">Personale</MenuItem>
                  <MenuItem value="mortgage">Mutuo</MenuItem>
                  <MenuItem value="auto">Auto</MenuItem>
                  <MenuItem value="education">Istruzione</MenuItem>
                  <MenuItem value="business">Aziendale</MenuItem>
                </Select>
                {formErrors.loan_type && (
                  <FormHelperText error>{formErrors.loan_type}</FormHelperText>
                )}
              </FormControl>
              
              {/* Conto di destinazione */}
              <FormControl 
                fullWidth 
                sx={{ mb: 3 }} 
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
                    <MenuItem disabled>Caricamento conti...</MenuItem>
                  ) : accounts.length === 0 ? (
                    <MenuItem disabled>Nessun conto disponibile</MenuItem>
                  ) : (
                    accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.id}>
                        {acc.account_number} (€{parseFloat(String(acc.balance)).toFixed(2)})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formErrors.destination_account && (
                  <FormHelperText>{formErrors.destination_account}</FormHelperText>
                )}
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/loans')}
                  disabled={loading}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Invia Richiesta'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' } }}>
          <Card sx={{ mb: 3, borderRadius: '16px', overflow: 'visible', position: 'relative', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: 20,
                width: 50,
                height: 50,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <ReceiptIcon sx={{ color: 'white' }} />
            </Box>
            <CardContent sx={{ pt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Riepilogo Prestito
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              {formData.amount ? (
                <>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Importo Prestito
                    </Typography>
                    <Typography variant="h6">
                      €{parseFloat(formData.amount.toString() || '0').toFixed(2)}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Tasso d'Interesse
                    </Typography>
                    <Typography variant="h6">
                      {interestRate}%
                    </Typography>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Durata
                    </Typography>
                    <Typography variant="h6">
                      {formData.term_months} mesi
                    </Typography>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Rata Mensile
                    </Typography>
                    <Typography variant="h5" color="primary.main" fontWeight="bold">
                      €{monthlyPayment ? monthlyPayment.toFixed(2) : '0.00'}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Importo Totale da Rimborsare
                    </Typography>
                    <Typography variant="h6">
                      €{totalPayment ? totalPayment.toFixed(2) : '0.00'}
                    </Typography>
                  </Box>
                </>
              ) : (
                <Alert severity="info">
                  Compila i campi per vedere il riepilogo del prestito
                </Alert>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ borderRadius: '16px', overflow: 'visible', position: 'relative', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)' }}>
            <Box
              sx={{
                position: 'absolute',
                top: -20,
                right: 20,
                width: 50,
                height: 50,
                borderRadius: '50%',
                bgcolor: 'info.main',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
              }}
            >
              <InfoIcon sx={{ color: 'white' }} />
            </Box>
            <CardContent sx={{ pt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Informazioni sul Prestito
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                <strong>Requisiti per l'approvazione:</strong>
              </Typography>
              <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                <li>Età compresa tra 18 e 70 anni</li>
                <li>Reddito dimostrabile</li>
                <li>Storico creditizio positivo</li>
                <li>Conto corrente attivo presso la nostra banca</li>
              </ul>
              
              <Typography variant="body2" sx={{ mt: 2 }} paragraph>
                <strong>Tempistiche:</strong> L'approvazione del prestito avviene generalmente entro 2-3 giorni lavorativi.
              </Typography>
              
              <Typography variant="body2" paragraph>
                <strong>Rimborso anticipato:</strong> È possibile rimborsare anticipatamente il prestito senza penali.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default NewLoan;
