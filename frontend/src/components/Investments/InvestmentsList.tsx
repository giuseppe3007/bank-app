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
  Card,
  CardContent,
  Divider,
  Avatar,
  useTheme,
  Fade,
  Zoom,
  Stack
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon,
  TrendingUp as SimulateIcon,
  Close as CloseIcon,
  DeleteForever as DeleteIcon,
  AccountBalance as AccountBalanceIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as AttachMoneyIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import axios from 'axios';

interface Investment {
  id: number;
  name: string;
  investment_type: string;
  amount: number;
  interest_rate: number;
  start_date: string;
  current_value: number;
  status: string;
}

interface ProfitData {
  value: string;
  percentage: string;
  isPositive: boolean;
}

const InvestmentsList: React.FC = () => {
  const theme = useTheme();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<number | null>(null);
  const [summaryData, setSummaryData] = useState({
    totalInvested: 0,
    totalValue: 0,
    totalProfit: 0,
    profitPercentage: 0,
    activeInvestments: 0
  });

  // Gestisce l'apertura del dialog di conferma per l'eliminazione
  const handleOpenDeleteDialog = (id: number) => {
    setInvestmentToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  // Gestisce la chiusura del dialog di conferma
  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };
  
  // Elimina definitivamente un investimento chiuso
  const handleDeleteInvestment = async () => {
    if (!investmentToDelete) return;
    
    try {
      // Chiamata API per eliminare l'investimento
      await axios.delete(`/api/investments/${investmentToDelete}/`);
      
      // Aggiorna la lista degli investimenti rimuovendo quello eliminato
      setInvestments(prev => prev.filter(inv => inv.id !== investmentToDelete));
      
      // Mostra messaggio di successo temporaneo
      setError(null);
      alert('Investimento eliminato con successo!');
    } catch (err: any) {
      console.error('Error deleting investment:', err);
      setError('Impossibile eliminare l\'investimento. ' + 
              (err.response?.data?.detail || err.message || ''));
    } finally {
      // Chiude il dialog di conferma
      handleCloseDeleteDialog();
    }
  };
  
  useEffect(() => {
    // Flag per evitare aggiornamenti di stato dopo lo smontaggio del componente
    let isMounted = true;
    
    const fetchInvestments = async () => {
      try {
        if (!isMounted) return;
        setLoading(true);
        
        const response = await axios.get('/api/investments/');
        if (!isMounted) return;
        
        // Assicuriamoci che data sia sempre un array
        const data = response?.data?.results || response?.data || [];
        if (Array.isArray(data)) {
          setInvestments(data);
          setError(null);
          
          // Calcola i dati di riepilogo con validazioni aggiuntive
          if (data.length > 0) {
            try {
              // Utilizziamo parseFloat per assicurarci che i valori siano numeri
              const total = data.reduce((sum: number, inv: Investment) => {
                const amount = inv?.amount ? parseFloat(String(inv.amount)) : 0;
                return isNaN(amount) ? sum : sum + amount;
              }, 0);
              
              const currentValue = data.reduce((sum: number, inv: Investment) => {
                const value = inv?.current_value ? parseFloat(String(inv.current_value)) : 0;
                return isNaN(value) ? sum : sum + value;
              }, 0);
              
              const profit = currentValue - total;
              const percentage = total > 0 ? (profit / total) * 100 : 0;
              const active = data.filter((inv: Investment) => inv?.status === 'active').length;
              
              if (isMounted) {
                setSummaryData({
                  totalInvested: total,
                  totalValue: currentValue,
                  totalProfit: profit,
                  profitPercentage: percentage,
                  activeInvestments: active
                });
              }
            } catch (calcError) {
              console.error('Error calculating summary data:', calcError);
              // Non interrompere il flusso per errori di calcolo
            }
          }
        } else {
          console.error('Expected array but got:', typeof data);
          setInvestments([]);
          setError('Formato dati non valido ricevuto dal server');
        }
      } catch (err: any) {
        if (!isMounted) return;
        console.error('Error fetching investments:', err);
        setInvestments([]);
        setError('Impossibile caricare gli investimenti. ' + (err.response?.data?.detail || ''));
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchInvestments();
    
    // Cleanup function per evitare aggiornamenti di stato dopo lo smontaggio
    return () => {
      isMounted = false;
    };
  }, []);

  // Funzione per formattare il tipo di investimento
  const formatInvestmentType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'stock': 'Azioni',
      'bond': 'Obbligazioni',
      'mutual_fund': 'Fondi Comuni',
      'etf': 'ETF',
      'certificate_of_deposit': 'Certificati di Deposito'
    };
    return typeMap[type] || type;
  };

  // Funzione per formattare lo stato dell'investimento
  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'default' } = {
      'active': 'success',
      'closed': 'error',
      'pending': 'warning'
    };
    return statusMap[status] || 'default';
  };

  // Funzione per calcolare il guadagno/perdita
  const calculateProfit = (initialAmount: number | string, currentValue: number | string) => {
    // Assicuriamoci che i valori siano numeri
    const initialAmountNum = parseFloat(String(initialAmount || 0));
    const currentValueNum = parseFloat(String(currentValue || 0));
    
    // Calcola il profitto solo se i valori sono numeri validi
    const profit = !isNaN(currentValueNum) && !isNaN(initialAmountNum)
      ? currentValueNum - initialAmountNum
      : 0;
      
    // Calcola la percentuale solo se l'importo iniziale è maggiore di zero
    const percentage = (!isNaN(initialAmountNum) && initialAmountNum > 0)
      ? (profit / initialAmountNum) * 100
      : 0;
    
    return {
      value: parseFloat(String(profit)).toFixed(2),
      percentage: parseFloat(String(percentage)).toFixed(2),
      isPositive: profit >= 0
    };
  };

  return (
    <Box sx={{ pb: 4, maxWidth: 1200, mx: 'auto' }}>
      <Fade in={true} timeout={800}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', md: 'center' }, 
          mb: 4, 
          gap: 2,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          p: 3,
          borderRadius: 2,
          boxShadow: 3
        }}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              I tuoi Investimenti
            </Typography>
            <Typography variant="subtitle1">
              Gestisci il tuo portafoglio di investimenti e monitora i rendimenti
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/investments/new"
            sx={{ 
              bgcolor: 'background.paper', 
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'background.default',
              }
            }}
          >
            Nuovo Investimento
          </Button>
        </Box>
      </Fade>

      {error && (
        <Zoom in={true}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        </Zoom>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Caricamento investimenti...
          </Typography>
        </Box>
      ) : investments.length === 0 ? (
        <Zoom in={true}>
          <Paper elevation={3} sx={{ 
            p: 5, 
            textAlign: 'center', 
            borderRadius: 2,
            background: 'linear-gradient(to right bottom, #f5f7fa, #ffffff)',
            maxWidth: 600,
            mx: 'auto'
          }}>
            <Avatar sx={{ 
              bgcolor: 'primary.main', 
              width: 80, 
              height: 80, 
              mx: 'auto', 
              mb: 2 
            }}>
              <AccountBalanceIcon sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h5" gutterBottom fontWeight="bold">
              Non hai ancora nessun investimento
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Crea il tuo primo investimento per iniziare a far crescere il tuo capitale.
              Diversifica il tuo portafoglio e monitora i rendimenti in tempo reale.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/investments/new"
              size="large"
              sx={{ mt: 2 }}
            >
              Inizia a Investire
            </Button>
          </Paper>
        </Zoom>
      ) : (
        <>
          <Fade in={true} timeout={800}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, mb: 4 }}>
              <Card elevation={3} sx={{ 
                flex: 1,
                backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                color: 'white',
                minWidth: { xs: '100%', md: 0 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Totale Investito</Typography>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <AttachMoneyIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2 }}>€{parseFloat(String(summaryData.totalInvested)).toFixed(2)}</Typography>
                  <Typography variant="body2">
                    {summaryData.activeInvestments} investimenti attivi
                  </Typography>
                </CardContent>
              </Card>
              
              <Card elevation={3} sx={{ 
                flex: 1,
                backgroundImage: 'linear-gradient(135deg, #3a7bd5 0%, #00d2ff 100%)', 
                color: 'white',
                minWidth: { xs: '100%', md: 0 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Valore Attuale</Typography>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <ShowChartIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2 }}>€{parseFloat(String(summaryData.totalValue)).toFixed(2)}</Typography>
                  <Typography variant="body2">
                    Aggiornato in tempo reale
                  </Typography>
                </CardContent>
              </Card>
              
              <Card elevation={3} sx={{ 
                flex: 1,
                backgroundImage: summaryData.totalProfit >= 0 ? 
                  'linear-gradient(135deg, #43a047 0%, #8bc34a 100%)' : 
                  'linear-gradient(135deg, #ff5252 0%, #ff8a80 100%)', 
                color: 'white',
                minWidth: { xs: '100%', md: 0 }
              }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="bold">Rendimento Totale</Typography>
                    <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}>
                      <TimelineIcon />
                    </Avatar>
                  </Box>
                  <Typography variant="h3" sx={{ mb: 2 }}>
                    {summaryData.totalProfit >= 0 ? '+' : ''}€{parseFloat(String(summaryData.totalProfit)).toFixed(2)}
                  </Typography>
                  <Typography variant="body2">
                    {summaryData.profitPercentage >= 0 ? '+' : ''}{parseFloat(String(summaryData.profitPercentage)).toFixed(2)}% dall'investimento iniziale
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Fade>
          
          <Zoom in={true} style={{ transitionDelay: '200ms' }}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                Il tuo portafoglio investimenti
              </Typography>
              <TableContainer component={Paper} sx={{ 
                borderRadius: 2, 
                overflow: 'hidden',
                boxShadow: 3
              }}>
                <Table>
                  <TableHead sx={{ 
                    bgcolor: 'grey.100'
                  }}>
                    <TableRow>
                      <TableCell width="20%">Nome</TableCell>
                      <TableCell width="10%">Tipo</TableCell>
                      <TableCell width="10%">Capitale Iniziale</TableCell>
                      <TableCell width="10%">Tasso</TableCell>
                      <TableCell width="12%">Valore Attuale</TableCell>
                      <TableCell width="14%">Rendimento</TableCell>
                      <TableCell width="8%">Stato</TableCell>
                      <TableCell align="center" width="16%">Azioni</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {investments.map((investment) => {
                      const profit = calculateProfit(investment.amount, investment.current_value);
                      
                      return (
                        <TableRow 
                          key={investment.id}
                          sx={{
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.04)'
                            },
                            transition: 'background-color 0.2s'
                          }}
                        >
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">{investment.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              Dal {new Date(investment.start_date).toLocaleDateString('it-IT')}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatInvestmentType(investment.investment_type)}</TableCell>
                          <TableCell>€{parseFloat(String(investment.amount)).toFixed(2)}</TableCell>
                          <TableCell>
                            <Chip 
                              label={`${investment.interest_rate}%`} 
                              size="small" 
                              sx={{ 
                                fontWeight: 'bold',
                                bgcolor: theme.palette.primary.light,
                                color: 'white'
                              }}
                            />
                          </TableCell>
                          <TableCell>€{parseFloat(String(investment.current_value)).toFixed(2)}</TableCell>
                          <TableCell>
                            <Box sx={{
                              p: 0.5,
                              borderRadius: 1,
                              display: 'inline-block',
                              bgcolor: profit.isPositive ? 'success.light' : 'error.light',
                              color: 'white',
                              fontWeight: 'bold'
                            }}>
                              {profit.isPositive ? '+' : ''}€{profit.value} ({profit.isPositive ? '+' : ''}{profit.percentage}%)
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={investment.status === 'active' ? 'Attivo' : 
                                    investment.status === 'closed' ? 'Chiuso' : 'In attesa'} 
                              color={getStatusColor(investment.status)} 
                              size="small" 
                              sx={{ fontWeight: 'medium' }}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Stack direction="row" spacing={1} justifyContent="center">
                              <Tooltip title="Visualizza dettagli" arrow>
                                <IconButton 
                                  component={Link} 
                                  to={`/investments/${investment.id}`}
                                  color="primary"
                                  size="small"
                                  sx={{ boxShadow: 1 }}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>
                              {investment.status === 'active' && (
                                <>
                                  <Tooltip title="Simula rendimento" arrow>
                                    <IconButton 
                                      component={Link} 
                                      to={`/investments/${investment.id}?action=simulate`}
                                      color="success"
                                      size="small"
                                      sx={{ boxShadow: 1 }}
                                    >
                                      <SimulateIcon />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Chiudi investimento" arrow>
                                    <IconButton 
                                      component={Link} 
                                      to={`/investments/${investment.id}?action=close`}
                                      color="error"
                                      size="small"
                                      sx={{ boxShadow: 1 }}
                                    >
                                      <CloseIcon />
                                    </IconButton>
                                  </Tooltip>
                                </>
                              )}
                              {investment.status === 'closed' && (
                                <Tooltip title="Elimina definitivamente" arrow>
                                  <IconButton 
                                    onClick={() => handleOpenDeleteDialog(investment.id)}
                                    color="error"
                                    size="small"
                                    sx={{ boxShadow: 1 }}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </Stack>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Zoom>
        </>
      )}
      
      {/* Dialog di conferma per l'eliminazione */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Conferma eliminazione
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Sei sicuro di voler eliminare definitivamente questo investimento? Questa azione non può essere annullata.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Annulla
          </Button>
          <Button onClick={handleDeleteInvestment} color="error" autoFocus>
            Elimina
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvestmentsList;
