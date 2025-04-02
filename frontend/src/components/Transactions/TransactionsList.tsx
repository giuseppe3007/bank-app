import React, { useState, useEffect } from 'react';
import { 
  Typography,
  Box,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  TextField,
  InputAdornment,
  Divider,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  TablePagination,
  Tooltip,
  Fade
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { Link } from 'react-router-dom';
import axios from 'axios';

// Definiamo una interfaccia per le transazioni
interface Transaction {
  id: number;
  account: {
    id: number;
    account_number: string;
    account_type: string;
  };
  transaction_type: string;
  amount: number | string;
  description: string;
  timestamp: string;
}

const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Funzione per formattare valori monetari
  const formatCurrency = (amount: number | string) => {
    // Assicuriamoci che amount sia un numero
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    // Controlliamo se è un numero valido
    if (isNaN(numericAmount)) {
      return '€0,00'; // Valore predefinito in caso di errore
    }
    
    return new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(numericAmount);
  };

  // Funzione per formattare i tipi di transazione
  const formatTransactionType = (type: string): string => {
    switch (type) {
      case 'deposit':
        return 'Versamento';
      case 'withdrawal':
        return 'Prelievo';
      case 'transfer_in':
        return 'Bonifico ricevuto';
      case 'transfer_out':
        return 'Bonifico inviato';
      default:
        return type;
    }
  };

  // Funzione per ottenere il colore in base al tipo di transazione
  const getTransactionColor = (type: string): string => {
    switch (type) {
      case 'deposit':
      case 'transfer_in':
        return 'success';
      case 'withdrawal':
      case 'transfer_out':
        return 'error';
      default:
        return 'default';
    }
  };

  // Funzione per ottenere l'icona in base al tipo di transazione
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpwardIcon />;
      case 'withdrawal':
        return <ArrowDownwardIcon />;
      case 'transfer_in':
      case 'transfer_out':
        return <CompareArrowsIcon />;
      default:
        return <AccountBalanceIcon />;
    }
  };

  // Ottieni i dati delle transazioni dall'API
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/transactions/');
      setTransactions(response.data.results || response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError('Impossibile caricare le transazioni: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filtri per le transazioni
  const filteredTransactions = transactions.filter((transaction) => {
    // Filtro ricerca
    const matchesSearch = 
      transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.account.account_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro tipo
    let matchesFilter = true;
    if (filter !== 'all') {
      matchesFilter = transaction.transaction_type === filter;
    }

    return matchesSearch && matchesFilter;
  });

  // Gestione paginazione
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Calcola i dati da visualizzare nella pagina corrente
  const paginatedTransactions = filteredTransactions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box>
      <Card sx={{ mb: 4, p: 2, borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h4" component="h1" fontWeight="500" color="primary.main">
            Registro Transazioni
          </Typography>
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
              <TextField
                sx={{ ml: 1, flex: 1 }}
                placeholder="Cerca per descrizione o numero conto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                variant="standard"
                InputProps={{
                  disableUnderline: true,
                }}
              />
            </Paper>
          </Box>
          <Box sx={{ flex: { sm: 1, md: 1 } }}>
            <FormControl fullWidth>
              <InputLabel id="filter-label">Tipo Transazione</InputLabel>
              <Select
                labelId="filter-label"
                id="filter-select"
                value={filter}
                label="Tipo Transazione"
                onChange={(e) => setFilter(e.target.value)}
                size="small"
              >
                <MenuItem value="all">Tutte le transazioni</MenuItem>
                <MenuItem value="deposit">Versamenti</MenuItem>
                <MenuItem value="withdrawal">Prelievi</MenuItem>
                <MenuItem value="transfer_in">Bonifici ricevuti</MenuItem>
                <MenuItem value="transfer_out">Bonifici inviati</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ flex: { sm: 1 }, display: 'flex', justifyContent: 'flex-end' }}>
            <Chip 
              icon={<FilterListIcon />} 
              label={`${filteredTransactions.length} transazioni trovate`} 
              variant="outlined" 
              sx={{ borderRadius: '8px', fontWeight: 'medium' }}
            />
          </Box>
        </Box>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabella delle transazioni */}
      <Card sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredTransactions.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              Nessuna transazione trovata.
            </Typography>
          </Box>
        ) : (
          <Fade in={!loading}>
            <Box>
              <TableContainer>
                <Table sx={{ minWidth: 650 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Data e Ora</TableCell>
                      <TableCell>Tipo</TableCell>
                      <TableCell>Conto</TableCell>
                      <TableCell>Descrizione</TableCell>
                      <TableCell align="right">Importo</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow 
                        key={transaction.id}
                        sx={{ 
                          '&:last-child td, &:last-child th': { border: 0 },
                          transition: 'background-color 0.2s',
                          '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.02)' }
                        }}
                      >
                        <TableCell>
                          {new Date(transaction.timestamp).toLocaleString('it-IT', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: `${getTransactionColor(transaction.transaction_type)}.light`,
                                color: `${getTransactionColor(transaction.transaction_type)}.main`,
                              }}
                            >
                              {getTransactionIcon(transaction.transaction_type)}
                            </Box>
                            <Chip 
                              label={formatTransactionType(transaction.transaction_type)} 
                              color={getTransactionColor(transaction.transaction_type) as 'success' | 'error' | 'default'}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Link 
                            to={`/accounts/${transaction.account.id}`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                          >
                            <Tooltip title="Vai al dettaglio conto">
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: 0.5,
                                  '&:hover': { textDecoration: 'underline', color: 'primary.main' }
                                }}
                              >
                                <AccountBalanceIcon fontSize="small" />
                                {transaction.account.account_number}
                              </Typography>
                            </Tooltip>
                          </Link>
                        </TableCell>
                        <TableCell>{transaction.description}</TableCell>
                        <TableCell align="right">
                          <Typography 
                            sx={{ 
                              fontWeight: 'bold', 
                              color: 
                                transaction.transaction_type === 'deposit' || 
                                transaction.transaction_type === 'transfer_in' 
                                  ? 'success.main' 
                                  : 'error.main'
                            }}
                          >
                            {transaction.transaction_type === 'deposit' || 
                             transaction.transaction_type === 'transfer_in' 
                              ? '+' 
                              : '-'}{formatCurrency(transaction.amount)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredTransactions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Righe per pagina:"
                labelDisplayedRows={({ from, to, count }) => `${from}-${to} di ${count}`}
              />
            </Box>
          </Fade>
        )}
      </Card>
    </Box>
  );
};

export default TransactionsList;
