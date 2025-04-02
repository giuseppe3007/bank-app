import React, { useState } from 'react';
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
  Grid,
  Card,
  CardContent,
  InputAdornment,
  Divider,
  Fade,
  Stepper,
  Step,
  StepLabel,
  IconButton
} from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const NewAccount: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    account_type: '',
    account_name: '',
    initial_deposit: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [activeStep, setActiveStep] = useState(0);

  const accountTypes = [
    { value: 'checking', label: 'Conto Corrente' },
    { value: 'savings', label: 'Conto di Risparmio' },
    { value: 'business', label: 'Conto Business' }
  ];

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!formData.account_type) {
      errors.account_type = 'Il tipo di conto è obbligatorio';
    }
    
    if (!formData.account_name.trim()) {
      errors.account_name = 'Il nome del conto è obbligatorio';
    }
    
    if (activeStep === 1 && formData.initial_deposit) {
      const deposit = parseFloat(formData.initial_deposit);
      if (isNaN(deposit) || deposit <= 0) {
        errors.initial_deposit = 'Inserisci un importo valido maggiore di zero';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Gestore per campi di testo
  const handleTextFieldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Gestore specifico per i componenti Select
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNext = () => {
    if (validateForm()) {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Seleziona il tipo di conto e assegnagli un nome
              </Typography>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <Box>
                  <FormControl fullWidth error={!!formErrors.account_type}>
                    <InputLabel id="account-type-label">Tipo di Conto</InputLabel>
                    <Select
                      labelId="account-type-label"
                      id="account_type"
                      name="account_type"
                      value={formData.account_type}
                      label="Tipo di Conto"
                      onChange={handleSelectChange}
                      disabled={loading}
                      startAdornment={
                        <InputAdornment position="start">
                          <AccountBalanceIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      }
                    >
                      {accountTypes.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                    {formErrors.account_type && (
                      <FormHelperText>{formErrors.account_type}</FormHelperText>
                    )}
                  </FormControl>
                </Box>
                <Box>
                  <TextField
                    fullWidth
                    label="Nome del Conto"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleTextFieldChange}
                    error={!!formErrors.account_name}
                    helperText={formErrors.account_name || 'Inserisci un nome descrittivo per il tuo conto'}
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <TextFieldsIcon sx={{ color: 'primary.main' }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/accounts')}
                  disabled={loading}
                  startIcon={<ArrowBackIcon />}
                >
                  Annulla
                </Button>
                <Button
                  variant="contained"
                  onClick={handleNext}
                  disabled={loading}
                >
                  Continua
                </Button>
              </Box>
            </Box>
          </Fade>
        );
      case 1:
        return (
          <Fade in={true} timeout={500}>
            <Box>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Imposta il deposito iniziale (opzionale)
              </Typography>
              
              <TextField
                fullWidth
                label="Deposito Iniziale"
                name="initial_deposit"
                value={formData.initial_deposit}
                onChange={handleTextFieldChange}
                error={!!formErrors.initial_deposit}
                helperText={formErrors.initial_deposit || 'Lascia vuoto per creare un conto con saldo zero'}
                type="number"
                disabled={loading}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AccountBalanceWalletIcon sx={{ color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                  endAdornment: <InputAdornment position="end">€</InputAdornment>,
                }}
              />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Indietro
                </Button>
                <Button
                  variant="contained"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSubmit(e);
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : 'Crea Conto'}
                </Button>
              </Box>
            </Box>
          </Fade>
        );
      default:
        return 'Passaggio sconosciuto';
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
      // Creare il conto
      const response = await axios.post('/api/accounts/', {
        account_type: formData.account_type
      });
      
      const accountId = response.data.id;
      
      // Se è stato specificato un deposito iniziale, effettuarlo
      if (formData.initial_deposit && parseFloat(formData.initial_deposit) > 0) {
        await axios.post(`/api/accounts/${accountId}/deposit/`, {
          amount: parseFloat(formData.initial_deposit),
          description: `Deposito iniziale per ${formData.account_name}`
        });
      }
      
      setSuccess('Conto creato con successo!');
      
      // Reindirizza alla pagina di dettaglio del conto dopo un breve ritardo
      setTimeout(() => {
        navigate(`/accounts/${accountId}`);
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating account:', err);
      setError(
        err.response?.data?.detail || 
        'Si è verificato un errore durante la creazione del conto. Riprova.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto' }}>
      <Card sx={{ mb: 4, p: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            onClick={() => navigate('/accounts')} 
            sx={{ mr: 2 }}
            color="primary"
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" fontWeight="500" color="primary.main">
            Crea Nuovo Conto
          </Typography>
        </Box>
      </Card>
      
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          borderRadius: '16px', 
          mx: 'auto', 
          overflow: 'hidden',
          boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)'
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 4, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert severity="success" sx={{ mb: 4, borderRadius: '8px' }}>
            {success}
          </Alert>
        )}
        
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          <Step>
            <StepLabel>Informazioni del conto</StepLabel>
          </Step>
          <Step>
            <StepLabel>Deposito iniziale</StepLabel>
          </Step>
        </Stepper>
        
        <Divider sx={{ mb: 4 }} />
        
        <Box component="form" onSubmit={(e) => e.preventDefault()} noValidate>
          {getStepContent(activeStep)}
        </Box>
      </Paper>
    </Box>
  );
};

export default NewAccount;
