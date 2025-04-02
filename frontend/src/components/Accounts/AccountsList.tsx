import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Card,
  CardContent,
  CardActions,
  Grid,
  Avatar,
  Divider,
  InputBase,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  LinearProgress,
  Fade,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon,
  ArrowUpward as DepositIcon,
  ArrowDownward as WithdrawIcon,
  Delete as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  CreditCard as CreditCardIcon,
  BusinessCenter as BusinessCenterIcon,
  Savings as SavingsIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  SwapVert as SwapVertIcon,
  SortByAlpha as SortByAlphaIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  created_at: string;
  is_active: boolean;
}

const AccountsList: React.FC = () => {
  const theme = useTheme();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Gestione apertura dialogo di conferma eliminazione
  const handleOpenDeleteDialog = (account: Account) => {
    setAccountToDelete(account);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  // Gestione chiusura dialogo
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAccountToDelete(null);
  };

  // Funzione per eliminare definitivamente un conto
  const handleDeleteAccount = async () => {
    if (!accountToDelete) return;

    try {
      setDeleting(true);
      setDeleteError(null);

      // Chiamata all'API per eliminare definitivamente il conto
      await axios.delete(`/api/accounts/${accountToDelete.id}/delete_permanently/`);
      
      // Aggiorna la lista dei conti rimuovendo quello eliminato
      setAccounts(accounts.filter(account => account.id !== accountToDelete.id));
      
      // Chiudi il dialogo
      handleCloseDeleteDialog();
      
      // Mostra notifica di successo
      alert(`Il conto ${accountToDelete.account_number} è stato eliminato definitivamente.`);
    } catch (err: any) {
      console.error('Errore durante l\'eliminazione del conto:', err);
      setDeleteError(
        err.response?.data?.message || 
        'Si è verificato un errore durante l\'eliminazione del conto.'
      );
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/accounts/');
        setAccounts(response.data.results || response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching accounts:', err);
        setError('Impossibile caricare i conti. ' + (err.response?.data?.detail || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  // Funzione per formattare il tipo di conto
  const formatAccountType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'checking': 'Conto Corrente',
      'savings': 'Conto di Risparmio',
      'business': 'Conto Business'
    };
    return typeMap[type] || type;
  };
  
  // Funzione per ottenere l'icona in base al tipo di conto
  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'checking':
        return <CreditCardIcon />;
      case 'savings':
        return <SavingsIcon />;
      case 'business':
        return <BusinessCenterIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };
  
  // Funzione per ottenere il colore in base al tipo di conto
  const getAccountColor = (type: string) => {
    switch (type) {
      case 'checking':
        return '#bbdefb'; // Light Blue
      case 'savings':
        return '#c8e6c9'; // Light Green
      case 'business':
        return '#d1c4e9'; // Light Purple
      default:
        return '#e1f5fe'; // Very Light Blue
    }
  };
  
  // Filtra i conti in base alla ricerca e al filtro selezionato
  const filteredAccounts = accounts.filter(account => {
    // Filtra per termine di ricerca
    const matchesSearch = 
      account.account_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      formatAccountType(account.account_type).toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtra per tipo di conto o stato
    if (filter === 'all') return matchesSearch;
    if (filter === 'active') return matchesSearch && account.is_active;
    if (filter === 'inactive') return matchesSearch && !account.is_active;
    return matchesSearch && account.account_type === filter;
  });

  return (
    <Box sx={{ pb: 6 }}>
      <Card 
        sx={{ 
          mb: 4, 
          p: 2, 
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
          borderRadius: '16px'
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 1 }}>
              I tuoi Conti
            </Typography>
            <Typography variant="subtitle1">
              Gestisci in modo semplice tutti i tuoi conti
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/accounts/new"
            sx={{ 
              bgcolor: 'white', 
              color: theme.palette.primary.main,
              '&:hover': { bgcolor: alpha('#ffffff', 0.9) },
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
              borderRadius: '8px'
            }}
          >
            Nuovo Conto
          </Button>
        </Box>
      </Card>
      
      {/* Filtri e ricerca */}
      <Card sx={{ mb: 4, p: 2, borderRadius: '12px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)' }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, alignItems: 'center' }}>
          <Box sx={{ flex: { sm: 1, md: 2 } }}>
            <Paper
              sx={{
                p: '2px 4px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}
            >
              <IconButton sx={{ p: '10px' }} aria-label="search">
                <SearchIcon />
              </IconButton>
              <InputBase
                sx={{ ml: 1, flex: 1 }}
                placeholder="Cerca per numero o tipo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Paper>
          </Box>
          <Box sx={{ flex: { sm: 1, md: 1 } }}>
            <FormControl fullWidth>
              <InputLabel id="filter-label">Filtra per</InputLabel>
              <Select
                labelId="filter-label"
                id="filter-select"
                value={filter}
                label="Filtra per"
                onChange={(e) => setFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">Tutti i conti</MenuItem>
                <MenuItem value="active">Conti attivi</MenuItem>
                <MenuItem value="inactive">Conti inattivi</MenuItem>
                <MenuItem value="checking">Conti correnti</MenuItem>
                <MenuItem value="savings">Conti risparmio</MenuItem>
                <MenuItem value="business">Conti business</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: { sm: 1 }, display: 'flex', justifyContent: 'flex-end' }}>
            <Chip 
              icon={<FilterListIcon />} 
              label={`${filteredAccounts.length} conti trovati`} 
              variant="outlined" 
              sx={{ borderRadius: '8px', fontWeight: 'medium' }}
            />
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, borderRadius: '8px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }}>
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress sx={{ height: 6, borderRadius: 3 }} />
          </Box>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Caricamento conti in corso...
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <CircularProgress size={40} thickness={4} />
          </Box>
        </Card>
      ) : accounts.length === 0 ? (
        <Card sx={{ p: 5, textAlign: 'center', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)' }}>
          <Box sx={{ mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: theme.palette.primary.light, mx: 'auto', mb: 2 }}>
              <AccountBalanceIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Non hai ancora nessun conto
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
              Crea il tuo primo conto per iniziare a gestire le tue finanze. Con un conto potrai effettuare versamenti, prelievi e trasferimenti.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              component={Link}
              to="/accounts/new"
              sx={{ borderRadius: '8px', px: 3, py: 1, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
            >
              Apri nuovo conto
            </Button>
          </Box>
        </Card>
      ) : (
        <Fade in={!loading}>
          <Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 3 }}>
              {filteredAccounts.map((account) => {              
                const accountColor = getAccountColor(account.account_type);
                const accountIcon = getAccountIcon(account.account_type);
                return (
                  <Box key={account.id}>
                  <Card 
                    sx={{ 
                      borderRadius: '12px', 
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      height: '100%',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      position: 'relative',
                      overflow: 'visible',
                      '&:hover': { 
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                      },
                      opacity: account.is_active ? 1 : 0.85
                    }}
                  >
                    {!account.is_active && (
                      <Box 
                        sx={{ 
                          position: 'absolute', 
                          top: -10, 
                          right: -10, 
                          zIndex: 1,
                          bgcolor: 'error.main',
                          color: 'white',
                          py: 0.5,
                          px: 1.5,
                          borderRadius: '8px',
                          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                          fontWeight: 'bold',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase'
                        }}
                      >
                        Inattivo
                      </Box>
                    )}
                    <Box 
                      sx={{ 
                        height: 80, 
                        bgcolor: accountColor,
                        p: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        borderTopLeftRadius: '12px',
                        borderTopRightRadius: '12px',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: 'white', 
                            color: theme.palette.getContrastText(accountColor),
                            mr: 2,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {accountIcon}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" color="text.secondary">
                            {formatAccountType(account.account_type)}
                          </Typography>
                          <Typography variant="body2" fontWeight="medium">
                            {account.account_number}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                    <CardContent sx={{ pt: 2 }}>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Saldo disponibile
                        </Typography>
                        <Typography variant="h5" fontWeight="bold" sx={{ color: account.is_active ? 'text.primary' : 'text.disabled' }}>
                          €{parseFloat(account.balance.toString()).toFixed(2)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 2, opacity: 0.6 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          Data apertura
                        </Typography>
                        <Typography variant="body2">
                          {new Date(account.created_at).toLocaleDateString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                          })}
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                      <Box sx={{ display: 'flex', gap: 1, width: '100%' }}>
                        <Tooltip title="Visualizza dettagli">
                          <Button 
                            component={Link} 
                            to={`/accounts/${account.id}`}
                            variant="outlined"
                            size="small"
                            startIcon={<ViewIcon />}
                            sx={{ 
                              borderRadius: '8px',
                              flex: 1,
                              textTransform: 'none'
                            }}
                          >
                            Dettagli
                          </Button>
                        </Tooltip>
                        <Tooltip title="Operazioni">
                          <Button 
                            component={Link} 
                            to={`/accounts/${account.id}/transactions/new?type=deposit`}
                            variant="contained"
                            size="small"
                            color={account.is_active ? "primary" : "inherit"}
                            disabled={!account.is_active}
                            startIcon={<SwapVertIcon />}
                            sx={{ 
                              borderRadius: '8px',
                              flex: 1,
                              textTransform: 'none'
                            }}
                          >
                            Operazioni
                          </Button>
                        </Tooltip>
                        {!account.is_active && (
                          <Tooltip title="Elimina definitivamente">
                            <IconButton 
                              onClick={() => handleOpenDeleteDialog(account)}
                              color="error"
                              size="small"
                              sx={{ borderRadius: '8px', border: '1px solid', borderColor: 'error.light' }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </CardActions>
                  </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>
        </Fade>
      )}
      {/* Dialog di conferma eliminazione definitiva */}
      <Dialog
        open={deleteDialogOpen}
        onClose={!deleting ? handleCloseDeleteDialog : undefined}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: '#ffebee', color: 'error.dark', fontWeight: 'bold' }}>
          Eliminazione definitiva conto
        </DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Sei sicuro di voler eliminare definitivamente questo conto? Questa azione è irreversibile e tutti i dati del conto verranno persi.
          </Typography>
          
          {accountToDelete && (
            <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: '8px', mb: 2 }}>
              <Typography variant="body2">
                <strong>Numero conto:</strong> {accountToDelete.account_number}
              </Typography>
              <Typography variant="body2">
                <strong>Tipo:</strong> {formatAccountType(accountToDelete.account_type)}
              </Typography>
              <Typography variant="body2">
                <strong>Saldo:</strong> €{parseFloat(accountToDelete.balance.toString()).toFixed(2)}
              </Typography>
              <Typography variant="body2">
                <strong>Stato:</strong> {accountToDelete.is_active ? 'Attivo' : 'Inattivo'}
              </Typography>
            </Box>
          )}
          
          {accountToDelete?.is_active && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Non è possibile eliminare un conto attivo. Chiudi prima il conto dalla pagina di dettaglio.
            </Alert>
          )}
          
          {parseFloat(accountToDelete?.balance.toString() || '0') > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              Non è possibile eliminare un conto con saldo positivo. Preleva o trasferisci tutti i fondi prima di eliminare il conto.
            </Alert>
          )}
          
          {deleteError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {deleteError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            color="inherit"
            disabled={deleting}
          >
            Annulla
          </Button>
          <Button 
            onClick={handleDeleteAccount} 
            variant="contained" 
            color="error"
            disabled={deleting || accountToDelete?.is_active || parseFloat(accountToDelete?.balance.toString() || '0') > 0}
            startIcon={deleting ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon />}
          >
            {deleting ? 'Eliminazione in corso...' : 'Elimina definitivamente'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AccountsList;
