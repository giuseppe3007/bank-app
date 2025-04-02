import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  FormHelperText,
  CircularProgress,
  Alert,
  Grid,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  IconButton,
  Avatar,
  Fade,
  Zoom,
  SelectChangeEvent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AttachMoney as AttachMoneyIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon,
  AccessTime as AccessTimeIcon,
  AccountBalance as AccountBalanceIcon
} from '@mui/icons-material';

// Definizione del tipo Account
interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

// Registrazione dei componenti Chart.js necessari
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NewInvestment: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Accesso al contesto di autenticazione per ottenere l'utente corrente
  
  // Ottieni la data di oggi nel formato YYYY-MM-DD per il campo data
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState({
    name: '',
    investment_type: 'etf',
    amount: '' as string | number,  // per supportare sia string che number
    interest_rate: 3.5,
    duration: 12,
    source_account: '', // Manteniamo come stringa per compatibilità con Material UI
    start_date: today, // Data di inizio predefinita a oggi
    end_date: '' // Data di fine calcolata in base alla durata
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [simulatedReturn, setSimulatedReturn] = useState<number | null>(null);
  const [investmentData, setInvestmentData] = useState<{months: string[], values: number[]}>({months: [], values: []});

  // Caricamento degli account disponibili
  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoadingAccounts(true);
        // Utilizziamo la struttura corretta degli URL come specificato nei memories
        const response = await axios.get('/api/accounts/');
        setAccounts(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchAccounts();
  }, []);

  // Calcola la data di fine quando cambia la data di inizio o la durata
  useEffect(() => {
    if (formData.start_date && formData.duration) {
      try {
        const startDate = new Date(formData.start_date);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + parseInt(String(formData.duration)));
        
        // Formatta la data come YYYY-MM-DD
        const formattedEndDate = endDate.toISOString().split('T')[0];
        
        setFormData(prev => ({
          ...prev,
          end_date: formattedEndDate
        }));
      } catch (error) {
        console.error('Errore nel calcolo della data di fine:', error);
      }
    }
  }, [formData.start_date, formData.duration]);

  // Simulazione del rendimento quando cambia importo, tasso o durata
  useEffect(() => {
    const amount = parseFloat(formData.amount.toString());
    if (!isNaN(amount) && amount > 0) {
      const rate = formData.interest_rate / 100;
      const years = formData.duration / 12;
      // Formula dell'interesse composto: A = P(1 + r)^t
      const futureValue = amount * Math.pow(1 + rate, years);
      setSimulatedReturn(parseFloat(futureValue.toFixed(2)));
      
      // Genera dati per il grafico dell'andamento
      const months: string[] = [];
      const values: number[] = [];
      
      // Calcola il valore per ogni mese
      for (let month = 0; month <= formData.duration; month++) {
        const monthYears = month / 12;
        const monthValue = amount * Math.pow(1 + rate, monthYears);
        months.push(`Mese ${month}`);
        values.push(parseFloat(monthValue.toFixed(2)));
      }
      
      setInvestmentData({ months, values });
    } else {
      setSimulatedReturn(null);
      setInvestmentData({ months: [], values: [] });
    }
  }, [formData.amount, formData.interest_rate, formData.duration]);

  // Gestione del cambio dei valori nei campi di input
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Reset dell'errore associato al campo modificato
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    // Validazione dell'importo (deve essere un numero positivo)
    if (name === 'amount') {
      const numValue = value === '' ? '' : value;
      
      if (value !== '' && (isNaN(Number(value)) || Number(value) <= 0)) {
        setFormErrors({
          ...formErrors,
          amount: 'Inserisci un importo valido maggiore di 0'
        });
      }
      
      setFormData({
        ...formData,
        amount: numValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Gestione del cambio nei campi select
  const handleSelectChange = (e: SelectChangeEvent) => {
    const name = e.target.name;
    const value = e.target.value;
    
    // Reset dell'errore associato al campo modificato
    if (name && formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gestione del cambio dei valori negli slider
  const handleSliderChange = (name: string) => (event: Event, newValue: number | number[]) => {
    // Reset dell'errore associato al campo modificato
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
    
    setFormData({
      ...formData,
      [name]: newValue
    });
  };

  // Validazione del form prima dell'invio
  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Il nome è obbligatorio';
    }
    
    if (!formData.amount || isNaN(Number(formData.amount)) || Number(formData.amount) <= 0) {
      errors.amount = 'Inserisci un importo valido maggiore di 0';
    }
    
    if (!formData.source_account) {
      errors.source_account = 'Seleziona un conto di origine';
    } else {
      // Verifica che ci siano fondi sufficienti nel conto selezionato
      // Convertiamo l'ID del conto da stringa a numero
      const accountId = parseInt(formData.source_account, 10);
      
      // Verifichiamo che la conversione abbia avuto successo
      if (!isNaN(accountId)) {
        const selectedAccount = accounts.find(acc => acc.id === accountId);
        
        if (selectedAccount && selectedAccount.balance < Number(formData.amount)) {
          errors.amount = 'Fondi insufficienti nel conto selezionato';
        }
      }
    }
    
    // Validazione della data di inizio
    if (!formData.start_date) {
      errors.start_date = 'La data di inizio è obbligatoria';
    } else {
      const startDate = new Date(formData.start_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset orario per confrontare solo le date
      
      if (startDate < today) {
        errors.start_date = 'La data di inizio non può essere antecedente a oggi';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestione dell'invio del form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convertiamo esplicitamente i valori numerici in stringhe per evitare problemi di tipo
      // come menzionato nei memories
      const amount = parseFloat(formData.amount.toString());
      
      // Creiamo il payload completo con tutti i campi richiesti
      const payload = {
        name: formData.name,
        investment_type: formData.investment_type,
        amount: amount.toString(),
        interest_rate: formData.interest_rate.toString(),
        duration_months: formData.duration,
        // Correzione: nel backend il campo si chiama 'account' e non 'source_account'
        // Convertiamo l'ID del conto da stringa a numero per il backend
        account: parseInt(formData.source_account, 10),
        // Campi data
        start_date: formData.start_date,
        end_date: formData.end_date,
        current_value: amount.toString(), // Inizialmente il valore corrente è uguale all'importo investito
        owner: user?.id // ID dell'utente autenticato
      };
      
      console.log('Payload investimento:', payload);
      
      // Chiamata API per creare un nuovo investimento
      const response = await axios.post('/api/investments/', payload);
      
      setSuccess('Investimento creato con successo!');
      
      // Reset del form dopo il successo
      setFormData({
        name: '',
        investment_type: 'etf',
        amount: '',
        interest_rate: 3.5,
        duration: 12,
        source_account: '',
        start_date: today,
        end_date: ''
      });
      
      // Redirect alla lista degli investimenti dopo un breve ritardo
      setTimeout(() => {
        navigate('/investments');
      }, 2000);
    } catch (err: any) {
      console.error('Errore durante la creazione dell\'investimento:', err);
      setError(
        err.response?.data?.detail || 
        'Si è verificato un errore durante la creazione dell\'investimento. Riprova più tardi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 6 }}>
      <Fade in={true} timeout={800}>
        <Paper 
          elevation={0} 
          sx={{ 
            p: 2, 
            mb: 3, 
            borderRadius: '16px 16px 0 0',
            bgcolor: 'primary.main',
            color: 'white',
            boxShadow: 3
          }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => navigate('/investments')}
              sx={{ color: 'white', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5" fontWeight="bold">Crea Nuovo Investimento</Typography>
          </Box>
        </Paper>
      </Fade>

      <Stepper 
        activeStep={0} 
        alternativeLabel 
        sx={{ 
          mb: 4,
          px: 2,
          '& .MuiStepLabel-label': {
            mt: 1
          }
        }}
      >
        <Step key="info">
          <StepLabel>Dettagli Investimento</StepLabel>
        </Step>
        <Step key="review">
          <StepLabel>Conferma</StepLabel>
        </Step>
        <Step key="complete">
          <StepLabel>Completato</StepLabel>
        </Step>
      </Stepper>

      {error && (
        <Fade in={true}>
          <Alert severity="error" sx={{ mb: 3, mx: 2 }}>
            {error}
          </Alert>
        </Fade>
      )}
      
      {success && (
        <Fade in={true}>
          <Alert severity="success" sx={{ mb: 3, mx: 2 }}>
            {success}
          </Alert>
        </Fade>
      )}

      <Box 
        component="form" 
        onSubmit={handleSubmit}
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: 3,
          px: 2
        }}
      >
        {/* Formulario principale */}
        <Box sx={{ flex: '1 1 65%' }}>
          <Zoom in={true} style={{ transitionDelay: '100ms' }}>
            <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom fontWeight="bold">
                  Dettagli Investimento
                </Typography>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', md: 'row' }, 
                  gap: 2, 
                  mb: 4 
                }}>
                  <TextField
                    fullWidth
                    id="name"
                    name="name"
                    label="Nome Investimento"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={loading}
                    error={!!formErrors.name}
                    helperText={formErrors.name}
                    sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}
                  />
                  
                  <FormControl sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}>
                    <InputLabel id="investment-type-label">Tipo Investimento</InputLabel>
                    <Select
                      labelId="investment-type-label"
                      id="investment_type"
                      name="investment_type"
                      value={formData.investment_type}
                      label="Tipo Investimento"
                      onChange={handleSelectChange as any}
                      disabled={loading}
                    >
                      <MenuItem value="etf">ETF</MenuItem>
                      <MenuItem value="bond">Obbligazione</MenuItem>
                      <MenuItem value="stock">Azione</MenuItem>
                      <MenuItem value="mutual_fund">Fondo Comune</MenuItem>
                      <MenuItem value="certificate_of_deposit">Certificato di Deposito</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ 
                    p: 3, 
                    mb: 3, 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <AttachMoneyIcon />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Importo e Conto
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', md: 'row' }, 
                      gap: 2,
                      mb: 2
                    }}>
                      <TextField
                        id="amount"
                        name="amount"
                        label="Importo"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        disabled={loading}
                        error={!!formErrors.amount}
                        helperText={formErrors.amount}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">€</InputAdornment>,
                        }}
                        sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}
                      />
                      
                      <FormControl 
                        sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }} 
                        error={!!formErrors.source_account}
                        disabled={loading || loadingAccounts}
                      >
                        <InputLabel id="source-account-label">Conto di Origine</InputLabel>
                        <Select
                          labelId="source-account-label"
                          id="source_account"
                          name="source_account"
                          value={String(formData.source_account)}
                          label="Conto di Origine"
                          onChange={handleSelectChange}
                        >
                          {loadingAccounts ? (
                            <MenuItem disabled>Caricamento conti...</MenuItem>
                          ) : accounts.length === 0 ? (
                            <MenuItem disabled>
                              <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', py: 1 }}>
                                <Typography variant="body2" color="error" gutterBottom>
                                  Nessun conto disponibile
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                                  Crea un conto prima di effettuare un investimento
                                </Typography>
                              </Box>
                            </MenuItem>
                          ) : (
                            accounts.map((acc) => (
                              <MenuItem key={acc.id} value={String(acc.id)}>
                                {acc.account_number} (€{parseFloat(String(acc.balance)).toFixed(2)})
                              </MenuItem>
                            ))
                          )}
                        </Select>
                        {formErrors.source_account && (
                          <FormHelperText>{formErrors.source_account}</FormHelperText>
                        )}
                        {accounts.length === 0 && !loadingAccounts && !formErrors.source_account && (
                          <FormHelperText>Crea un conto nella sezione "I tuoi conti" prima di procedere</FormHelperText>
                        )}
                      </FormControl>
                    </Box>
                  </Box>
                  
                  <Box sx={{ 
                    p: 3, 
                    bgcolor: 'background.default', 
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <TrendingUpIcon />
                      </Avatar>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Condizioni di Rendimento
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography id="interest-rate-slider" gutterBottom>
                          Tasso di Interesse (%)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.interest_rate}%
                        </Typography>
                      </Box>
                      <Slider
                        value={formData.interest_rate}
                        onChange={handleSliderChange('interest_rate')}
                        min={0.5}
                        max={10}
                        step={0.1}
                        aria-labelledby="interest-rate-slider"
                        marks={[
                          { value: 0.5, label: '0.5%' },
                          { value: 5, label: '5%' },
                          { value: 10, label: '10%' }
                        ]}
                        sx={{
                          '& .MuiSlider-thumb': {
                            height: 20,
                            width: 20,
                          },
                          '& .MuiSlider-rail': {
                            opacity: 0.5,
                          },
                        }}
                      />
                    </Box>
                    
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography id="duration-slider" gutterBottom>
                          Durata (mesi)
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formData.duration} {formData.duration === 1 ? 'mese' : 'mesi'}
                        </Typography>
                      </Box>
                      <Slider
                        value={formData.duration}
                        onChange={handleSliderChange('duration')}
                        min={1}
                        max={60}
                        step={1}
                        aria-labelledby="duration-slider"
                        marks={[
                          { value: 1, label: '1m' },
                          { value: 12, label: '12m' },
                          { value: 36, label: '36m' },
                          { value: 60, label: '60m' }
                        ]}
                        sx={{
                          '& .MuiSlider-thumb': {
                            height: 20,
                            width: 20,
                          },
                          '& .MuiSlider-rail': {
                            opacity: 0.5,
                          },
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
                
                {/* Sezione Date dell'Investimento */}
                <Box sx={{ 
                  p: 3, 
                  mb: 4, 
                  bgcolor: 'background.default', 
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <AccessTimeIcon />
                    </Avatar>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Date dell'Investimento
                    </Typography>
                  </Box>

                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' }, 
                    gap: 2, 
                    mb: 1
                  }}>
                    <TextField
                      id="start_date"
                      name="start_date"
                      label="Data di Inizio"
                      type="date"
                      value={formData.start_date}
                      onChange={handleChange}
                      inputProps={{ min: today }}
                      fullWidth
                      disabled={loading}
                      error={!!formErrors.start_date}
                      helperText={formErrors.start_date || 'La data non può essere antecedente a oggi'}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}
                    />
                    
                    <TextField
                      id="end_date"
                      name="end_date"
                      label="Data di Fine (calcolata)"
                      type="date"
                      value={formData.end_date}
                      InputProps={{ readOnly: true }}
                      fullWidth
                      disabled={true}
                      InputLabelProps={{ shrink: true }}
                      sx={{ flex: { xs: '1 1 100%', md: '1 1 0' } }}
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    La data di fine viene calcolata automaticamente in base alla data di inizio e alla durata dell'investimento.
                  </Typography>
                </Box>
                
                <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    pt: 3,
                    borderTop: '1px solid',
                    borderColor: 'divider'
                  }}>
                    <Button
                      variant="outlined"
                      onClick={() => navigate('/investments')}
                      sx={{ borderRadius: 2 }}
                      disabled={loading}
                    >
                      Annulla
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        borderRadius: 2,
                        px: 4,
                        py: 1,
                        fontWeight: 'bold',
                        boxShadow: 2,
                        '&:hover': {
                          boxShadow: 4,
                        }
                      }}
                    >
                      {loading ? <CircularProgress size={24} color="inherit" /> : 'Crea Investimento'}
                    </Button>
                  </Box>
              </Box>
            </Paper>
          </Zoom>
        </Box>
        
        {/* Simulazione rendimento */}
        <Box sx={{ flex: '1 1 35%' }}>
          <Zoom in={true} style={{ transitionDelay: '300ms' }}>
            <Card sx={{ 
              borderRadius: 2, 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              <CardContent sx={{ 
                bgcolor: 'primary.dark', 
                color: 'white', 
                p: 3,
                pb: 3
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AccessTimeIcon fontSize="large" />
                  <Typography variant="h6" fontWeight="bold">
                    Simulazione Rendimento
                  </Typography>
                </Box>
              </CardContent>
              
              <CardContent sx={{ p: 0 }}>
                {simulatedReturn ? (
                  <>
                    <Box sx={{ 
                      p: 3, 
                      m: 3, 
                      borderRadius: 2,
                      bgcolor: 'info.main',
                      color: 'white'
                    }}>
                      <Typography variant="subtitle2" fontWeight="medium" gutterBottom sx={{ opacity: 0.85 }}>
                        Valore Finale Stimato
                      </Typography>
                      <Typography variant="h4" fontWeight="bold">
                        €{simulatedReturn}
                      </Typography>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        mt: 1, 
                        pt: 1, 
                        borderTop: '1px solid rgba(255,255,255,0.2)'
                      }}>
                        <TrendingUpIcon sx={{ mr: 1 }} />
                        <Typography variant="body2">
                          +€{(simulatedReturn - parseFloat(formData.amount.toString() || '0')).toFixed(2)} di guadagno stimato
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      mx: 3, 
                      mb: 3, 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider'
                    }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Parametri dell'investimento
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ mt: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Capitale iniziale
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            €{parseFloat(formData.amount.toString() || '0').toFixed(2)}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Tasso d'interesse
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formData.interest_rate}% annuo
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Durata investimento
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formData.duration} mesi
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Tipo investimento
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {formData.investment_type === 'etf' && 'ETF'}
                            {formData.investment_type === 'bond' && 'Obbligazione'}
                            {formData.investment_type === 'stock' && 'Azione'}
                            {formData.investment_type === 'fund' && 'Fondo Comune'}
                          </Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed', borderColor: 'divider' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                          Nota: questa è una simulazione basata su interesse composto. Il rendimento effettivo può variare.
                        </Typography>
                      </Box>
                    </Box>

                    {/* Grafico andamento dell'investimento */}
                    <Box sx={{ 
                      mx: 3, 
                      mb: 3, 
                      p: 2, 
                      border: '1px solid',
                      borderColor: 'divider',
                      borderRadius: 1
                    }}>
                      <Typography variant="subtitle2" gutterBottom fontWeight="bold">
                        Andamento dell'investimento
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      
                      <Box sx={{ height: 250, mt: 2 }}>
                        <Line
                          data={{
                            labels: investmentData.months,
                            datasets: [
                              {
                                label: 'Valore dell\'investimento',
                                data: investmentData.values,
                                borderColor: '#1976d2',
                                backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                fill: true,
                                tension: 0.4,
                                pointRadius: investmentData.months.length > 24 ? 0 : 3,
                                pointBackgroundColor: '#1976d2'
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'top',
                              },
                              tooltip: {
                                callbacks: {
                                  label: function(context) {
                                    return `€${context.parsed.y}`;
                                  }
                                }
                              }
                            },
                            scales: {
                              x: {
                                title: {
                                  display: true,
                                  text: 'Periodo (mesi)'
                                }
                              },
                              y: {
                                beginAtZero: true,
                                title: {
                                  display: true,
                                  text: 'Valore in Euro'
                                },
                                ticks: {
                                  callback: function(value) {
                                    return '€' + value;
                                  }
                                }
                              }
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      mb: 2
                    }}>
                      <InfoIcon fontSize="large" color="disabled" />
                    </Box>
                    <Typography variant="subtitle1" fontWeight="medium" align="center" gutterBottom>
                      Inserisci un importo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" align="center">
                      La simulazione del rendimento apparirà qui non appena inserisci un importo valido.
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Zoom>
        </Box>
      </Box>
    </Box>
  );
};

export default NewInvestment;
