import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Tooltip,
  IconButton,
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Divider,
  Avatar,
  Fade,
  useTheme,
  alpha,
  Badge,
  Container,
  LinearProgress,
  Stack,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Visibility as ViewIcon,
  Assignment as ClaimIcon,
  GppGood as RenewIcon,
  DirectionsCar as CarIcon,
  House as HomeIcon,
  HealthAndSafety as HealthIcon,
  Favorite as LifeIcon,
  Flight as TravelIcon,
  Security as LiabilityIcon,
  Dashboard as DashboardIcon,
  EuroSymbol as EuroIcon,
  Shield as ShieldIcon
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import axios from 'axios';

interface InsurancePolicy {
  id: number;
  policy_number: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
  start_date: string;
  end_date: string;
  status: string;
  description: string;
}

const InsuranceList: React.FC = () => {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [insuranceStats, setInsuranceStats] = useState({
    activeCount: 0,
    totalCoverage: 0,
    totalPremium: 0
  });

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/insurance-policies/');
        const policiesData = response.data.results || response.data;
        setPolicies(policiesData);
        
        // Calcola le statistiche
        const activeCount = policiesData.filter((policy: InsurancePolicy) => 
          policy.status === 'active').length;
        const totalCoverage = policiesData.reduce((sum: number, policy: InsurancePolicy) => 
          policy.status === 'active' ? sum + policy.coverage_amount : sum, 0);
        const totalPremium = policiesData.reduce((sum: number, policy: InsurancePolicy) => 
          policy.status === 'active' ? sum + policy.premium_amount : sum, 0);
        
        setInsuranceStats({
          activeCount,
          totalCoverage,
          totalPremium
        });
        
        setError(null);
      } catch (err: any) {
        console.error('Error fetching insurance policies:', err);
        setError('Impossibile caricare le polizze assicurative. ' + (err.response?.data?.detail || ''));
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, []);

  // Funzione per formattare il tipo di polizza
  const formatPolicyType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'life': 'Vita',
      'health': 'Salute',
      'car': 'Auto',
      'home': 'Casa',
      'travel': 'Viaggio',
      'liability': 'Responsabilità Civile'
    };
    return typeMap[type] || type;
  };

  // Funzione per formattare lo stato della polizza
  const formatPolicyStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Attiva',
      'expired': 'Scaduta',
      'cancelled': 'Annullata',
      'pending': 'In Attesa',
      'suspended': 'Sospesa'
    };
    return statusMap[status] || status;
  };

  // Funzione per ottenere il colore dello stato
  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'info' | 'default' } = {
      'active': 'success',
      'expired': 'error',
      'cancelled': 'error',
      'pending': 'warning',
      'suspended': 'info'
    };
    return statusMap[status] || 'default';
  };

  // Funzione per ottenere l'icona in base al tipo di polizza
  const getPolicyIcon = (type: string) => {
    switch (type) {
      case 'life':
        return <LifeIcon />;
      case 'health':
        return <HealthIcon />;
      case 'car':
        return <CarIcon />;
      case 'home':
        return <HomeIcon />;
      case 'travel':
        return <TravelIcon />;
      case 'liability':
        return <LiabilityIcon />;
      default:
        return <ShieldIcon />;
    }
  };

  // Funzione per ottenere il colore in base al tipo di polizza
  const getPolicyColor = (type: string, theme: any) => {
    switch (type) {
      case 'life':
        return alpha(theme.palette.error.main, 0.15);
      case 'health':
        return alpha(theme.palette.success.main, 0.15);
      case 'car':
        return alpha(theme.palette.info.main, 0.15);
      case 'home':
        return alpha(theme.palette.warning.main, 0.15);
      case 'travel':
        return alpha(theme.palette.primary.main, 0.15);
      case 'liability':
        return alpha(theme.palette.secondary.main, 0.15);
      default:
        return alpha(theme.palette.grey[500], 0.15);
    }
  };

  // Funzione per verificare se una polizza è vicina alla scadenza (entro 30 giorni)
  const isNearExpiry = (endDate: string) => {
    const today = new Date();
    const expiryDate = new Date(endDate);
    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 && diffDays <= 30;
  };

  const theme = useTheme();

  return (
    <Container maxWidth="lg">
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
            right: '-10%', 
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
                Le tue Polizze Assicurative
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, mb: 2 }}>
                Gestisci e monitora tutte le tue coperture assicurative
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              component={Link}
              to="/insurance/new"
              sx={{ 
                bgcolor: 'white', 
                color: theme.palette.primary.main,
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                }
              }}
            >
              Nuova Polizza
            </Button>
          </Box>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Dashboard di riepilogo */}
      <Stack direction="row" spacing={3} sx={{ mb: 4 }} useFlexGap>
        <Box sx={{ flex: 1 }}>
          <Fade in={!loading} timeout={500}>
            <Card 
              sx={{ 
                height: '100%', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.1), 
                      color: theme.palette.primary.main,
                      mr: 2
                    }}
                  >
                    <DashboardIcon />
                  </Avatar>
                  <Typography color="text.secondary" variant="subtitle1">
                    Polizze Attive
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 2 }}>
                  {insuranceStats.activeCount}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Fade in={!loading} timeout={700}>
            <Card 
              sx={{ 
                height: '100%', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.success.main, 0.1), 
                      color: theme.palette.success.main,
                      mr: 2
                    }}
                  >
                    <ShieldIcon />
                  </Avatar>
                  <Typography color="text.secondary" variant="subtitle1">
                    Copertura Totale
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 2 }}>
                  €{insuranceStats.totalCoverage.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Box>
        <Box sx={{ flex: 1 }}>
          <Fade in={!loading} timeout={900}>
            <Card 
              sx={{ 
                height: '100%', 
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                borderRadius: '12px',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.09)'
                }
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Avatar 
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1), 
                      color: theme.palette.warning.main,
                      mr: 2
                    }}
                  >
                    <EuroIcon />
                  </Avatar>
                  <Typography color="text.secondary" variant="subtitle1">
                    Premio Annuale Totale
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, mt: 2 }}>
                  €{insuranceStats.totalPremium.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                </Typography>
              </CardContent>
            </Card>
          </Fade>
        </Box>
      </Stack>

      {loading ? (
        <Box sx={{ width: '100%', my: 8 }}>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 2 }}>
            Caricamento delle polizze in corso...
          </Typography>
          <LinearProgress sx={{ height: 8, borderRadius: 4 }} />
        </Box>
      ) : policies.length === 0 ? (
        <Fade in={!loading} timeout={600}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 5, 
              textAlign: 'center', 
              borderRadius: '16px',
              backgroundColor: alpha(theme.palette.primary.main, 0.03),
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.2)}`
            }}
          >
            <ShieldIcon sx={{ fontSize: 60, color: alpha(theme.palette.primary.main, 0.3), mb: 2 }} />
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Non hai ancora nessuna polizza assicurativa
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph sx={{ maxWidth: 500, mx: 'auto', mb: 3 }}>
              Proteggi ciò che ti sta a cuore con le nostre soluzioni assicurative personalizzate.
              Ottieni coperture per la tua casa, auto, salute e molto altro ancora.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              component={Link}
              to="/insurance/new"
              sx={{ borderRadius: '8px', px: 3 }}
            >
              Crea la tua prima polizza
            </Button>
          </Paper>
        </Fade>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
          {policies.map((policy) => {
            const nearExpiry = isNearExpiry(policy.end_date);
            const policyColor = getPolicyColor(policy.policy_type, theme);
            const policyIcon = getPolicyIcon(policy.policy_type);
            
            return (
              <Box key={policy.id}>
                <Fade in={!loading} timeout={600 + policies.indexOf(policy) * 100}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-7px)',
                        boxShadow: '0 8px 30px rgba(0,0,0,0.12)'
                      }
                    }}
                  >
                    <Box 
                      sx={{ 
                        p: 2, 
                        backgroundColor: policyColor,
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: alpha(theme.palette.background.paper, 0.9),
                              mr: 1.5,
                              color: theme.palette.getContrastText(theme.palette.background.paper) 
                            }}
                          >
                            {policyIcon}
                          </Avatar>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            {formatPolicyType(policy.policy_type)}
                          </Typography>
                        </Box>
                        <Chip 
                          label={formatPolicyStatus(policy.status)} 
                          color={getStatusColor(policy.status)} 
                          size="small"
                          sx={{ fontWeight: 500 }} 
                        />
                      </Box>
                    </Box>
                    
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Typography 
                        variant="body2" 
                        color="text.secondary" 
                        sx={{ mb: 1 }}
                      >
                        Polizza n° {policy.policy_number}
                      </Typography>
                      
                      <Typography variant="body1" sx={{ mb: 2, fontWeight: 500 }}>
                        {policy.description}
                      </Typography>
                      
                      <Box sx={{ mb: 2 }}>
                        <Stack direction="row" spacing={2} useFlexGap>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Copertura
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              €{policy.coverage_amount.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              Premio
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                              €{policy.premium_amount.toLocaleString('it-IT', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                      
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          Scadenza
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {new Date(policy.end_date).toLocaleDateString('it-IT', {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric'
                            })}
                          </Typography>
                          {nearExpiry && policy.status === 'active' && (
                            <Chip
                              label="In Scadenza"
                              color="warning"
                              size="small"
                              sx={{ ml: 1, fontWeight: 500 }}
                            />
                          )}
                        </Box>
                      </Box>
                    </CardContent>
                    
                    <Divider />
                    
                    <CardActions 
                      sx={{ 
                        px: 3, 
                        py: 1.5, 
                        justifyContent: 'flex-end',
                        bgcolor: alpha(theme.palette.background.default, 0.5)
                      }}
                    >
                      <Tooltip title="Visualizza dettagli">
                        <IconButton 
                          component={Link} 
                          to={`/insurance/${policy.id}`}
                          color="primary"
                          sx={{ mr: 1 }}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      {policy.status === 'active' && (
                        <>
                          <Tooltip title="Presenta reclamo">
                            <IconButton 
                              component={Link} 
                              to={`/insurance/${policy.id}/claim`}
                              color="warning"
                              sx={{ mr: 1 }}
                            >
                              <ClaimIcon />
                            </IconButton>
                          </Tooltip>
                          {nearExpiry && (
                            <Tooltip title="Rinnova polizza">
                              <IconButton 
                                component={Link} 
                                to={`/insurance/${policy.id}/renew`}
                                color="success"
                              >
                                <RenewIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </CardActions>
                  </Card>
                </Fade>
              </Box>
            );
          })}
        </Box>
      )}
    </Container>
  );
};

export default InsuranceList;
