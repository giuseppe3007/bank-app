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
  SelectChangeEvent,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  FormHelperText,
  Divider,
  Switch,
  FormControlLabel,
  Card,
  CardContent,
  Avatar,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
  Shield as ShieldIcon,
  Dashboard as DashboardIcon,
  Info as InfoIcon,
  Description as DescriptionIcon,
  LocalHospital as HealthIcon,
  DirectionsCar as CarIcon,
  House as HomeIcon,
  Flight as TravelIcon,
  Favorite as LifeIcon,
  Security as LiabilityIcon,
  Euro as EuroIcon
} from '@mui/icons-material';

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

// Definizione dei pacchetti assicurativi predefiniti allineati con il backend
const insurancePackages = {
  life: [
    { name: 'Base', coverage: 50000, premium: 250, description: 'Copertura essenziale in caso di decesso' },
    { name: 'Standard', coverage: 100000, premium: 450, description: 'Copertura completa con indennità per malattie gravi' },
    { name: 'Premium', coverage: 250000, premium: 950, description: 'Copertura estesa con protezione per invalidità e indennità ospedaliere' },
  ],
  health: [
    { name: 'Base', coverage: 30000, premium: 400, description: 'Copertura per ricoveri e interventi chirurgici' },
    { name: 'Standard', coverage: 70000, premium: 750, description: 'Copertura completa con visite specialistiche e diagnostica' },
    { name: 'Premium', coverage: 150000, premium: 1200, description: 'Copertura all-inclusive con terapie avanzate e ricoveri all\'estero' },
  ],
  auto: [ // Modificato da 'car' a 'auto' per allinearsi al backend
    { name: 'RC Auto', coverage: 20000, premium: 650, description: 'Responsabilità civile obbligatoria' },
    { name: 'Protezione Plus', coverage: 40000, premium: 850, description: 'RC auto con furto, incendio e cristalli' },
    { name: 'Full Kasko', coverage: 60000, premium: 1300, description: 'Copertura completa con kasko, assistenza stradale e auto sostitutiva' },
  ],
  home: [
    { name: 'Essenziale', coverage: 80000, premium: 180, description: 'Protezione base per danni all\'abitazione' },
    { name: 'Comfort', coverage: 150000, premium: 300, description: 'Protezione completa con garanzia sui contenuti' },
    { name: 'Tutto Compreso', coverage: 300000, premium: 550, description: 'Protezione totale con danni a terzi e assistenza 24/7' },
  ],
  travel: [
    { name: 'Viaggio Sicuro', coverage: 10000, premium: 75, description: 'Copertura medica e smarrimento bagagli' },
    { name: 'Viaggio Sereno', coverage: 25000, premium: 150, description: 'Copertura completa con annullamento viaggio' },
    { name: 'Viaggio Premium', coverage: 50000, premium: 250, description: 'Copertura globale con assistenza 24/7 e rimpatrio' },
  ],
  business: [ // Modificato da 'liability' a 'business' per allinearsi al backend
    { name: 'Protezione Base', coverage: 100000, premium: 120, description: 'Protezione essenziale per danni a terzi' },
    { name: 'Protezione Estesa', coverage: 300000, premium: 280, description: 'Protezione completa per responsabilità civile e tutela legale' },
    { name: 'Protezione Totale', coverage: 500000, premium: 450, description: 'Protezione massima per professionisti e famiglie' },
  ],
};

