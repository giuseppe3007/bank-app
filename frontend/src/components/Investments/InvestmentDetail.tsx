import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title as ChartTitle, Tooltip as ChartTooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Card,
  CardContent,
  CardHeader,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  useTheme,
  LinearProgress,
  Tooltip,
  IconButton,
  Skeleton,
  Fade,
  Zoom,
  Stack
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  MonetizationOn as MonetizationOnIcon,
  DateRange as DateRangeIcon,
  ShowChart as ShowChartIcon,
  Timeline as TimelineIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  ArrowBack as ArrowBackIcon,
  AccountBalance as AccountBalanceIcon,
  Calculate as CalculateIcon,
  Close as CloseIcon,
  TrendingUp as TrendingUpIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Registrazione dei componenti Chart.js necessari
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend);

interface Investment {
  id: number;
  name: string;
  investment_type: string;
  amount: number;
  interest_rate: number;
  start_date: string;
  end_date?: string; // Aggiunto campo end_date opzionale
  duration_months: number;
  source_account: string;
  current_value: number;
  status: string;
}

const InvestmentDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const action = queryParams.get('action');

  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(action === 'simulate');
  
  // Funzione per gestire l'apertura del dialogo di simulazione
  const handleOpenSimulation = () => {
    console.log('Apertura dialogo simulazione');
    setSimulationOpen(true);
  };
  const [closeDialogOpen, setCloseDialogOpen] = useState(action === 'close');
  const [simulationData, setSimulationData] = useState({
    futureValue: 0,
    totalInterest: 0,
    monthsElapsed: 0,
    monthsRemaining: 0,
    completionPercentage: 0
  });
  
  const [investmentChartData, setInvestmentChartData] = useState<{months: string[], values: number[]}>({months: [], values: []});

  // Formatta il tipo di investimento
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

  // Formatta lo stato dell'investimento
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'default' } = {
      'active': 'success',
      'closed': 'error',
      'pending': 'warning'
    };
    return statusMap[status] || 'default';
  };

  // Calcola guadagno/perdita
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

  // Calcola il tempo trascorso e rimanente
  const calculateTimeProgress = (startDate: string, durationMonths: number) => {
    console.log('Calcolo progresso con start date:', startDate, 'e durata:', durationMonths);
    
    // Validazione input
    if (!startDate || typeof startDate !== 'string' || isNaN(durationMonths) || durationMonths <= 0) {
      console.error('Dati non validi per calcolo progresso:', { startDate, durationMonths });
      return {
        monthsElapsed: 0,
        monthsRemaining: durationMonths > 0 ? durationMonths : 0,
        completionPercentage: 0
      };
    }
    
    try {
      const start = new Date(startDate);
      const now = new Date();
      
      // Verifica che le date siano valide
      if (isNaN(start.getTime())) {
        console.error('Data di inizio non valida:', startDate);
        return {
          monthsElapsed: 0,
          monthsRemaining: durationMonths,
          completionPercentage: 0
        };
      }
      
      // Calcola i mesi trascorsi
      const diffYears = now.getFullYear() - start.getFullYear();
      const diffMonths = now.getMonth() - start.getMonth();
      const monthsElapsed = diffYears * 12 + diffMonths;
      
      // Assicurati che i mesi trascorsi non siano negativi e non superino la durata
      const adjustedMonthsElapsed = Math.max(0, Math.min(durationMonths, monthsElapsed));
      const monthsRemaining = Math.max(0, durationMonths - adjustedMonthsElapsed);
      
      // Calcola la percentuale di completamento
      const completionPercentage = durationMonths > 0 ? (adjustedMonthsElapsed / durationMonths) * 100 : 0;
      
      console.log('Risultato calcolo progresso:', {
        monthsElapsed: adjustedMonthsElapsed,
        monthsRemaining,
        completionPercentage
      });
      
      return {
        monthsElapsed: adjustedMonthsElapsed,
        monthsRemaining,
        completionPercentage: Math.min(completionPercentage, 100)
      };
    } catch (error) {
      console.error('Errore nel calcolo del progresso:', error);
      return {
        monthsElapsed: 0,
        monthsRemaining: durationMonths,
        completionPercentage: 0
      };
    }
  };

  // Simulazione del valore futuro
  const simulateFutureValue = (
    initialAmount: number, 
    interestRate: number, 
    durationMonths: number, 
    monthsElapsed: number
  ) => {
    console.log('Simulazione con valori:', {
      initialAmount,
      interestRate,
      durationMonths,
      monthsElapsed
    });
    
    // Validazione input
    if (isNaN(initialAmount) || isNaN(interestRate) || 
        isNaN(durationMonths) || isNaN(monthsElapsed)) {
      console.error('Dati non validi per simulazione:', {
        initialAmount,
        interestRate,
        durationMonths,
        monthsElapsed
      });
      return {
        futureValue: 0,
        totalInterest: 0
      };
    }
    
    try {
      // Formula per calcolare il valore futuro con interesse composto
      const rateDecimal = interestRate / 100;
      const monthlyRate = rateDecimal / 12;
      const remainingMonths = Math.max(0, durationMonths - monthsElapsed);
      
      // Calcola valore attuale basato sui mesi trascorsi
      const currentValue = initialAmount * Math.pow(1 + monthlyRate, Math.min(monthsElapsed, durationMonths));
      
      // Calcola valore futuro alla maturità
      const futureValue = currentValue * Math.pow(1 + monthlyRate, remainingMonths);
      
      // Calcola l'interesse totale
      const totalInterest = futureValue - initialAmount;
      
      console.log('Risultato simulazione:', {
        futureValue,
        totalInterest,
        monthlyRate,
        remainingMonths
      });
      
      // Verifica che i valori siano numeri validi
      return {
        futureValue: isNaN(futureValue) ? initialAmount : futureValue,
        totalInterest: isNaN(totalInterest) ? 0 : totalInterest
      };
    } catch (error) {
      console.error('Errore nella simulazione:', error);
      return {
        futureValue: initialAmount,
        totalInterest: 0
      };
    }
  };

  // Carica i dati dell'investimento
  useEffect(() => {
    const fetchInvestmentDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/investments/${id}/`);
        setInvestment(response.data);
        setError(null);

        // Se l'investimento è stato caricato con successo, calcola i dati di simulazione
        if (response.data) {
          const { amount, interest_rate, duration_months, start_date } = response.data;
          
          // Converte i valori in numeri per sicurezza
          const amountNum = parseFloat(String(amount)) || 0;
          const rateNum = parseFloat(String(interest_rate)) || 0;
          const durationNum = parseInt(String(duration_months)) || 0;
          
          console.log('Dati investimento convertiti:', {
            amountNum,
            rateNum,
            durationNum,
            start_date
          });
          
          // Calcola il progresso temporale
          const timeProgress = calculateTimeProgress(start_date, durationNum);
          
          // Simula il valore futuro
          const simulation = simulateFutureValue(
            amountNum, 
            rateNum, 
            durationNum, 
            timeProgress.monthsElapsed
          );
          
          setSimulationData({
            ...simulation,
            ...timeProgress
          });
          
          // Genera i dati per il grafico dell'andamento
          const months: string[] = [];
          const values: number[] = [];
          
          // Calcola il valore per ogni mese fino alla scadenza
          for (let month = 0; month <= durationNum; month++) {
            const monthYears = month / 12;
            const monthValue = amountNum * Math.pow(1 + (rateNum / 100), monthYears);
            months.push(`Mese ${month}`);
            values.push(parseFloat(monthValue.toFixed(2)));
          }
          
          setInvestmentChartData({ months, values });
        }
      } catch (err: any) {
        console.error('Error fetching investment details:', err);
        setError('Impossibile caricare i dettagli dell\'investimento. ' + 
                (err.response?.data?.detail || err.message || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchInvestmentDetails();
  }, [id]);

  // Gestisci la chiusura dell'investimento
  const handleCloseInvestment = async () => {
    try {
      console.log('Tentativo di chiusura investimento ID:', id);
      
      if (!investment) {
        throw new Error('Dati dell\'investimento non disponibili');
      }
      
      // Ricarichiamo i dati più aggiornati dell'investimento per assicurarci di avere tutti i campi richiesti
      const currentInvestmentResponse = await axios.get(`/api/investments/${id}/`);
      const currentInvestment = currentInvestmentResponse.data;
      
      // Prepariamo un payload completo con tutti i campi obbligatori
      // Sembrano esserci dei problemi con il PATCH parziale per questo endpoint
      const updateData = {
        ...currentInvestment,
        status: 'closed',
        // Convertiamo esplicitamente il valore in stringa per evitare problemi di tipo
        current_value: String(currentInvestment.current_value),
        // Assicuriamoci che l'ID dell'account sia un numero
        account: typeof currentInvestment.account === 'string' 
          ? parseInt(currentInvestment.account, 10) 
          : currentInvestment.account,
      };
      
      console.log('Dati inviati per aggiornamento:', updateData);
      
      // Poiché la richiesta PATCH sembra avere problemi, usiamo PUT che sostituisce l'intera risorsa
      const response = await axios.put(`/api/investments/${id}/`, updateData);
      
      console.log('Risposta aggiornamento:', response.data);
      
      // Aggiorna lo stato locale
      if (investment) {
        setInvestment({
          ...investment,
          status: 'closed'
        });
      }
      
      // Chiudi il dialog
      setCloseDialogOpen(false);
      
      // Mostra un messaggio di successo
      setError(null);
      alert('Investimento chiuso con successo!');
    } catch (err: any) {
      console.error('Error closing investment:', err);
      console.error('Response data:', err.response?.data);
      setError('Impossibile chiudere l\'investimento. ' + 
              (err.response?.data?.detail || err.message || 'Errore interno del server. Verifica la console per dettagli.'));
    }
  };

  // Se è in caricamento, mostra indicatore
  if (loading) {
    return (
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          to="/investments"
          sx={{ mb: 3 }}
        >
          Torna agli Investimenti
        </Button>
        
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={300} />
      </Box>
    );
  }

  // Se c'è un errore, mostra messaggio
  if (error) {
    return (
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          to="/investments"
          sx={{ mb: 3 }}
        >
          Torna agli Investimenti
        </Button>
        
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Se non c'è investimento, mostra messaggio
  if (!investment) {
    return (
      <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          component={Link} 
          to="/investments"
          sx={{ mb: 3 }}
        >
          Torna agli Investimenti
        </Button>
        
        <Alert severity="warning">
          Investimento non trovato
        </Alert>
      </Box>
    );
  }

  // Calcola dati aggiuntivi per la visualizzazione
  const profit = calculateProfit(investment.amount, investment.current_value);
  const isActive = investment.status === 'active';

  return (
    <Box sx={{ py: 4, maxWidth: 1200, mx: 'auto' }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        component={Link} 
        to="/investments"
        sx={{ mb: 3 }}
      >
        Torna agli Investimenti
      </Button>
      
      <Fade in={true} timeout={800}>
        <Box sx={{ 
          mb: 4, 
          p: 3, 
          borderRadius: 2, 
          backgroundColor: 'primary.main',
          color: 'primary.contrastText'
        }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', md: 'calc(66.666% - 16px)' } }}>
              <Typography variant="h4" component="h1" fontWeight="bold">
                {investment.name}
              </Typography>
              <Typography variant="subtitle1">
                {formatInvestmentType(investment.investment_type)} • 
                ID: {investment.id}
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', md: 'calc(33.333% - 16px)' }, textAlign: { xs: 'left', md: 'right' } }}>
              <Chip 
                label={investment.status === 'active' ? 'Attivo' : 
                      investment.status === 'closed' ? 'Chiuso' : 'In attesa'} 
                color={getStatusColor(investment.status)}
                sx={{ fontWeight: 'bold', fontSize: '0.9rem', my: 1 }}
              />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Avviato il {new Date(investment.start_date).toLocaleDateString('it-IT')}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Fade>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {/* Panoramica investimento */}
        <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', md: 'calc(66.666% - 24px)' } }}>
          <Zoom in={true} timeout={500}>
            <Card elevation={3} sx={{ height: '100%' }}>
              <CardHeader 
                title="Panoramica Investimento" 
                avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><ShowChartIcon /></Avatar>}
              />
              <Divider />
              <CardContent>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Capitale Investito
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        €{parseFloat(String(investment.amount)).toFixed(2)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Tipo Investimento
                      </Typography>
                      <Typography variant="h6">
                        {formatInvestmentType(investment.investment_type)}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Conto di Origine
                      </Typography>
                      <Typography variant="h6">
                        {investment.source_account ? `#${investment.source_account}` : 'Non specificato'}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Tasso di Interesse
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        {parseFloat(String(investment.interest_rate)).toFixed(2)}%
                      </Typography>
                    </Box>
                    
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data Fine
                      </Typography>
                      <Typography variant="h6">
                        {(() => {
                          // Gestisce la visualizzazione della data di fine
                          if (investment.end_date) {
                            // Converti la data nel formato locale italiano
                            try {
                              const endDate = new Date(investment.end_date);
                              return endDate.toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                            } catch (e) {
                              console.error('Errore nella formattazione della data di fine:', e);
                              return investment.end_date; // fallback al formato originale
                            }
                          } 
                          
                          // Se non c'è una data di fine esplicita ma ci sono la data di inizio e la durata,
                          // calcoliamo la data di fine
                          if (investment.start_date && investment.duration_months) {
                            try {
                              const startDate = new Date(investment.start_date);
                              let duration = 0;
                              
                              // Convertiamo la durata in numero se necessario
                              if (typeof investment.duration_months === 'number') {
                                duration = investment.duration_months;
                              } else {
                                duration = parseFloat(String(investment.duration_months));
                              }
                              
                              if (isNaN(duration)) {
                                return 'Non specificata';
                              }
                              
                              const endDate = new Date(startDate);
                              endDate.setMonth(endDate.getMonth() + Math.round(duration));
                              
                              return endDate.toLocaleDateString('it-IT', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric'
                              });
                            } catch (e) {
                              console.error('Errore nel calcolo della data di fine:', e);
                            }
                          }
                          
                          return 'Non specificata';
                        })()}
                      </Typography>
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">
                        Data di Inizio
                      </Typography>
                      <Typography variant="h6">
                        {new Date(investment.start_date).toLocaleDateString('it-IT')}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Zoom>
        </Box>
        
        {/* Performance */}
        <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', md: 'calc(33.333% - 24px)' } }}>
          <Zoom in={true} timeout={700}>
            <Card 
              elevation={3} 
              sx={{ 
                backgroundImage: profit.isPositive ? 
                  'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)' :
                  'linear-gradient(135deg, #e53935 0%, #c62828 100%)',
                color: 'white',
                height: '100%'
              }}
            >
              <CardHeader 
                title="Performance" 
                titleTypographyProps={{ color: 'white' }}
                avatar={
                  <Avatar sx={{ bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                    {profit.isPositive ? <ArrowUpwardIcon /> : <ArrowDownwardIcon />}
                  </Avatar>
                }
              />
              <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />
              <CardContent>
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Valore Attuale
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
                    €{parseFloat(String(investment.current_value)).toFixed(2)}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>
                    Guadagno/Perdita
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {profit.isPositive ? '+' : ''}€{profit.value}
                    <Typography component="span" sx={{ ml: 1, fontSize: '1rem' }}>
                      ({profit.isPositive ? '+' : ''}{profit.percentage}%)
                    </Typography>
                  </Typography>
                </Box>
                
                {isActive && (
                  <Box sx={{ mt: 4 }}>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.8 }}>
                      Avanzamento: {simulationData.monthsElapsed} di {investment.duration_months} mesi
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={simulationData.completionPercentage} 
                      sx={{ 
                        height: 10, 
                        borderRadius: 5,
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        '& .MuiLinearProgress-bar': {
                          backgroundColor: 'white'
                        }
                      }} 
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Zoom>
        </Box>
        
        {/* Risultati simulazione/azioni disponibili */}
        {isActive && (
          <Box sx={{ width: '100%' }}>
            <Zoom in={true} timeout={900}>
              <Card elevation={3}>
                <CardHeader 
                  title="Azioni Disponibili" 
                  avatar={<Avatar sx={{ bgcolor: 'primary.main' }}><CalculateIcon /></Avatar>}
                />
                <Divider />
                <CardContent>
                  <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
                    <Box sx={{ width: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <TrendingUpIcon sx={{ mr: 1 }} color="primary" />
                            Simulazione alla Maturità
                          </Typography>
                          
                          <Box sx={{ height: 250, mb: 3 }}>
                            <Line
                              data={{
                                labels: investmentChartData.months,
                                datasets: [
                                  {
                                    label: 'Valore dell\'investimento',
                                    data: investmentChartData.values,
                                    borderColor: '#1976d2',
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    fill: true,
                                    tension: 0.4,
                                    pointRadius: investmentChartData.months.length > 24 ? 0 : 3,
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
                          
                          <List>
                            <ListItem>
                              <ListItemText 
                                primary="Valore Previsto alla Maturità" 
                                secondary={`€${!isNaN(simulationData.futureValue) ? parseFloat(String(simulationData.futureValue)).toFixed(2) : '0.00'}`}
                                secondaryTypographyProps={{ color: 'primary', fontWeight: 'bold', fontSize: '1.1rem' }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Interesse Totale Previsto" 
                                secondary={`€${!isNaN(simulationData.totalInterest) ? parseFloat(String(simulationData.totalInterest)).toFixed(2) : '0.00'}`}
                                secondaryTypographyProps={{ color: 'success.main', fontWeight: 'bold', fontSize: '1.1rem' }}
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Tempo Rimanente" 
                                secondary={`${!isNaN(simulationData.monthsRemaining) ? Math.round(simulationData.monthsRemaining) : 0} mesi`}
                              />
                            </ListItem>
                          </List>
                          
                          <Button
                            variant="contained"
                            startIcon={<CalculateIcon />}
                            onClick={handleOpenSimulation}
                            sx={{ mt: 2 }}
                            color="primary"
                            fullWidth
                          >
                            Simula Scenari
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>
                    
                    <Box sx={{ width: '100%' }}>
                      <Card variant="outlined" sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                            <InfoIcon sx={{ mr: 1 }} color="warning" />
                            Chiusura Anticipata
                          </Typography>
                          
                          <Typography variant="body2" color="text.secondary" paragraph>
                            Se chiudi anticipatamente questo investimento, riceverai il valore attuale mostrato sopra.
                            Potrebbero applicarsi penali o commissioni in base ai termini dell'investimento.
                          </Typography>
                          
                          <Alert severity="warning" sx={{ mb: 3 }}>
                            La chiusura di un investimento è irreversibile.
                          </Alert>
                          
                          <Button
                            variant="outlined"
                            startIcon={<CloseIcon />}
                            onClick={() => setCloseDialogOpen(true)}
                            sx={{ mt: 2 }}
                            color="error"
                            fullWidth
                          >
                            Chiudi Investimento
                          </Button>
                        </CardContent>
                      </Card>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Zoom>
          </Box>
        )}
      </Box>
      
      {/* Dialogo per simulazione */}
      <Dialog
        open={simulationOpen}
        onClose={() => setSimulationOpen(false)}
        maxWidth="md"
        fullWidth
        sx={{ zIndex: 1300 }} // Assicura che il dialogo sia sopra altri elementi
      >
        <DialogTitle>
          Simulazione Scenari per {investment.name}
        </DialogTitle>
        <DialogContent>
          <DialogContentText paragraph>
            Questo è un calcolo simulato del valore futuro del tuo investimento basato sul tasso di interesse corrente.
            I risultati effettivi potrebbero variare in base alle condizioni di mercato.
          </DialogContentText>
          
          <Box sx={{ height: 250, width: '100%', mb: 4 }}>
            <Line
              data={{
                labels: investmentChartData.months,
                datasets: [
                  {
                    label: 'Valore dell\'investimento',
                    data: investmentChartData.values,
                    borderColor: '#1976d2',
                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: investmentChartData.months.length > 24 ? 0 : 3,
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
                  title: {
                    display: true,
                    text: 'Andamento dell\'investimento nel tempo',
                    font: {
                      size: 16
                    }
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
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 2 }}>
            <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
              <Typography variant="subtitle2" color="text.secondary">
                Capitale Investito
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                €{parseFloat(String(investment.amount)).toFixed(2)}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Tasso di Interesse
              </Typography>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {parseFloat(String(investment.interest_rate)).toFixed(2)}%
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Durata Investimento
              </Typography>
              <Typography variant="h6">
                {investment.duration_months} mesi
              </Typography>
            </Box>
            
            <Box sx={{ flexGrow: 1, flexBasis: { xs: '100%', sm: 'calc(50% - 12px)' } }}>
              <Typography variant="subtitle2" color="text.secondary">
                Valore Previsto alla Maturità
              </Typography>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold', mb: 2 }}>
                €{parseFloat(String(simulationData.futureValue)).toFixed(2)}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Interesse Totale Previsto
              </Typography>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold', mb: 2 }}>
                €{parseFloat(String(simulationData.totalInterest)).toFixed(2)}
              </Typography>
              
              <Typography variant="subtitle2" color="text.secondary">
                Rendimento Percentuale Totale
              </Typography>
              <Typography variant="h5" color="success.main" sx={{ fontWeight: 'bold' }}>
                {simulationData.totalInterest > 0 && investment.amount ? 
                  parseFloat(String((simulationData.totalInterest / parseFloat(String(investment.amount))) * 100)).toFixed(2) : '0.00'}%
              </Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSimulationOpen(false)}>Chiudi</Button>
        </DialogActions>
      </Dialog>
      
      {/* Dialogo per conferma chiusura */}
      <Dialog
        open={closeDialogOpen}
        onClose={() => setCloseDialogOpen(false)}
      >
        <DialogTitle>
          Conferma Chiusura Investimento
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Sei sicuro di voler chiudere l'investimento {investment.name}? 
            Riceverai il valore attuale di €{parseFloat(String(investment.current_value)).toFixed(2)}.
            Questa azione è irreversibile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCloseDialogOpen(false)}>Annulla</Button>
          <Button onClick={handleCloseInvestment} color="error">
            Chiudi Investimento
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default InvestmentDetail;
