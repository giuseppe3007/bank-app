import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  CardHeader,
  CardActionArea,
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Button,
  CircularProgress,
  Grid,
  Chip,
  Avatar,
  LinearProgress,
  IconButton,
  Tooltip,
  Badge
} from '@mui/material';
import { 
  AccountBalance as AccountBalanceIcon, 
  TrendingUp as TrendingUpIcon, 
  MonetizationOn as MonetizationOnIcon, 
  Security as SecurityIcon,
  Add as AddIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Payment as PaymentIcon,
  Visibility as VisibilityIcon,
  CompareArrows as CompareArrowsIcon,
  MoreVert as MoreVertIcon,
  CreditCard as CreditCardIcon,
  ShowChart as ShowChartIcon,
  Apartment as ApartmentIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Speed as SpeedIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Definizione delle interfacce per i tipi di dati
interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
}

interface Transaction {
  id: number;
  transaction_type: string;
  amount: number;
  description: string;
  timestamp: string;
}

interface Investment {
  id: number;
  name: string;
  investment_type: string;
  current_value: number;
  start_date?: string;
  end_date?: string;
  duration?: number;
  is_active?: boolean;
  status?: string;
}

interface Loan {
  id: number;
  loan_type: string;
  amount: number;           // Importo totale del prestito
  remaining_amount?: number; // Importo rimanente da pagare
  status: string;
  purpose?: string;
  interest_rate?: number;
  start_date?: string;
  maturity_date?: string;
  term_months?: number;
}

interface InsurancePolicy {
  id: number;
  policy_number: string;
  policy_type: string;
  status: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  // Verifica che accounts sia sempre un array
  useEffect(() => {
    if (accounts && !Array.isArray(accounts)) {
      console.error('accounts non è un array:', accounts);
      setAccounts([]);
    }
  }, [accounts]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState({
    accounts: true,
    transactions: true,
    investments: true,
    loans: true,
    insurance: true
  });
  const [error, setError] = useState<string | null>(null);

  // Funzione per calcolare il saldo totale di tutti i conti
  const getTotalBalance = () => {
    // Verifichiamo che accounts sia un array e non vuoto
    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) return '0.00';
    
    try {
      const total = accounts.reduce((sum, account) => {
        // Assicuriamoci che il balance sia un numero valido
        const balance = typeof account.balance === 'string' 
          ? parseFloat(account.balance) 
          : (typeof account.balance === 'number' ? account.balance : 0);
        
        return sum + (isNaN(balance) ? 0 : balance);
      }, 0);
      
      return total.toFixed(2);
    } catch (error) {
      console.error('Errore nel calcolo del saldo totale:', error);
      return '0.00';
    }
  };

  // Funzione per calcolare il valore totale degli investimenti
  const getTotalInvestmentsValue = () => {
    const total = investments.reduce((sum, investment) => {
      const value = parseFloat(String(investment.current_value || 0));
      return sum + (isNaN(value) ? 0 : value);
    }, 0);
    return parseFloat(String(total)).toFixed(2);
  };
  
  // Funzione per filtrare gli investimenti attivi (senza end_date o con is_active=true)
  const getActiveInvestments = () => {
    console.log('Analisi investimenti:', investments);
    
    // Verifichiamo le proprietà effettivamente presenti
    if (investments.length > 0) {
      console.log('Esempio di investimento:', investments[0]);
      console.log('Proprietà disponibili:', Object.keys(investments[0]));
    }
    
    return investments.filter(investment => {
      // Un investimento è attivo se:
      // - Ha una proprietà is_active impostata a true, OPPURE
      // - NON ha una proprietà end_date impostata, OPPURE
      // - Ha una proprietà status impostata a 'active' o 'open'
      const isActive = 
        (investment.hasOwnProperty('is_active') && investment.is_active === true) ||
        (investment.hasOwnProperty('end_date') && !investment.end_date) ||
        (investment.hasOwnProperty('status') && investment.status && ['active', 'open'].includes(investment.status.toLowerCase()));
      
      console.log(`Investimento ${investment.id} - ${investment.name} è attivo? ${isActive}`);
      console.log('Dettagli:', {
        has_is_active: investment.hasOwnProperty('is_active'),
        is_active_value: investment.is_active,
        has_end_date: investment.hasOwnProperty('end_date'),
        end_date_value: investment.end_date,
        has_status: investment.hasOwnProperty('status'),
        status_value: investment.status
      });
      
      return isActive;
    });
  };