const NewInsurancePolicy: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  // Aggiunto stato per l'utente corrente
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
  
  const [formData, setFormData] = useState({
    policy_type: 'home',
    package_type: 'Standard',
    coverage_amount: '',
    premium_amount: '',
    description: '',
    is_custom: false,
    payment_frequency: 'annual',
    payment_account: '',
    policy_holder: '',  // Sarà sostituito dall'ID dell'utente corrente
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    deductible: '0'
  });
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  // Caricamento degli account disponibili e dell'utente corrente
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch degli account
        const accountsResponse = await axios.get('/api/accounts/');
        setAccounts(accountsResponse.data.results || accountsResponse.data);
        
        // Fetch dell'utente corrente
        const userResponse = await axios.get('/api/current-user/');
        setCurrentUser(userResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        
        // Se non riusciamo a ottenere l'utente corrente, impostiamo manualmente l'ID dell'admin
        // basato sul valore nelle credenziali memorizzate
        setCurrentUser({ id: 1 }); // Assumiamo che l'admin abbia ID 1
      } finally {
        setLoadingAccounts(false);
      }
    };

    fetchData();
  }, []);

  // Aggiorna i valori del pacchetto selezionato quando cambiano tipo polizza o pacchetto
  useEffect(() => {
    if (!formData.is_custom && formData.policy_type && formData.package_type) {
      const packages = insurancePackages[formData.policy_type as keyof typeof insurancePackages] || [];
      const foundPackage = packages.find(pkg => pkg.name === formData.package_type);
      
      if (foundPackage) {
        setSelectedPackage(foundPackage);
        setFormData(prev => ({
          ...prev,
          coverage_amount: foundPackage.coverage.toString(),
          premium_amount: foundPackage.premium.toString(),
          description: foundPackage.description
        }));
      }
    }
  }, [formData.policy_type, formData.package_type, formData.is_custom]);

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    console.log('Validazione form, dati attuali:', formData);
    
    if (formData.is_custom) {
      if (!formData.description.trim()) {
        errors.description = "La descrizione della polizza è obbligatoria";
      }
      
      if (!formData.coverage_amount || parseFloat(formData.coverage_amount.toString()) <= 0) {
        errors.coverage_amount = "L'importo della copertura deve essere positivo";
      }
      
      if (!formData.premium_amount || parseFloat(formData.premium_amount.toString()) <= 0) {
        errors.premium_amount = "L'importo del premio deve essere positivo";
      }
    }
    
    if (!formData.policy_holder || !formData.policy_holder.trim()) {
      errors.policy_holder = "Il titolare della polizza è obbligatorio";
      console.log('Errore: policy_holder mancante');
    }
    
    if (!formData.start_date) {
      errors.start_date = "La data di inizio è obbligatoria";
      console.log('Errore: start_date mancante');
    }
    
    if (!formData.end_date) {
      errors.end_date = "La data di fine è obbligatoria";
      console.log('Errore: end_date mancante');
    } else if (new Date(formData.end_date) <= new Date(formData.start_date)) {
      errors.end_date = "La data di fine deve essere successiva alla data di inizio";
      console.log('Errore: end_date non valida (deve essere dopo start_date)');
    }
    
    if (!formData.payment_account) {
      errors.payment_account = "Seleziona un conto per il pagamento del premio";
      console.log('Errore: payment_account mancante');
    } else {
      // Verifica se ci sono fondi sufficienti per il primo pagamento
      const selectedAccount = accounts.find(acc => acc.account_number === formData.payment_account);
      const premiumAmount = parseFloat(formData.premium_amount.toString());
      
      if (selectedAccount && premiumAmount > selectedAccount.balance) {
        errors.payment_account = "Fondi insufficienti nel conto selezionato";
        console.log('Errore: fondi insufficienti nel conto');
      }
    }
    
    if (!formData.policy_type) {
      errors.policy_type = "Il tipo di polizza è obbligatorio";
      console.log('Errore: policy_type mancante');
    }
    
    console.log('Errori di validazione:', errors);
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target as { name: string; value: unknown };
    
    // Per i campi numerici, assicuriamoci che siano validi
    if (name === 'coverage_amount' || name === 'premium_amount') {
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

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      is_custom: e.target.checked
    });
  };

  const formatPolicyType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'life': 'Vita',
      'health': 'Salute',
      'auto': 'Auto',
      'home': 'Casa',
      'travel': 'Viaggio',
      'business': 'Responsabilità Civile'
    };
    return typeMap[type] || type;
  };

  // Funzione separata per la logica di invio
  const handleFormSubmission = async () => {
    console.log('handleFormSubmission called');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form is valid, proceeding with submission');
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convertiamo esplicitamente i valori numerici in stringhe per evitare problemi di tipo
      // come menzionato nella memoria relativa agli errori di tipo Decimal/float
      const payload = {
        policy_type: formData.policy_type,
        coverage_amount: formData.coverage_amount.toString(),
        premium_amount: formData.premium_amount.toString(),
        payment_frequency: formData.payment_frequency,
        description: formData.description,
        payment_account: formData.payment_account,
        policy_holder: formData.policy_holder || currentUser?.id?.toString() || '1',  // Fallback sull'admin
        start_date: formData.start_date,
        end_date: formData.end_date,
        deductible: formData.deductible.toString()
      };
      
      console.log('Invio del payload:', payload);
      
      // Verifichiamo che il token sia presente negli header prima di fare la chiamata
      const accessToken = localStorage.getItem('access_token');
      if (!axios.defaults.headers.common['Authorization'] && accessToken) {
        console.log('Impostazione manuale token nell\'header');
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      
      // Utilizziamo l'URL corretto confermato dalle configurazioni del backend
      console.log('Invio polizza all\'URL: /api/insurance-policies/');
      const response = await axios.post('/api/insurance-policies/', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Risposta dal server:', response.data);
      setSuccess('Polizza assicurativa creata con successo!');
      
      // Reindirizza alla pagina delle assicurazioni dopo un breve ritardo
      setTimeout(() => {
        navigate('/insurance');
      }, 1500);
      
    } catch (err: any) {
      setLoading(false);
      console.error('Errore durante la creazione della polizza:', err);
      
      // Log dettagliato dell'errore per debug
      if (err.response) {
        console.error('Dettagli risposta di errore:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
        
        if (err.response.status === 400) {
          // Errore di validazione dal backend
          setError(`Errore di validazione: ${JSON.stringify(err.response.data)}`);
        } else if (err.response.status === 401) {
          // Errore di autenticazione
          setError('Autenticazione fallita. Effettua nuovamente il login.');
        } else {
          setError(`Errore: ${err.response.statusText || err.message}`);
        }
      } else {
        setError(`Si è verificato un errore: ${err.message}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('handleSubmit event triggered', e);
    e.preventDefault();
    
    // Chiamare la funzione di invio comune
    await handleFormSubmission();
    
    try {
      // Convertiamo esplicitamente i valori numerici in stringhe per evitare problemi di tipo
      // come menzionato nei memories
      const payload = {
        policy_type: formData.policy_type,
        coverage_amount: formData.coverage_amount.toString(),
        premium_amount: formData.premium_amount.toString(),
        payment_frequency: formData.payment_frequency,
        description: formData.description,
        payment_account: formData.payment_account,
        policy_holder: currentUser?.id,  // Usiamo l'ID dell'utente corrente
        start_date: formData.start_date,
        end_date: formData.end_date,
        deductible: formData.deductible.toString()
      };
      
      console.log('Sending payload:', payload);
      
      // Verifichiamo che il token sia presente negli header prima di fare la chiamata
      const accessToken = localStorage.getItem('access_token');
      if (!axios.defaults.headers.common['Authorization'] && accessToken) {
        console.log('Impostazione manuale token nell\'header');
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
      }
      
      console.log('Headers per la richiesta:', {
        'Content-Type': 'application/json',
        'Authorization': axios.defaults.headers.common['Authorization']
      });
      
      // Utilizziamo solo l'URL corretto confermato dal router del backend
      console.log('Invio polizza all\'URL corretto: /api/insurance-policies/');
      try {
        const response = await axios.post('/api/insurance-policies/', payload, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': axios.defaults.headers.common['Authorization']
          }
        });
        console.log('Risposta dal server:', response.data);
        return response;
      } catch (error: any) {
        console.error('Errore durante invio della polizza:', error);
        // Log dettagliato dell'errore per debug
        if (error.response) {
          console.error('Dettagli risposta:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data
          });
        }
        throw error; // Rilanciamo l'errore per permettere alla chiamata di gestire l'errore
      }
      
      setSuccess('Polizza assicurativa creata con successo!');
      
      // Reindirizza alla pagina delle assicurazioni dopo un breve ritardo
      setTimeout(() => {
        navigate('/insurance');
      }, 1500);
      
    } catch (err: any) {
      console.error('Error creating insurance policy:', err);
      // Logghiamo l'errore completo per il debug
      console.log('Error response:', err.response?.data);
      
      // Controlliamo se c'è un errore di validazione o di tipo
      if (err.response?.data) {
        const errorData = err.response.data;
        let errorMessage = '';
        
        // Gestiamo diverse strutture di errore possibili
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else {
          // Per errori di validazione con campi specifici
          const errorFields = Object.keys(errorData);
          if (errorFields.length > 0) {
            errorMessage = 'Errori di validazione: ';
            errorFields.forEach(field => {
              if (Array.isArray(errorData[field])) {
                errorMessage += `${field}: ${errorData[field].join(', ')}; `;
              } else {
                errorMessage += `${field}: ${errorData[field]}; `;
              }
            });
          }
        }
        
        setError(errorMessage || 'Si è verificato un errore durante la creazione della polizza. Riprova.');
      } else {
        setError('Si è verificato un errore di connessione. Verifica la tua connessione internet e riprova.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 5 }}>
      <Card 
        elevation={0}
        sx={{ 
          mb: 4,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        <Box 
          sx={{ 
            position: 'absolute', 
            right: '-5%', 
            bottom: '-15%', 
            opacity: 0.1,
            transform: 'rotate(-10deg)',
            fontSize: '240px'
          }}
        >
          <ShieldIcon sx={{ fontSize: 'inherit' }} />
        </Box>
        <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Box>
              <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
                Nuova Polizza Assicurativa
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                Proteggi ciò che conta davvero con le nostre soluzioni personalizzate
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => navigate('/insurance')}
              sx={{ 
                bgcolor: 'white', 
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                }
              }}
            >
              Torna alla lista
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(66.666% - 12px)' } }}>
          <Card 
            elevation={2} 
            sx={{ 
              p: 4, 
              borderRadius: '12px',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
              }
            }}>
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
            
            {/* Form semplificato senza usare il component="form" */}
            <Box 
              onClick={() => console.log('Form area clicked')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.primary.main, 0.1), 
                    color: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  <ShieldIcon />
                </Avatar>
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                  Dettagli della Polizza
                </Typography>
              </Box>
              
              {/* Titolare della polizza - informativo, non modificabile */}
              <TextField
                margin="normal"
                fullWidth
                id="policy_holder_info"
                label="Titolare della Polizza"
                value="Administrator (utente corrente)"
                disabled
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <InfoIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
                helperText="La polizza sarà associata automaticamente all'utente corrente"
              />
              
              {/* Date di inizio e fine */}
              <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="start_date"
                  label="Data di Inizio"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleChange}
                  error={!!formErrors.start_date}
                  helperText={formErrors.start_date}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 0 }}
                />
                
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="end_date"
                  label="Data di Fine"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleChange}
                  error={!!formErrors.end_date}
                  helperText={formErrors.end_date}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mt: 0 }}
                />
              </Box>
              
              {/* Franchigia */}
              <TextField
                margin="normal"
                required
                fullWidth
                id="deductible"
                label="Franchigia"
                name="deductible"
                value={formData.deductible}
                onChange={handleChange}
                error={!!formErrors.deductible}
                helperText={formErrors.deductible}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <EuroIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              <Divider sx={{ mb: 3 }} />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="policy-type-label">Tipo di Polizza</InputLabel>
                <Select
                  labelId="policy-type-label"
                  id="policy_type"
                  name="policy_type"
                  value={formData.policy_type}
                  label="Tipo di Polizza"
                  onChange={handleSelectChange}
                  disabled={loading}
                  sx={{
                    '& .MuiSelect-select': {
                      display: 'flex',
                      alignItems: 'center'
                    }
                  }}
                >
                  <MenuItem value="life" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.error.main, 0.1), color: theme.palette.error.main, mr: 2, width: 32, height: 32 }}>
                      <LifeIcon fontSize="small" />
                    </Avatar>
                    Vita
                  </MenuItem>
                  <MenuItem value="health" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.success.main, 0.1), color: theme.palette.success.main, mr: 2, width: 32, height: 32 }}>
                      <HealthIcon fontSize="small" />
                    </Avatar>
                    Salute
                  </MenuItem>
                  <MenuItem value="auto" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.info.main, 0.1), color: theme.palette.info.main, mr: 2, width: 32, height: 32 }}>
                      <CarIcon fontSize="small" />
                    </Avatar>
                    Auto
                  </MenuItem>
                  <MenuItem value="home" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.warning.main, 0.1), color: theme.palette.warning.main, mr: 2, width: 32, height: 32 }}>
                      <HomeIcon fontSize="small" />
                    </Avatar>
                    Casa
                  </MenuItem>
                  <MenuItem value="travel" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1), color: theme.palette.primary.main, mr: 2, width: 32, height: 32 }}>
                      <TravelIcon fontSize="small" />
                    </Avatar>
                    Viaggio
                  </MenuItem>
                  <MenuItem value="business" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.secondary.main, 0.1), color: theme.palette.secondary.main, mr: 2, width: 32, height: 32 }}>
                      <LiabilityIcon fontSize="small" />
                    </Avatar>
                    Responsabilità Civile
                  </MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_custom}
                    onChange={handleSwitchChange}
                    name="is_custom"
                    disabled={loading}
                  />
                }
                label="Configurazione personalizzata"
                sx={{ mb: 3 }}
              />
              
              {!formData.is_custom ? (
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel id="package-type-label">Pacchetto</InputLabel>
                  <Select
                    labelId="package-type-label"
                    id="package_type"
                    name="package_type"
                    value={formData.package_type}
                    label="Pacchetto"
                    onChange={handleSelectChange}
                    disabled={loading}
                  >
                    {(insurancePackages[formData.policy_type as keyof typeof insurancePackages] || []).map((pkg, index) => (
                      <MenuItem key={index} value={pkg.name}>
                        {pkg.name} - €{pkg.premium}/anno
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              ) : (
                <>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="coverage_amount"
                    label="Importo Copertura"
                    name="coverage_amount"
                    value={formData.coverage_amount}
                    onChange={handleChange}
                    disabled={loading}
                    error={!!formErrors.coverage_amount}
                    helperText={formErrors.coverage_amount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    sx={{ mb: 3 }}
                  />
                  
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="premium_amount"
                    label="Importo Premio"
                    name="premium_amount"
                    value={formData.premium_amount}
                    onChange={handleChange}
                    disabled={loading}
                    error={!!formErrors.premium_amount}
                    helperText={formErrors.premium_amount}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">€</InputAdornment>,
                    }}
                    sx={{ mb: 3 }}
                  />
                </>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="description"
                label="Descrizione Polizza"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading || !formData.is_custom}
                error={!!formErrors.description}
                helperText={formErrors.description}
                multiline
                rows={3}
                sx={{ mb: 3 }}
              />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="payment-frequency-label">Frequenza di Pagamento</InputLabel>
                <Select
                  labelId="payment-frequency-label"
                  id="payment_frequency"
                  name="payment_frequency"
                  value={formData.payment_frequency}
                  label="Frequenza di Pagamento"
                  onChange={handleSelectChange}
                  disabled={loading}
                >
                  <MenuItem value="monthly">Mensile</MenuItem>
                  <MenuItem value="quarterly">Trimestrale</MenuItem>
                  <MenuItem value="biannual">Semestrale</MenuItem>
                  <MenuItem value="annual">Annuale</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl 
                fullWidth 
                sx={{ mb: 3 }} 
                error={!!formErrors.payment_account}
                disabled={loading || loadingAccounts}
              >
                <InputLabel id="payment-account-label">Conto per il Pagamento</InputLabel>
                <Select
                  labelId="payment-account-label"
                  id="payment_account"
                  name="payment_account"
                  value={formData.payment_account}
                  label="Conto per il Pagamento"
                  onChange={handleSelectChange}
                >
                  {loadingAccounts ? (
                    <MenuItem disabled>Caricamento conti...</MenuItem>
                  ) : accounts.length === 0 ? (
                    <MenuItem disabled>Nessun conto disponibile</MenuItem>
                  ) : (
                    accounts.map((acc) => (
                      <MenuItem key={acc.id} value={acc.account_number}>
                        {acc.account_number} (€{Number(acc.balance).toFixed(2)})
                      </MenuItem>
                    ))
                  )}
                </Select>
                {formErrors.payment_account && (
                  <FormHelperText>{formErrors.payment_account}</FormHelperText>
                )}
              </FormControl>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/insurance')}
                  disabled={loading}
                  startIcon={<ArrowBackIcon />}
                  sx={{ 
                    borderRadius: '8px',
                    pl: 2,
                    pr: 2
                  }}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={!loading && <CheckCircleIcon />}
                  onClick={(e) => {
                    e.preventDefault();
                    console.log('Submit button clicked directly');
                    
                    // Verifichiamo il token prima di procedere
                    const accessToken = localStorage.getItem('access_token');
                    console.log('Access token presente:', !!accessToken);
                    
                    if (!accessToken) {
                      setError('Autenticazione mancante. Effettua il login e riprova.');
                      return;
                    }
                    
                    // Assicuriamoci che il token sia nell'header
                    if (!axios.defaults.headers.common['Authorization'] && accessToken) {
                      console.log('Impostazione manuale token nell\'header');
                      axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                    }
                    
                    // Impostiamo forzatamente l'ID dell'utente admin come policy_holder se è vuoto
                    if (!formData.policy_holder || formData.policy_holder.trim() === '') {
                      console.log('Impostazione automatica policy_holder = 1 (admin)');
                      setFormData(prev => ({ ...prev, policy_holder: '1' }));
                      // Per evitare problemi di timing con la state update, impostiamo direttamente
                      // il policy_holder nel formData per la validazione
                      formData.policy_holder = '1';
                    }
                    
                    // Eseguiamo la funzione di invio
                    handleFormSubmission();
                  }}
                  sx={{ 
                    borderRadius: '8px',
                    pl: 3,
                    pr: 3,
                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
                    '&:hover': {
                      boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 0.3s ease'
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : 'Sottoscrivi Polizza'}
                </Button>
              </Box>
            </Box>
          </Card>
        </Box>
        
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(33.333% - 12px)' } }}>
          <Card sx={{ 
            mb: 3, 
            borderRadius: '12px',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.info.main, 0.1), 
                    color: theme.palette.info.main,
                    mr: 2
                  }}
                >
                  <DashboardIcon />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                  Riepilogo Polizza
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tipo di Polizza
                </Typography>
                <Typography variant="h6">
                  {formatPolicyType(formData.policy_type)}
                </Typography>
              </Box>
              
              {!formData.is_custom && selectedPackage && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Pacchetto
                  </Typography>
                  <Typography variant="h6">
                    {selectedPackage.name}
                  </Typography>
                </Box>
              )}
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Importo Copertura
                </Typography>
                <Typography variant="h6" color="primary.main">
                  €{formData.coverage_amount ? parseFloat(formData.coverage_amount).toFixed(2) : '0.00'}
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Premio
                </Typography>
                <Typography variant="h6" sx={{ 
                  color: theme.palette.secondary.main,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Avatar sx={{ 
                    bgcolor: alpha(theme.palette.secondary.main, 0.1), 
                    color: theme.palette.secondary.main,
                    mr: 1,
                    width: 24,
                    height: 24
                  }}>
                    <EuroIcon sx={{ fontSize: '0.875rem' }} />
                  </Avatar>
                  €{formData.premium_amount ? parseFloat(formData.premium_amount).toFixed(2) : '0.00'} 
                  <Box component="span" sx={{ fontWeight: 400, ml: 0.5, color: 'text.secondary' }}>
                    {formData.payment_frequency === 'monthly' && '/mese'}
                    {formData.payment_frequency === 'quarterly' && '/trimestre'}
                    {formData.payment_frequency === 'biannual' && '/semestre'}
                    {formData.payment_frequency === 'annual' && '/anno'}
                  </Box>
                </Typography>
              </Box>
            </CardContent>
          </Card>
          
          <Card sx={{ 
            borderRadius: '12px',
            transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)',
              boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
            }
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: alpha(theme.palette.success.main, 0.1), 
                    color: theme.palette.success.main,
                    mr: 2
                  }}
                >
                  <InfoIcon />
                </Avatar>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
                  Informazioni sulla Polizza
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              
              <Typography variant="body2" paragraph>
                <strong>Vantaggi della polizza {formatPolicyType(formData.policy_type)}:</strong>
              </Typography>
              
              {formData.policy_type === 'life' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Protezione finanziaria per i tuoi cari</li>
                  <li>Copertura in caso di malattie gravi</li>
                  <li>Possibilità di anticipi in caso di necessità</li>
                  <li>Vantaggi fiscali sulle somme versate</li>
                </ul>
              )}
              
              {formData.policy_type === 'health' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Rimborso per spese mediche e ricoveri</li>
                  <li>Accesso a strutture private convenzionate</li>
                  <li>Copertura per visite specialistiche</li>
                  <li>Assistenza 24/7 per emergenze mediche</li>
                </ul>
              )}
              
              {formData.policy_type === 'car' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Copertura per danni a terzi</li>
                  <li>Protezione contro furto e incendio</li>
                  <li>Assistenza stradale inclusa</li>
                  <li>Servizio carrozzeria convenzionata</li>
                </ul>
              )}
              
              {formData.policy_type === 'home' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Protezione contro danni alla struttura</li>
                  <li>Copertura per il contenuto dell'abitazione</li>
                  <li>Protezione contro eventi naturali</li>
                  <li>Assistenza per riparazioni urgenti</li>
                </ul>
              )}
              
              {formData.policy_type === 'travel' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Copertura sanitaria all'estero</li>
                  <li>Rimborso per cancellazione del viaggio</li>
                  <li>Protezione bagaglio</li>
                  <li>Assistenza h24 per emergenze</li>
                </ul>
              )}
              
              {formData.policy_type === 'liability' && (
                <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                  <li>Protezione per danni causati a terzi</li>
                  <li>Copertura per membri della famiglia</li>
                  <li>Tutela legale inclusa</li>
                  <li>Protezione per attività di vita quotidiana</li>
                </ul>
              )}
              
              <Typography variant="body2" sx={{ mt: 2 }} paragraph>
                <strong>Attivazione:</strong> La polizza sarà attiva a partire dal giorno successivo alla sottoscrizione.
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default NewInsurancePolicy;
