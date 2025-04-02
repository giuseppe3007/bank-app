import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  LinearProgress,
  Avatar,
  Divider,
  Stack,
  useTheme,
  alpha
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon,
  Payment as PaymentIcon,
  AccountBalance as AccountBalanceIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  ShowChart as ChartIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface Loan {
  id: number;
  loan_number: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  start_date: string;
  end_date: string;
  status: string;
  amount_paid: number;
  remaining_amount: number;
}

const LoansList: React.FC = () => {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme(); // Spostiamo lo useTheme() al livello principale del componente

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/loans/');
        setLoans(response.data.results || response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching loans:', err);
        setError('Impossibile caricare i prestiti. ' + (err.response?.data?.detail || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, []);

  // Funzione per formattare lo stato del prestito
  const formatLoanStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'In Attesa',
      'approved': 'Approvato',
      'rejected': 'Rifiutato',
      'active': 'Attivo',
      'paid': 'Pagato',
      'defaulted': 'Insolvente'
    };
    return statusMap[status] || status;
  };

  // Funzione per ottenere il colore dello stato
  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'info' | 'default' } = {
      'pending': 'warning',
      'approved': 'info',
      'rejected': 'error',
      'active': 'success',
      'paid': 'success',
      'defaulted': 'error'
    };
    return statusMap[status] || 'default';
  };

  // Funzione per calcolare la percentuale di completamento
  const calculateCompletionPercentage = (amountPaid: number, totalAmount: number) => {
    return Math.min(100, Math.round((amountPaid / totalAmount) * 100));
  };

  return (
    <Box sx={{ px: { xs: 2, md: 0 } }}>
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between', 
          alignItems: { xs: 'flex-start', sm: 'center' }, 
          mb: 4,
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
            I tuoi Prestiti
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Gestisci e monitora tutti i tuoi prestiti in un unico posto
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          component={Link}
          to="/loans/new"
          sx={{ 
            borderRadius: '28px', 
            px: 3, 
            py: 1,
            textTransform: 'none',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              boxShadow: '0 6px 15px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)'
            },
            transition: 'all 0.2s ease-in-out'
          }}
        >
          Richiedi Prestito
        </Button>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 4, 
            borderRadius: '12px',
            '& .MuiAlert-icon': { fontSize: '24px' }
          }}
          variant="filled"
        >
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', my: 8 }}>
          <CircularProgress size={60} thickness={4} />
          <Typography variant="h6" sx={{ mt: 3, fontWeight: 'medium', color: 'text.secondary' }}>
            Caricamento prestiti in corso...
          </Typography>
        </Box>
      ) : loans.length === 0 ? (
        <Paper 
          elevation={3} 
          sx={{ 
            p: 5, 
            textAlign: 'center', 
            borderRadius: '16px',
            background: 'linear-gradient(120deg, #f5f7fa 0%, #e9eef2 100%)',
            maxWidth: '800px',
            mx: 'auto'
          }}
        >
          <Avatar 
            sx={{ 
              width: 80, 
              height: 80, 
              bgcolor: 'primary.light', 
              mx: 'auto', 
              mb: 3,
              boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)'
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Typography variant="h5" gutterBottom fontWeight="bold">
            Non hai ancora nessun prestito
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: '600px', mx: 'auto', mb: 4 }}>
            Richiedi il tuo primo prestito per realizzare i tuoi progetti e trasformare le tue idee in realtà. 
            Ottieni condizioni vantaggiose e una gestione semplificata.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={Link}
            to="/loans/new"
            size="large"
            sx={{ 
              px: 4, 
              py: 1.5, 
              borderRadius: '30px', 
              fontWeight: 'bold',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
              '&:hover': {
                boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                transform: 'translateY(-2px)'
              },
              transition: 'all 0.2s ease-in-out'
            }}
          >
            Richiedi Prestito
          </Button>
        </Paper>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }, gap: 3 }}>
          {loans.map((loan) => {
            const completionPercentage = calculateCompletionPercentage(loan.amount_paid, loan.amount);
            
            // Gestiamo il caso 'default' separatamente
            const statusColorType = getStatusColor(loan.status);
            const statusColor = statusColorType === 'default' 
              ? theme.palette.grey[500] 
              : theme.palette[statusColorType].main;
            
            // Calcoliamo la data di fine del prestito
            const startDate = new Date(loan.start_date);
            let endDateDisplay = 'Data non disponibile';
            if (loan.end_date) {
              const endDate = new Date(loan.end_date);
              endDateDisplay = endDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            } else if (loan.term_months) {
              const endDate = new Date(startDate);
              endDate.setMonth(startDate.getMonth() + loan.term_months);
              endDateDisplay = endDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
            }
            
            return (
              <Box key={loan.id}>
                <Card 
                  elevation={3} 
                  sx={{ 
                    borderRadius: '16px',
                    transition: 'all 0.3s ease',
                    overflow: 'visible',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      boxShadow: '0 12px 20px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  {/* Indicatore di stato in alto a destra */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      zIndex: 1
                    }}
                  >
                    <Chip 
                      label={formatLoanStatus(loan.status)} 
                      color={getStatusColor(loan.status)}
                      sx={{ 
                        fontWeight: 'bold',
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                        '& .MuiChip-label': { px: 2 }
                      }} 
                    />
                  </Box>
                  
                  <CardContent sx={{ pt: 3, pb: 2, px: 3, flexGrow: 1 }}>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                        €{parseFloat(String(loan.amount)).toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {loan.loan_number}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Progresso del prestito
                      </Typography>
                      <Box sx={{ mt: 1, mb: 0.5 }}>
                        <LinearProgress 
                          variant="determinate" 
                          value={completionPercentage}
                          sx={{ 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: alpha(statusColor, 0.15),
                            '& .MuiLinearProgress-bar': {
                              borderRadius: 4,
                              backgroundColor: statusColor
                            }
                          }}
                        />
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          Pagato: €{parseFloat(String(loan.amount_paid)).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" fontWeight="medium" color="text.secondary">
                          {completionPercentage}%
                        </Typography>
                      </Box>
                    </Box>
                    
                    <Stack spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main,
                            mr: 1.5
                          }}
                        >
                          <MoneyIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Rata Mensile</Typography>
                          <Typography variant="body1" fontWeight="medium">€{parseFloat(String(loan.monthly_payment)).toFixed(2)}</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(theme.palette.info.main, 0.1),
                            color: theme.palette.info.main,
                            mr: 1.5
                          }}
                        >
                          <ChartIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Tasso d'Interesse</Typography>
                          <Typography variant="body1" fontWeight="medium">{loan.interest_rate}%</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(theme.palette.warning.main, 0.1),
                            color: theme.palette.warning.main,
                            mr: 1.5
                          }}
                        >
                          <ScheduleIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Durata</Typography>
                          <Typography variant="body1" fontWeight="medium">{loan.term_months} mesi</Typography>
                        </Box>
                      </Box>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            width: 32, 
                            height: 32, 
                            bgcolor: alpha(theme.palette.success.main, 0.1),
                            color: theme.palette.success.main,
                            mr: 1.5
                          }}
                        >
                          <CalendarIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="body2" color="text.secondary">Scadenza</Typography>
                          <Typography variant="body1" fontWeight="medium">{endDateDisplay}</Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </CardContent>
                  
                  <Divider light />
                  
                  <CardActions sx={{ p: 2, justifyContent: 'center', gap: 1 }}>
                    <Button 
                      component={Link} 
                      to={`/loans/${loan.id}`}
                      variant="outlined"
                      startIcon={<ViewIcon />}
                      sx={{ borderRadius: '20px', px: 2 }}
                    >
                      Dettagli
                    </Button>
                    
                    {(loan.status === 'active' || loan.status === 'approved') && (
                      <Button 
                        component={Link} 
                        to={`/loans/${loan.id}/payment`}
                        variant="contained"
                        startIcon={<PaymentIcon />}
                        color="success"
                        sx={{ borderRadius: '20px', px: 2 }}
                      >
                        Paga Rata
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default LoansList;