  // Funzione per calcolare il totale dei prestiti attivi
  const getTotalLoansAmount = () => {
    // Consideriamo tutti i prestiti con stato diverso da "closed", "rejected" o "completed"
    // poiché potrebbero esserci terminologie diverse nell'API
    const activeLoans = loans.filter(loan => {
      const loanStatus = (loan.status || '').toLowerCase();
      const isActive = !['closed', 'rejected', 'completed', 'denied'].includes(loanStatus);
      return isActive;
    });
    
    // Se non ci sono prestiti attivi, ritorna 0
    if (activeLoans.length === 0) {
      return '0.00';
    }
    
    const total = activeLoans.reduce((sum, loan) => {
      // Gestione del tipo di dato per l'importo del prestito
      // Prima controlliamo remaining_amount, poi amount
      let amountValue = 0;
      
      // Se c'è remaining_amount, lo usiamo (è l'importo rimanente da pagare)
      if (loan.remaining_amount !== undefined && loan.remaining_amount !== null) {
        if (typeof loan.remaining_amount === 'string') {
          // Rimuovi eventuali simboli di valuta o virgole, poi converti
          const strValue = String(loan.remaining_amount);
          const cleanedValue = strValue.replace(/[^0-9.-]+/g, '');
          amountValue = parseFloat(cleanedValue);
        } else {
          amountValue = Number(loan.remaining_amount);
        }
      } 
      // Altrimenti usiamo amount (importo originale del prestito)
      else if (loan.amount !== undefined && loan.amount !== null) {
        if (typeof loan.amount === 'string') {
          // Rimuovi eventuali simboli di valuta o virgole, poi converti
          const strValue = String(loan.amount);
          const cleanedValue = strValue.replace(/[^0-9.-]+/g, '');
          amountValue = parseFloat(cleanedValue);
        } else {
          amountValue = Number(loan.amount);
        }
      }
      
      // Verifica che il valore sia un numero valido
      return sum + (isNaN(amountValue) ? 0 : amountValue);
    }, 0);
    
    // Formatta il risultato con due decimali
    return total.toFixed(2);
  };

