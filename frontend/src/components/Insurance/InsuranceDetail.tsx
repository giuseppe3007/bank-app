import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
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
  useTheme,
  Tooltip,
  IconButton,
  Stack
} from '@mui/material';
import Grid from '../../fixes/GridFix';
import {
  HealthAndSafety as HealthAndSafetyIcon,
  DateRange as DateRangeIcon,
  AccountBalance as AccountBalanceIcon,
  ArrowBack as ArrowBackIcon,
  Paid as PaidIcon,
  Home as HomeIcon,
  DirectionsCar as DirectionsCarIcon,
  Flight as FlightIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Interfaccia per i dati della polizza assicurativa
interface InsurancePolicy {
  id: number;
  policy_number: string;
  policy_type: string;
  description: string;
  coverage_amount: string;
  premium_amount: string;
  payment_frequency: string;
  start_date: string;
  end_date: string;
  policy_holder: number;
  policy_holder_details?: {
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  status: string;
  deductible: string;
  payment_account?: string;
  created_at?: string;
}

const InsuranceDetail: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [policy, setPolicy] = useState<InsurancePolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Formatta il tipo di polizza
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

  // Ottieni l'icona appropriata per il tipo di polizza
  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'life':
        return <PersonIcon />;
      case 'health':
        return <HealthAndSafetyIcon />;
      case 'auto':
        return <DirectionsCarIcon />;
      case 'home':
        return <HomeIcon />;
      case 'travel':
        return <FlightIcon />;
      case 'business':
        return <BusinessIcon />;
      default:
        return <InfoIcon />;
    }
  };

  // Formatta lo stato della polizza
  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'default' } = {
      'active': 'success',
      'expired': 'error',
      'pending': 'warning',
      'cancelled': 'error'
    };
    return statusMap[status] || 'default';
  };

  const formatStatusText = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      'active': 'Attiva',
      'expired': 'Scaduta',
      'pending': 'In attesa',
      'cancelled': 'Annullata'
    };
    return statusMap[status] || status;
  };

  // Formatta la data
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data non valida';
    
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  // Calcola il tempo rimanente fino alla scadenza
  const calculateTimeLeft = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    
    if (isNaN(end.getTime())) return { days: 0, expired: true };
    
    const diffInDays = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return {
      days: Math.abs(diffInDays),
      expired: diffInDays < 0
    };
  };

  // Carica i dati della polizza dal backend
  useEffect(() => {
    const fetchPolicy = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Verifichiamo che il token sia presente
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setError('Sessione scaduta. Effettua nuovamente il login.');
          setLoading(false);
          return;
        }
        
        // Impostiamo il token negli header
        if (!axios.defaults.headers.common['Authorization']) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        }
        
        // Chiamata API per ottenere i dettagli della polizza
        console.log(`Caricamento dettagli polizza ID: ${id}`);
        const response = await axios.get(`/api/insurance-policies/${id}/`);
        console.log('Risposta ricevuta:', response.data);
        
        setPolicy(response.data);
      } catch (err: any) {
        console.error('Errore nel caricamento della polizza:', err);
        
        if (err.response?.status === 404) {
          setError('Polizza non trovata. Potrebbe essere stata eliminata o non hai il permesso di visualizzarla.');
        } else if (err.response?.status === 401) {
          setError('Non autorizzato. Effettua nuovamente il login.');
        } else {
          setError(`Si è verificato un errore: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchPolicy();
    }
  }, [id]);
  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '50vh',
        p: 3
      }}>
        <CircularProgress color="primary" size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Caricamento dettagli polizza...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/insurance')}
        >
          Torna all'elenco polizze
        </Button>
      </Box>
    );
  }

  if (!policy) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Nessun dato disponibile per questa polizza.
        </Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/insurance')}
          sx={{ mt: 2 }}
        >
          Torna all'elenco polizze
        </Button>
      </Box>
    );
  }

  // Calcola il tempo rimanente fino alla scadenza
  const timeLeft = calculateTimeLeft(policy.end_date);
  return (
    <Box sx={{ p: 0, position: 'relative' }}>
      {/* Header con sfondo a gradiente */}
      <Box 
        sx={{ 
          p: { xs: 2, sm: 3, md: 4 },
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          color: 'white',
          borderRadius: { xs: 0, sm: '0 0 24px 24px' },
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          mb: 4,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Decorazioni di sfondo */}
        <Box 
          sx={{ 
            position: 'absolute', 
            top: -20, 
            right: -20, 
            width: 120, 
            height: 120, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            zIndex: 0
          }} 
        />
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: -30, 
            left: '40%', 
            width: 180, 
            height: 180, 
            borderRadius: '50%', 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            zIndex: 0
          }} 
        />
        
        {/* Contenuto header */}
        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Button 
              variant="text" 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/insurance')}
              sx={{ 
                color: 'white', 
                borderRadius: '20px',
                '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.15)' } 
              }}
            >
              Torna all'elenco
            </Button>
            
            <Box>
              <Chip 
                label={formatStatusText(policy.status || 'active')}
                color={getStatusColor(policy.status || 'active')}
                sx={{ 
                  fontWeight: 'bold', 
                  fontSize: '0.85rem', 
                  borderRadius: '12px',
                  px: 1
                }}
              />
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 3 }}>
            <Avatar 
              sx={{ 
                width: 70, 
                height: 70, 
                bgcolor: 'rgba(255, 255, 255, 0.2)',
                mr: 3,
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
              }}
            >
              {getPolicyIcon(policy.policy_type)}
            </Avatar>
            
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'light', opacity: 0.9, mb: 0.5 }}>
                Polizza {formatPolicyType(policy.policy_type)}
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 'bold', letterSpacing: '-0.5px' }}>
                {policy.policy_number}
              </Typography>
            </Box>
          </Box>
          
          {/* Action buttons */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2}
            sx={{ mt: 4 }}
          >
            <Button
              variant="contained"
              startIcon={<InfoIcon />}
              component={Link}
              to={`/insurance/${id}/claim`}
              sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.15)', 
                color: 'white',
                '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.25)' },
                borderRadius: '10px',
                px: 3,
                py: 1
              }}
            >
              Richiedi Risarcimento
            </Button>
            {timeLeft.expired ? (
              <Button
                variant="contained"
                color="warning"
                component={Link}
                to={`/insurance/${id}/renew`}
                sx={{ 
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                  fontWeight: 'bold'
                }}
              >
                Rinnova Polizza
              </Button>
            ) : null}
          </Stack>
        </Box>
      </Box>
      <Box sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: 5 }}>
        <Grid container spacing={3}>
          {/* Dati principali della polizza */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
              height: '100%',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)' }
            }}>
              <CardHeader
                title="Informazioni Generali"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold', fontSize: '1.1rem' }}
                avatar={
                  <Avatar sx={{ 
                    bgcolor: theme.palette.primary.light,
                    boxShadow: '0 3px 8px rgba(25, 118, 210, 0.25)'
                  }}>
                    <InfoIcon />
                  </Avatar>
                }
                sx={{ 
                  pb: 1,
                  '& .MuiCardHeader-content': { minWidth: 0 },
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List disablePadding>
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Stato Polizza
                        </Typography>
                      }
                      secondary={
                        <Chip 
                          label={formatStatusText(policy.status || 'active')}
                          color={getStatusColor(policy.status || 'active')}
                          size="small"
                          sx={{ 
                            mt: 0.5, 
                            borderRadius: '6px',
                            fontWeight: 'medium' 
                          }}
                        />
                      }
                    />
                  </ListItem>
                  
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Tipo Polizza
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                          {formatPolicyType(policy.policy_type)}
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Descrizione
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {policy.description || 'Nessuna descrizione disponibile'}
                        </Typography>
                      } 
                    />
                  </ListItem>
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Titolare
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                          {policy.policy_holder_details ? 
                          `${policy.policy_holder_details.first_name} ${policy.policy_holder_details.last_name}` :
                          `ID Titolare: ${policy.policy_holder}`}
                        </Typography>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Data Creazione
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {policy.created_at ? formatDate(policy.created_at) : 'N/D'}
                        </Typography>
                      } 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Dettagli finanziari */}
          <Grid item xs={12} md={6}>
            <Card sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
              height: '100%',
              overflow: 'hidden',
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)' }
            }}>
              <CardHeader
                title="Dettagli Finanziari"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold', fontSize: '1.1rem' }}
                avatar={
                  <Avatar sx={{ 
                    bgcolor: '#4caf50',
                    boxShadow: '0 3px 8px rgba(76, 175, 80, 0.25)'
                  }}>
                    <PaidIcon />
                  </Avatar>
                }
                sx={{ 
                  pb: 1,
                  '& .MuiCardHeader-content': { minWidth: 0 },
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              />
              <CardContent sx={{ p: 0 }}>
                <List disablePadding>
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Importo Copertura
                        </Typography>
                      }
                      secondary={
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold', 
                          color: '#4caf50', 
                          mt: 0.5, 
                          fontSize: '1.3rem' 
                        }}>
                          € {parseFloat(policy.coverage_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Premio
                        </Typography>
                      } 
                      secondary={
                        <Box sx={{ mt: 0.5 }}>
                          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                            € {parseFloat(policy.premium_amount).toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                          </Typography>
                          <Chip 
                            label={
                              policy.payment_frequency === 'monthly' ? 'Mensile' :
                              policy.payment_frequency === 'quarterly' ? 'Trimestrale' :
                              policy.payment_frequency === 'semiannual' ? 'Semestrale' : 'Annuale'
                            }
                            size="small"
                            sx={{ 
                              fontSize: '0.7rem', 
                              height: 20, 
                              mt: 1,
                              bgcolor: 'rgba(0, 0, 0, 0.05)'
                            }}
                          />
                        </Box>
                      } 
                    />
                  </ListItem>
                  
                  <ListItem 
                    divider 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Franchigia
                        </Typography>
                      }
                      secondary={
                        <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                          € {parseFloat(policy.deductible || '0').toLocaleString('it-IT', { minimumFractionDigits: 2 })}
                        </Typography>
                      }
                    />
                  </ListItem>
                  
                  <ListItem 
                    sx={{ 
                      py: 2, 
                      px: 3,
                      transition: 'background-color 0.2s',
                      '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                    }}
                  >
                    <ListItemText 
                      primary={
                        <Typography variant="body2" color="text.secondary">
                          Conto di Pagamento
                        </Typography>
                      } 
                      secondary={
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {policy.payment_account || 'Non specificato'}
                        </Typography>
                      } 
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
          {/* Periodo di validità */}
          <Grid item xs={12}>
            <Card sx={{ 
              borderRadius: '16px', 
              boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
              overflow: 'hidden',
              mt: 2,
              transition: 'all 0.3s ease',
              '&:hover': { boxShadow: '0 8px 25px rgba(0, 0, 0, 0.12)' }
            }}>
              <CardHeader
                title="Periodo di Validità"
                titleTypographyProps={{ variant: 'h6', fontWeight: 'bold', fontSize: '1.1rem' }}
                avatar={
                  <Avatar sx={{ 
                    bgcolor: theme.palette.secondary.main,
                    boxShadow: '0 3px 8px rgba(220, 0, 78, 0.25)'
                  }}>
                    <DateRangeIcon />
                  </Avatar>
                }
                sx={{ 
                  pb: 1,
                  '& .MuiCardHeader-content': { minWidth: 0 },
                  borderBottom: '1px solid rgba(0, 0, 0, 0.06)'
                }}
              />
              <CardContent sx={{ py: 3 }}>
                <Grid container spacing={4}>
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2.5, 
                      borderRadius: 3, 
                      bgcolor: 'rgba(25, 118, 210, 0.06)',
                      border: '1px solid rgba(25, 118, 210, 0.12)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'medium', 
                          color: 'text.secondary', 
                          mb: 1.5
                        }}
                      >
                        Data Inizio
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="primary" 
                        sx={{ 
                          fontWeight: 'bold',
                          letterSpacing: '0.5px' 
                        }}
                      >
                        {formatDate(policy.start_date)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2.5, 
                      borderRadius: 3, 
                      bgcolor: 'rgba(25, 118, 210, 0.06)',
                      border: '1px solid rgba(25, 118, 210, 0.12)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'medium', 
                          color: 'text.secondary', 
                          mb: 1.5 
                        }}
                      >
                        Data Fine
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color="primary" 
                        sx={{ 
                          fontWeight: 'bold',
                          letterSpacing: '0.5px' 
                        }}
                      >
                        {formatDate(policy.end_date)}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} sm={4}>
                    <Box sx={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      p: 2.5, 
                      borderRadius: 3, 
                      bgcolor: timeLeft.expired ? 'rgba(220, 0, 78, 0.06)' : 'rgba(76, 175, 80, 0.06)',
                      border: timeLeft.expired ? '1px solid rgba(220, 0, 78, 0.12)' : '1px solid rgba(76, 175, 80, 0.12)',
                      transition: 'transform 0.2s',
                      '&:hover': { transform: 'translateY(-5px)' }
                    }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: 'medium', 
                          color: 'text.secondary', 
                          mb: 1.5 
                        }}
                      >
                        {timeLeft.expired ? 'Scaduta da' : 'Giorni rimanenti'}
                      </Typography>
                      <Typography 
                        variant="h5" 
                        color={timeLeft.expired ? 'error' : 'success'} 
                        sx={{ 
                          fontWeight: 'bold',
                          display: 'flex',
                          alignItems: 'center',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {timeLeft.days} {timeLeft.days === 1 ? 'giorno' : 'giorni'}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}

export default InsuranceDetail;
