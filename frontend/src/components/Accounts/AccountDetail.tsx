import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  IconButton,
  LinearProgress,
  Skeleton,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle
} from '@mui/material';
import {
  ArrowUpward as DepositIcon,
  ArrowDownward as WithdrawIcon,
  SwapHoriz as TransferIcon,
  AccountBalance as AccountBalanceIcon,
  MoreVert as MoreVertIcon,
  ArrowBack as ArrowBackIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Numbers as NumbersIcon,
  Category as CategoryIcon,
  Schedule as ScheduleIcon,
  Receipt as ReceiptIcon,
  TrendingUp as TrendingUpIcon,
  Assignment as AssignmentIcon,
  AttachMoney as AttachMoneyIcon,
  LocalAtm as LocalAtmIcon,
  Send as SendIcon
} from '@mui/icons-material';

// Interface for Account type
interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  owner_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
}

// Interface for Transaction type
interface Transaction {
  id: number;
  account: number;
  transaction_type: string;
  amount: number;
  description: string;
  timestamp: string;
}

const AccountDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [account, setAccount] = useState<Account | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState({
    account: true,
    transactions: true
  });
  const [error, setError] = useState<string | null>(null);
  
  // Stato per il menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  
  // Stato per la finestra di conferma di chiusura conto
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [closingAccount, setClosingAccount] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch account details
    const fetchAccountDetails = async () => {
      try {
        // URL corretto per l'API
        const response = await axios.get(`/api/accounts/${id}/`);
        setAccount(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching account details:', err);
        setError(
          err.response?.data?.detail || 
          'Impossibile caricare i dettagli del conto.'
        );
      } finally {
        setLoading(prev => ({ ...prev, account: false }));
      }
    };

    // Fetch account transactions
    const fetchAccountTransactions = async () => {
      try {
        // URL corretto per l'API
        const response = await axios.get(`/api/accounts/${id}/transactions/`);
        setTransactions(response.data.results || response.data);
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(prev => ({ ...prev, transactions: false }));
      }
    };

    if (id) {
      fetchAccountDetails();
      fetchAccountTransactions();
    }
  }, [id]);

  // Function to format account type
  const formatAccountType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'checking': 'Conto Corrente',
      'savings': 'Conto di Risparmio',
      'business': 'Conto Business'
    };
    return typeMap[type] || type;
  };

  // Function to format transaction type
  const formatTransactionType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'deposit': 'Entrata',
      'withdrawal': 'Uscita',
      'transfer_in': 'Trasferimento in Entrata',
      'transfer_out': 'Trasferimento in Uscita'
    };
    return typeMap[type] || type;
  };

  // Function to get transaction color based on type
  const getTransactionColor = (type: string) => {
    if (type === 'deposit' || type === 'transfer_in') {
      return 'success.main';
    }
    return 'error.main';
  };

  // Function to get transaction sign based on type
  const getTransactionSign = (type: string) => {
    if (type === 'deposit' || type === 'transfer_in') {
      return '+';
    }
    return '-';
  };
  
  // Funzioni per gestire il menu
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };
  
  // Funzione per aprire la finestra di dialogo di conferma chiusura
  const handleOpenCloseDialog = () => {
    handleMenuClose();
    setCloseDialogOpen(true);
    setCloseError(null);
  };
  
  // Funzione per chiudere la finestra di dialogo
  const handleCloseDialog = () => {
    setCloseDialogOpen(false);
  };
  
  // Funzione per chiudere il conto
  const handleCloseAccount = async () => {
    if (!account) return;
    
    try {
      setClosingAccount(true);
      setCloseError(null);
      
      // Verifica preliminare: il saldo deve essere zero
      if (parseFloat(account.balance.toString()) > 0) {
        setCloseError('Non è possibile chiudere un conto con saldo positivo. Effettua un\'uscita o trasferisci tutti i fondi prima di chiudere il conto.');
        setClosingAccount(false);
        return;
      }
      
      // URL corretto per l'API
      const response = await axios.post(`/api/accounts/${id}/close/`);
      
      if (response.data.status === 'success') {
        // Aggiorna lo stato del conto localmente
        setAccount({
          ...account,
          is_active: false
        });
        handleCloseDialog();
        
        // Mostra una notifica di successo (puoi implementare un sistema di notifiche)
        alert(response.data.message);
      }
    } catch (err: any) {
      console.error('Errore durante la chiusura del conto:', err);
      setCloseError(
        err.response?.data?.message || 
        'Si è verificato un errore durante la chiusura del conto. Riprova più tardi.'
      );
    } finally {
      setClosingAccount(false);
    }
  };

  if (loading.account) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', height: '50vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
        <Typography variant="h6" color="text.secondary">
          Caricamento dettagli conto...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ my: 4, p: 3, borderRadius: '12px', bgcolor: '#ffebee', border: '1px solid #ffcdd2' }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight="medium">
          Si è verificato un errore
        </Typography>
        <Typography variant="body1" color="error.dark">
          {error}
        </Typography>
        <Button 
          variant="contained" 
          color="error" 
          onClick={() => navigate('/accounts')} 
          sx={{ mt: 2, borderRadius: '8px' }}
        >
          Torna alla lista conti
        </Button>
      </Box>
    );
  }

  if (!account) {
    return (
      <Box sx={{ my: 4, p: 3, borderRadius: '12px', bgcolor: '#fff8e1', border: '1px solid #ffe082' }}>
        <Typography variant="h5" color="warning.dark" gutterBottom fontWeight="medium">
          Conto non trovato
        </Typography>
        <Typography variant="body1" color="warning.dark">
          Il conto richiesto non è stato trovato o non hai i permessi per visualizzarlo.
        </Typography>
        <Button 
          variant="contained" 
          color="warning" 
          onClick={() => navigate('/accounts')} 
          sx={{ mt: 2, borderRadius: '8px' }}
        >
          Torna alla lista conti
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            variant="outlined"
            onClick={() => navigate('/accounts')}
            startIcon={<ArrowBackIcon />}
            sx={{ mr: 2, borderRadius: '8px' }}
          >
            Torna alla Lista
          </Button>
          <Typography variant="h4" component="h1" fontWeight="bold">
            Dettagli Conto
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {account.is_active && (
            <Button
              variant="outlined"
              color="error"
              onClick={handleOpenCloseDialog}
              sx={{ borderRadius: '8px' }}
            >
              Chiudi Conto
            </Button>
          )}
          <Chip
            avatar={<Avatar sx={{ bgcolor: account.is_active ? '#e8f5e9' : '#ffebee' }}>
              {account.is_active ? '✓' : '✗'}
            </Avatar>}
            label={account.is_active ? "Conto Attivo" : "Conto Inattivo"}
            color={account.is_active ? "success" : "error"}
            variant="outlined"
            sx={{ fontWeight: 'medium', px: 1 }}
          />
        </Box>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Account Info Card */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 30%' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#e8eaf6' }}>
                  <AccountBalanceIcon color="primary" />
                </Avatar>
              }
              title={
                <Typography variant="h6" fontWeight="bold">
                  Informazioni Conto
                </Typography>
              }
              action={
                <>
                  <Tooltip title="Altre azioni">
                    <IconButton onClick={handleMenuOpen}>
                      <MoreVertIcon />
                    </IconButton>
                  </Tooltip>
                  <Menu
                    anchorEl={menuAnchorEl}
                    open={Boolean(menuAnchorEl)}
                    onClose={handleMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'right',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                  >
                    <MenuItem 
                      onClick={handleOpenCloseDialog}
                      disabled={!account?.is_active}
                      sx={{ 
                        color: account?.is_active ? 'error.main' : 'text.disabled',
                        '&.Mui-disabled': {
                          opacity: 0.6
                        }
                      }}
                    >
                      <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                        {account?.is_active ? 'Chiudi Conto' : 'Conto già chiuso'}
                      </Box>
                    </MenuItem>
                  </Menu>
                </>
              }
            />
            <Divider />
            <CardContent sx={{ pt: 2 }}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <NumbersIcon color="primary" fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    Numero Conto
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ ml: 4 }}>
                  {account.account_number}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CategoryIcon color="primary" fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    Tipo Conto
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ ml: 4 }}>
                  {formatAccountType(account.account_type)}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PersonIcon color="primary" fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    Titolare
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ ml: 4 }}>
                  {account.owner_details.first_name || account.owner_details.username} {account.owner_details.last_name || ''}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <DateRangeIcon color="primary" fontSize="small" sx={{ mr: 1.5, opacity: 0.7 }} />
                  <Typography variant="body2" color="text.secondary">
                    Data Apertura
                  </Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium" sx={{ ml: 4 }}>
                  {new Date(account.created_at).toLocaleDateString('it-IT', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Balance Card */}
        <Box sx={{ flex: { xs: '1 1 100%', md: '1 1 65%' } }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', position: 'relative', overflow: 'hidden' }}>
            <Box sx={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: '8px', 
              background: 'linear-gradient(90deg, #4caf50, #2196f3, #9c27b0)' 
            }} />
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#e3f2fd' }}>
                  <TrendingUpIcon color="primary" />
                </Avatar>
              }
              title={
                <Typography variant="h6" fontWeight="bold">
                  Saldo Attuale
                </Typography>
              }
              action={
                <Chip 
                  label="Ultimo aggiornamento: oggi" 
                  size="small" 
                  sx={{ 
                    bgcolor: '#f3f4f6', 
                    fontSize: '0.75rem',
                    height: '24px'
                  }} 
                />
              }
            />
            <Divider />
            <CardContent sx={{ pt: 3, pb: 4 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                flexDirection: 'column',
                mb: 4,
                p: 3,
                bgcolor: '#f8fafc',
                borderRadius: '16px'
              }}>
                <Typography variant="overline" color="text.secondary" sx={{ mb: 1, fontWeight: 'medium' }}>
                  DISPONIBILITÀ ATTUALE
                </Typography>
                <Typography variant="h2" align="center" sx={{ 
                  mb: 1, 
                  fontWeight: 'bold',
                  background: 'linear-gradient(45deg, #1976d2, #4caf50)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  €{parseFloat(account.balance.toString()).toFixed(2)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Aggiornato al {new Date().toLocaleDateString('it-IT')}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<DepositIcon />}
                  component={Link}
                  to={`/accounts/${account.id}/transactions/new?type=deposit`}
                  sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                >
                  Entrata
                </Button>
                
                <Button
                  variant="contained"
                  color="error"
                  startIcon={<WithdrawIcon />}
                  component={Link}
                  to={`/accounts/${account.id}/transactions/new?type=withdraw`}
                  sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                >
                  Uscita
                </Button>
                
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<TransferIcon />}
                  component={Link}
                  to={`/accounts/${account.id}/transactions/new?type=transfer`}
                  sx={{ borderRadius: '8px', textTransform: 'none', px: 3 }}
                >
                  Trasferimento
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Transactions Table */}
        <Box sx={{ width: '100%' }}>
          <Card sx={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)', overflow: 'hidden' }}>
            <CardHeader
              avatar={
                <Avatar sx={{ bgcolor: '#e1f5fe' }}>
                  <ReceiptIcon color="primary" />
                </Avatar>
              }
              title={
                <Typography variant="h6" fontWeight="bold">
                  Movimenti Recenti
                </Typography>
              }
              action={
                <Button
                  variant="outlined"
                  size="small"
                  endIcon={<AssignmentIcon />}
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Estratto Conto
                </Button>
              }
            />
            <Divider />
            
            {loading.transactions ? (
              <Box sx={{ p: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Caricamento movimenti in corso...
                </Typography>
                <LinearProgress sx={{ mb: 3 }} />
                <Skeleton variant="rectangular" height={52} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={52} sx={{ mb: 1 }} />
                <Skeleton variant="rectangular" height={52} />
              </Box>
            ) : transactions.length === 0 ? (
              <Box sx={{ p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ReceiptIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                <Typography variant="body1" align="center" color="text.secondary" gutterBottom>
                  Nessuna transazione disponibile per questo conto.
                </Typography>
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
                  Effettua il tuo primo movimento utilizzando i pulsanti sopra.
                </Typography>
                <Button 
                  variant="contained" 
                  size="small"
                  startIcon={<DepositIcon />}
                  component={Link}
                  to={`/accounts/${account.id}/transactions/new?type=deposit`} 
                  sx={{ borderRadius: '8px', textTransform: 'none' }}
                >
                  Primo Versamento
                </Button>
              </Box>
            ) : (
              <TableContainer sx={{ maxHeight: '500px' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Descrizione</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Importo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction) => {
                      const isIncoming = transaction.transaction_type === 'deposit' || transaction.transaction_type === 'transfer_in';
                      const transactionColor = isIncoming ? '#e8f5e9' : '#ffebee';
                      const textColor = isIncoming ? '#2e7d32' : '#d32f2f';
                      
                      return (
                        <TableRow key={transaction.id} hover sx={{ 
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                          transition: 'background-color 0.2s'
                        }}>
                          <TableCell sx={{ borderLeft: `4px solid ${transactionColor}` }}>
                            {new Date(transaction.timestamp).toLocaleString('it-IT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                transaction.transaction_type === 'deposit' ? 'Entrata' :
                                transaction.transaction_type === 'withdrawal' ? 'Uscita' :
                                transaction.transaction_type === 'transfer' ? 'Trasferimento' :
                                transaction.transaction_type === 'transfer_in' ? 'Trasf. in entrata' :
                                transaction.transaction_type === 'transfer_out' ? 'Trasf. in uscita' : ''
                              }
                              sx={{ 
                                bgcolor: transactionColor,
                                color: textColor,
                                fontWeight: 'medium'
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography 
                              variant="body2" 
                              fontWeight="bold"
                              sx={{ color: textColor }}
                            >
                              {isIncoming ? '+' : '-'}
                              €{parseFloat(transaction.amount.toString()).toFixed(2)}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        </Box>
      </Box>
      {/* Dialog di conferma chiusura conto */}
      <Dialog
        open={closeDialogOpen}
        onClose={!closingAccount ? handleCloseDialog : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: 'error.dark', fontWeight: 'bold' }}>
          Chiusura Conto
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Sei sicuro di voler chiudere questo conto? Questa azione è irreversibile.
          </Typography>
          
          <Typography variant="body2" sx={{ mb: 2, fontWeight: 'medium' }}>
            Dettagli conto:
          </Typography>
          
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px', mb: 2 }}>
            <Typography variant="body2">
              <strong>Numero conto:</strong> {account?.account_number}
            </Typography>
            <Typography variant="body2">
              <strong>Tipo:</strong> {account ? formatAccountType(account.account_type) : ''}
            </Typography>
            <Typography variant="body2">
              <strong>Saldo:</strong> €{account ? parseFloat(account.balance.toString()).toFixed(2) : '0.00'}
            </Typography>
          </Box>
          
          {parseFloat(account?.balance.toString() || '0') > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Non è possibile chiudere un conto con saldo positivo. Effettua un'uscita o trasferisci tutti i fondi prima di chiudere il conto.
            </Alert>
          )}
          
          {closeError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {closeError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDialog} 
            color="inherit"
            disabled={closingAccount}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleCloseAccount} 
            variant="contained" 
            color="error"
            disabled={closingAccount || parseFloat(account?.balance.toString() || '0') > 0}
            startIcon={closingAccount ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {closingAccount ? 'Chiusura in corso...' : 'Chiudi Conto'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountDetail;