  useEffect(() => {
    // Funzione per recuperare i dati degli account
    const fetchAccounts = async () => {
      // Creiamo un array di URL da provare, in ordine di priorità
      // Utilizziamo l'URL corretto basato sulla configurazione attuale del backend
      const urlsToTry = [
        '/api/accounts/',  // URL corretto basato sulla configurazione del router Django
      ];
      
      let successful = false;
      
      // Iteriamo sugli URL finché non troviamo quello che funziona
      for (const url of urlsToTry) {
        if (successful) break;
        
        try {
          console.log(`Tentativo di accesso all'API con URL: ${url}`);
          
          // Recupera il token di autenticazione
          const token = localStorage.getItem('access_token');
          if (!token) {
            console.error('Token di autenticazione non trovato');
            throw new Error('Token di autenticazione non trovato');
          }
          
          // Imposta l'header di autorizzazione
          const headers = { 'Authorization': `Bearer ${token}` };
          
          // Effettua la richiesta con l'header di autorizzazione
          const response = await axios.get(url, { headers });
          console.log(`Risposta ricevuta da ${url}:`, response.data);
          
          // Gestisci con maggiore sicurezza i dati ricevuti
          let accountsData = [];
          
          if (response.data && Array.isArray(response.data)) {
            accountsData = response.data;
          } else if (response.data && Array.isArray(response.data.results)) {
            accountsData = response.data.results;
          } else if (response.data && typeof response.data === 'object') {
            // Potrebbe essere un singolo account o un oggetto con proprietà diverse
            console.log('Tipo di risposta non standard per gli account:', response.data);
            // Proviamo a convertire in array se possibile
            if (response.data.id) {
              accountsData = [response.data]; // Singolo account
            }
          }
          
          if (accountsData.length > 0) {
            console.log(`URL funzionante: ${url} - ${accountsData.length} account trovati`);
            setAccounts(accountsData);
            setError(null); // Pulisci eventuali errori precedenti
            successful = true;
          } else {
            console.log(`L'URL ${url} ha risposto, ma non sono stati trovati account`);
            // Se l'utente non ha account, è comunque un successo di comunicazione API
            setAccounts([]);
            setError(null);
            successful = true;
          }
        } catch (err: any) {
          // Registra l'errore ma continua con il prossimo URL
          console.error(`Errore con l'URL ${url}:`, err);
          
          // Mostriamo i dettagli sull'errore nella console
          console.log('Dettagli errore:', {
            url,
            message: err.message,
            status: err.response?.status,
            statusText: err.response?.statusText,
            data: err.response?.data
          });
        }
      }
      
      // Se nessun URL ha funzionato, mostro un errore completo
      if (!successful) {
        setError(
          'Impossibile caricare i dati degli account. ' +
          'Si è tentato di accedere alle API con: ' + urlsToTry.join(', ') + '. ' +
          'Assicurati che il backend sia in esecuzione su http://localhost:8000'
        );
      }
      
      // Indipendentemente dal risultato, imposta lo stato di caricamento come completato
      setLoading(prev => ({ ...prev, accounts: false }));
    };

    // Funzione per recuperare le transazioni recenti
    const fetchRecentTransactions = async () => {
      try {
        const response = await axios.get('/api/transactions/');
        setRecentTransactions(response.data.results.slice(0, 5)); // Prendi solo le prime 5
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    };

    // Funzione per recuperare gli investimenti
    const fetchInvestments = async () => {
      try {
        const response = await axios.get('/api/investments/');
        setInvestments(response.data.results);
      } catch (err) {
        console.error('Error fetching investments:', err);
      } finally {
        setLoading(prev => ({ ...prev, investments: false }));
      }
    };

    // Funzione per recuperare i prestiti
    const fetchLoans = async () => {
      try {
        const response = await axios.get('/api/loans/');
        console.log('Risposta API prestiti (raw):', response.data);
        
        // Assicuriamoci di gestire correttamente la risposta
        const loansData = response.data.results || response.data || [];
        console.log('Dati prestiti processati (array):', loansData);
        
        // Verifichiamo la struttura del primo prestito se disponibile
        if (loansData.length > 0) {
          console.log('Esempio struttura prestito:', loansData[0]);
          console.log('Campi disponibili nel prestito:', Object.keys(loansData[0]));
          
          // Verifichiamo in particolare i campi amount e remaining_amount
          const sampleLoan = loansData[0];
          console.log('Sample loan - amount:', sampleLoan.amount, typeof sampleLoan.amount);
          console.log('Sample loan - remaining_amount:', sampleLoan.remaining_amount, typeof sampleLoan.remaining_amount);
        }
        
        setLoans(loansData);
      } catch (err) {
        console.error('Error fetching loans:', err);
      } finally {
        setLoading(prev => ({ ...prev, loans: false }));
      }
    };

    // Funzione per recuperare le polizze assicurative
    const fetchInsurancePolicies = async () => {
      try {
        const response = await axios.get('/api/insurance-policies/');
        setInsurancePolicies(response.data.results);
      } catch (err) {
        console.error('Error fetching insurance policies:', err);
      } finally {
        setLoading(prev => ({ ...prev, insurance: false }));
      }
    };

    // Carica tutti i dati necessari
    fetchAccounts();
    fetchRecentTransactions();
    fetchInvestments();
    fetchLoans();
    fetchInsurancePolicies();
  }, []);

  // Funzione di rendering per mostrare lo stato di caricamento o errore
  const renderLoading = (isLoading: boolean, data: any[]) => {
    if (isLoading) {
      return <CircularProgress size={24} />;
    } 
    if (data.length === 0) {
      return <Typography variant="body2" color="text.secondary">Nessun dato disponibile</Typography>;
    }
    return null;
  };

  // Funzione per formattare i numeri come valuta Euro
  const formatCurrency = (amount: number | string) => {
    // Assicuriamoci che amount sia un numero
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Controlliamo se è un numero valido
    if (isNaN(numericAmount)) {
      return '€0,00'; // Valore predefinito in caso di errore
    }
    
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericAmount);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom component="h1">
            Dashboard Finanziaria
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Benvenuto, {user ? user.username : 'Utente'}. Ecco il riepilogo dei tuoi conti.
          </Typography>
        </Box>
        <Box>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            sx={{ 
              mr: 2, 
              borderRadius: '8px', 
              textTransform: 'none',
              backgroundColor: '#1a237e',
              '&:hover': { backgroundColor: '#303f9f' }
            }}
            onClick={() => navigate('/accounts/new')}
          >
            Nuovo Conto
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Paper elevation={3} sx={{ p: 2, mb: 2, bgcolor: '#ffebee', borderRadius: '8px' }}>
          <Typography color="error">{error}</Typography>
        </Paper>
      )}

      {/* Riepilogo finanziario */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent sx={{ pb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: '#e8f0fe', color: '#2962ff', mr: 1.5 }}>
                    <AccountBalanceIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Conti</Typography>
                </Box>
                <Tooltip title="Visualizza dettagli">
                  <IconButton size="small" component={Link} to="/accounts">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {renderLoading(loading.accounts, accounts)}
              {!loading.accounts && (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatCurrency(getTotalBalance())}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`${accounts.length} ${accounts.length === 1 ? 'conto' : 'conti'}`} 
                      size="small" 
                      sx={{ bgcolor: '#e3f2fd', color: '#1565c0', fontWeight: 'medium' }}
                    />
                    {accounts.length > 0 && (
                      <Chip 
                        icon={<ArrowUpwardIcon sx={{ fontSize: '16px !important', color: '#4caf50 !important' }} />} 
                        label="+5.2%" 
                        size="small" 
                        sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'medium' }}
                      />
                    )}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent sx={{ pb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: '#fff8e1', color: '#ff6f00', mr: 1.5 }}>
                    <TrendingUpIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Investimenti</Typography>
                </Box>
                <Tooltip title="Visualizza dettagli">
                  <IconButton size="small" component={Link} to="/investments">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {renderLoading(loading.investments, investments)}
              {!loading.investments && investments.length > 0 && (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatCurrency(parseFloat(getTotalInvestmentsValue()))}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`${investments.length} ${investments.length === 1 ? 'investimento' : 'investimenti'}`} 
                      size="small" 
                      sx={{ bgcolor: '#fff8e1', color: '#e65100', fontWeight: 'medium' }}
                    />
                    <Chip 
                      icon={<ArrowUpwardIcon sx={{ fontSize: '16px !important', color: '#4caf50 !important' }} />} 
                      label="+8.7%" 
                      size="small" 
                      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'medium' }}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent sx={{ pb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: '#e8eaf6', color: '#3949ab', mr: 1.5 }}>
                    <MonetizationOnIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Prestiti</Typography>
                </Box>
                <Tooltip title="Visualizza dettagli">
                  <IconButton size="small" component={Link} to="/loans">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {renderLoading(loading.loans, loans)}
              {!loading.loans && loans.length > 0 && (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {formatCurrency(parseFloat(getTotalLoansAmount()))}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`${loans.length} ${loans.length === 1 ? 'prestito' : 'prestiti'}`} 
                      size="small" 
                      sx={{ bgcolor: '#e8eaf6', color: '#3d5afe', fontWeight: 'medium' }}
                    />
                    <Chip 
                      icon={<ArrowDownwardIcon sx={{ fontSize: '16px !important', color: '#f44336 !important' }} />} 
                      label="-2.3%" 
                      size="small" 
                      sx={{ bgcolor: '#ffebee', color: '#d32f2f', fontWeight: 'medium' }}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', sm: '1 1 calc(50% - 12px)', md: '1 1 calc(25% - 18px)' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', height: '100%' }}>
            <CardContent sx={{ pb: 3 }}>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <Box display="flex" alignItems="center">
                  <Avatar sx={{ bgcolor: '#f3e5f5', color: '#7b1fa2', mr: 1.5 }}>
                    <SecurityIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">Assicurazioni</Typography>
                </Box>
                <Tooltip title="Visualizza dettagli">
                  <IconButton size="small" component={Link} to="/insurance">
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              {renderLoading(loading.insurance, insurancePolicies)}
              {!loading.insurance && insurancePolicies.length > 0 && (
                <>
                  <Typography variant="h4" fontWeight="bold" sx={{ mb: 1 }}>
                    {insurancePolicies.length}
                  </Typography>
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`${insurancePolicies.length} ${insurancePolicies.length === 1 ? 'polizza' : 'polizze'}`} 
                      size="small" 
                      sx={{ bgcolor: '#f3e5f5', color: '#8e24aa', fontWeight: 'medium' }}
                    />
                    <Chip 
                      label="Attive" 
                      size="small" 
                      sx={{ bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 'medium' }}
                    />
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Transazioni recenti */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" fontWeight="bold">
            Transazioni Recenti
          </Typography>
          <Button
            variant="outlined"
            size="small"
            endIcon={<VisibilityIcon />}
            component={Link}
            to="/accounts"
            sx={{ borderRadius: '8px', textTransform: 'none' }}
          >
            Vedi tutte
          </Button>
        </Box>
        <Card sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          {loading.transactions ? (
            <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress />
            </Box>
          ) : recentTransactions.length === 0 ? (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body1" align="center" color="text.secondary">
                Nessuna transazione recente
              </Typography>
              <Button 
                variant="contained" 
                size="small" 
                sx={{ mt: 2, borderRadius: '8px', textTransform: 'none' }}
                component={Link}
                to="/accounts"
              >
                Effettua una transazione
              </Button>
            </Box>
          ) : (
            <List sx={{ p: 0 }}>
              {recentTransactions.map((transaction, index) => {
                const isDeposit = transaction.transaction_type === 'deposit';
                const isWithdrawal = transaction.transaction_type === 'withdrawal';
                const isTransfer = transaction.transaction_type === 'transfer';
                
                let TransactionIcon = CompareArrowsIcon;
                let iconColor = '#1976d2';
                let bgColor = '#e3f2fd';
                
                if (isDeposit) {
                  TransactionIcon = ArrowUpwardIcon;
                  iconColor = '#4caf50';
                  bgColor = '#e8f5e9';
                } else if (isWithdrawal) {
                  TransactionIcon = ArrowDownwardIcon;
                  iconColor = '#f44336';
                  bgColor = '#ffebee';
                } else if (isTransfer) {
                  TransactionIcon = CompareArrowsIcon;
                }
                
                return (
                  <React.Fragment key={transaction.id}>
                    <ListItem sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                    }}>
                      <Box
                        sx={{
                          minWidth: 40,
                          height: 40,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: bgColor,
                          color: iconColor,
                          mr: 2,
                        }}
                      >
                        <TransactionIcon />
                      </Box>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" fontWeight="medium">
                            {transaction.description}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" color="text.secondary">
                            {new Date(transaction.timestamp).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </Typography>
                        }
                      />
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{ 
                          color: isDeposit ? 'success.main' : 
                                 isWithdrawal ? 'error.main' : 'text.primary'
                        }}
                      >
                        {isDeposit ? '+' : isWithdrawal ? '-' : ''}
                        {formatCurrency(transaction.amount)}
                      </Typography>
                    </ListItem>
                    {index < recentTransactions.length - 1 && <Divider />}
                  </React.Fragment>
                );
              })}
            </List>
          )}
        </Card>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Investimenti Attivi
            </Typography>
            {renderLoading(loading.investments, investments)}
            {!loading.investments && (
              <>
                {getActiveInvestments().length === 0 ? (
                  <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body1" align="center" color="text.secondary">
                      Nessun investimento attivo
                    </Typography>
                    <Button 
                      component={Link} 
                      to="/investments/new" 
                      variant="contained" 
                      size="small"
                      sx={{ mt: 2, borderRadius: '8px', textTransform: 'none' }}
                    >
                      Crea nuovo investimento
                    </Button>
                  </Box>
                ) : (
                  <List>
                    {getActiveInvestments()
                      .slice(0, 5) // Limitiamo a 5 investimenti
                      .map((investment) => (
                        <React.Fragment key={investment.id}>
                          <ListItem 
                            component={Link} 
                            to={`/investments/${investment.id}`}
                            sx={{ cursor: 'pointer' }}
                          >
                            <Box
                              sx={{
                                minWidth: 40,
                                height: 40,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#fff8e1',
                                color: '#ff6f00',
                                mr: 2,
                              }}
                            >
                              <TrendingUpIcon />
                            </Box>
                            <ListItemText
                              primary={investment.name}
                              secondary={investment.investment_type.charAt(0).toUpperCase() + investment.investment_type.slice(1)}
                            />
                            <Typography variant="body1" fontWeight="medium" color="primary">
                              {formatCurrency(investment.current_value)}
                            </Typography>
                          </ListItem>
                          <Divider />
                        </React.Fragment>
                      ))}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button 
                        component={Link} 
                        to="/investments" 
                        variant="outlined" 
                        size="small"
                        sx={{ borderRadius: '8px', textTransform: 'none' }}
                      >
                        Visualizza tutti gli investimenti
                      </Button>
                    </Box>
                  </List>
                )}
              </>
            )}
          </Paper>
        </Box>

        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 calc(50% - 12px)' } }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              I tuoi Conti
            </Typography>
            {renderLoading(loading.accounts, accounts)}
            {!loading.accounts && accounts.length > 0 && (
              <List>
                {accounts.map((account) => (
                  <React.Fragment key={account.id}>
                    <ListItem 
                      component={Link} 
                      to={`/accounts/${account.id}`}
                      sx={{ cursor: 'pointer' }}
                    >
                      <ListItemText
                        primary={`${account.account_type.charAt(0).toUpperCase() + account.account_type.slice(1)}`}
                        secondary={account.account_number}
                      />
                      <Typography variant="body1">
                        €{formatCurrency(account.balance).replace('€', '')}
                      </Typography>
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Button 
                    component={Link} 
                    to="/accounts/new" 
                    variant="contained" 
                    size="small"
                  >
                    Apri nuovo conto
                  </Button>
                </Box>
              </List>
            )}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
