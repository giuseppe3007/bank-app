import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  Stack,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useTheme,
  alpha
} from '@mui/material';
import Grid from '../../fixes/GridFix';
import {
  AccountBalance as AccountIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as MoneyIcon,
  Payment as PaymentIcon,
  ArrowBack as ArrowBackIcon,
  Receipt as ReceiptIcon,
  PercentOutlined as PercentIcon,
  AccessTime as TimeIcon,
  Description as DescriptionIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Loan {
  id: number;
  borrower: number;
  borrower_details: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  linked_account: number;
  account_details: {
    id: number;
    account_number: string;
  };
  loan_type: string;
  amount: number;
  interest_rate: number;
  term_months: number;
  monthly_payment: number;
  start_date: string | null;
  end_date: string | null;
  status: string;
  purpose: string;
  created_at: string;
  updated_at: string;
  remaining_amount: number;
  payments: LoanPayment[];
}

interface LoanPayment {
  id: number;
  loan: number;
  amount: number;
  payment_date: string;
  description: string;
}

// Componente per visualizzare i dettagli del prestito
const LoanDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLoanDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/loans/${id}/`);
        setLoan(response.data);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching loan details:', err);
        setError('Impossibile caricare i dettagli del prestito. ' + (err.response?.data?.detail || ''));
      } finally {
        setLoading(false);
      }
    };
    
    fetchLoanDetails();
  }, [id]);
  
  // Formattazione stato prestito
  const formatLoanStatus = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': 'In Attesa',
      'approved': 'Approvato',
      'active': 'Attivo',
      'completed': 'Completato',
      'rejected': 'Rifiutato',
      'default': 'Insolvente'
    };
    return statusMap[status] || status;
  };
  
  // Colore dello stato
  const getStatusColor = (status: string) => {
    const statusMap: { [key: string]: 'success' | 'error' | 'warning' | 'info' | 'default' } = {
      'pending': 'warning',
      'approved': 'info',
      'active': 'success',
      'completed': 'success',
      'rejected': 'error',
      'default': 'error'
    };
    return statusMap[status] || 'default';
  };
  
  // Formattazione tipo prestito
  const formatLoanType = (type: string) => {
    const typeMap: { [key: string]: string } = {
      'personal': 'Personale',
      'mortgage': 'Mutuo',
      'auto': 'Auto',
      'education': 'Istruzione',
      'business': 'Aziendale'
    };
    return typeMap[type] || type;
  };
  
  // Calcolo percentuale di completamento prestito
  const calculateCompletionPercentage = () => {
    if (!loan) return 0;
    
    if (!loan.remaining_amount || !loan.amount) return 0;
    
    const amountPaid = parseFloat(String(loan.amount)) - parseFloat(String(loan.remaining_amount));
    return Math.min(100, Math.round((amountPaid / parseFloat(String(loan.amount))) * 100)) || 0;
  };
  
  // Formattazione date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Non disponibile';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Data non valida';
      
      // Formattazione manuale in formato dd MMMM yyyy
      const day = date.getDate().toString().padStart(2, '0');
      const monthNames = ['Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno', 'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'];
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    } catch (e) {
      return 'Data non valida';
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 8 }}>
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ mt: 2 }}>Caricamento dettagli prestito...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/loans')}
        >
          Torna alla lista prestiti
        </Button>
      </Box>
    );
  }
  
  if (!loan) {
    return (
      <Box sx={{ mt: 4, px: 2 }}>
        <Alert severity="warning">Nessun dettaglio disponibile per questo prestito.</Alert>
        <Button 
          variant="outlined" 
          startIcon={<ArrowBackIcon />} 
          onClick={() => navigate('/loans')}
          sx={{ mt: 2 }}
        >
          Torna alla lista prestiti
        </Button>
      </Box>
    );
  }
  
  const completionPercentage = calculateCompletionPercentage();
  
  return (
    <Box sx={{ px: { xs: 2, md: 0 }, pb: 6 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' } }}>
        <Box>
          <Button 
            variant="text" 
            startIcon={<ArrowBackIcon />} 
            onClick={() => navigate('/loans')}
            sx={{ mb: 1 }}
          >
            Torna ai prestiti
          </Button>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="bold"
            sx={{ 
              background: 'linear-gradient(120deg, #1976d2, #64b5f6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Dettaglio Prestito
          </Typography>
          <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip 
              label={formatLoanStatus(loan.status)} 
              color={getStatusColor(loan.status)} 
              variant="filled" 
              size="small"
            />
            <Typography variant="subtitle1" color="text.secondary">
              Richiesto il {formatDate(loan.created_at)}
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: { xs: 2, sm: 0 } }}>
          <Button 
            variant="contained" 
            startIcon={<PaymentIcon />}
            onClick={() => navigate(`/loans/${loan.id}/payment`)}
            disabled={false}
            sx={{ 
              borderRadius: 2,
              boxShadow: 3,
              mr: 1
            }}
          >
            Effettua Pagamento
          </Button>
        </Box>
      </Box>
      
      {/* Sezione sommario */}
      <Paper 
        elevation={2} 
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: 2,
          background: 'linear-gradient(to right, #f5f7fa, #e9eef2)',
        }}
      >
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ flexBasis: { xs: '100%', md: '58.33%' } }}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="h3" component="div" fontWeight="bold">
                €{parseFloat(String(loan.amount)).toFixed(2)}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {formatLoanType(loan.loan_type)}
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flexBasis: { xs: '50%', sm: '23%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <MoneyIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Rata Mensile</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  €{loan.monthly_payment && loan.monthly_payment > 0 
                    ? parseFloat(String(loan.monthly_payment)).toFixed(2)
                    : loan.amount && loan.term_months 
                      ? (parseFloat(String(loan.amount)) / parseFloat(String(loan.term_months))).toFixed(2)
                      : '0.00'}
                </Typography>
              </Box>
              <Box sx={{ flexBasis: { xs: '50%', sm: '23%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PercentIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Tasso</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {parseFloat(String(loan.interest_rate)).toFixed(2)}%
                </Typography>
              </Box>
              <Box sx={{ flexBasis: { xs: '50%', sm: '23%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TimeIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Durata</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {loan.term_months} mesi
                </Typography>
              </Box>
              <Box sx={{ flexBasis: { xs: '50%', sm: '23%' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <AccountIcon color="primary" sx={{ mr: 1, fontSize: 20 }} />
                  <Typography variant="body2" color="text.secondary">Conto</Typography>
                </Box>
                <Typography variant="body1" fontWeight="medium">
                  {loan.account_details?.account_number || 'N/D'}
                </Typography>
              </Box>
            </Box>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', md: '41.67%' } }}>
            <Box sx={{ 
              p: 2, 
              background: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            }}>
              <Typography variant="h6" gutterBottom>Stato Avanzamento</Typography>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" fontWeight="medium">Completato: {completionPercentage}%</Typography>
                  <Typography variant="body2" fontWeight="medium">
                    Pagato: €{parseFloat(String(loan.amount - (loan.remaining_amount || 0))).toFixed(2)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={completionPercentage}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Data Inizio</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {loan.start_date ? formatDate(loan.start_date) : 'Non iniziato'}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" color="text.secondary">Data Fine Prevista</Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {loan.end_date ? formatDate(loan.end_date) : 'Non disponibile'}
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ mt: 2, textAlign: 'right' }}>
                <Typography variant="body2" color="text.secondary">Importo Residuo</Typography>
                <Typography variant="h6" fontWeight="bold" color={loan.status === 'completed' ? 'success.main' : 'text.primary'}>
                  €{parseFloat(String(loan.remaining_amount || 0)).toFixed(2)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Dettagli aggiuntivi e scopo */}
      <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DescriptionIcon sx={{ mr: 1 }} />
            Dettagli e Scopo
          </Box>
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="body1" paragraph>
          {loan.purpose || 'Nessuna descrizione disponibile per questo prestito.'}
        </Typography>
        
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
            <Typography variant="body2" color="text.secondary">Richiedente</Typography>
            <Typography variant="body1">
              {loan.borrower_details?.first_name} {loan.borrower_details?.last_name}
            </Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
            <Typography variant="body2" color="text.secondary">ID Prestito</Typography>
            <Typography variant="body1">#{loan.id}</Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
            <Typography variant="body2" color="text.secondary">Creato il</Typography>
            <Typography variant="body1">{formatDate(loan.created_at)}</Typography>
          </Box>
          <Box sx={{ flexBasis: { xs: '100%', sm: '45%', md: '22%' } }}>
            <Typography variant="body2" color="text.secondary">Ultimo aggiornamento</Typography>
            <Typography variant="body1">{formatDate(loan.updated_at)}</Typography>
          </Box>
        </Box>
      </Paper>
      
      {/* Cronologia dei pagamenti */}
      <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <ReceiptIcon sx={{ mr: 1 }} />
            Cronologia Pagamenti
          </Box>
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        {loan.payments && loan.payments.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Data</TableCell>
                  <TableCell>Descrizione</TableCell>
                  <TableCell align="right">Importo</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loan.payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>{formatDate(payment.payment_date)}</TableCell>
                    <TableCell>{payment.description}</TableCell>
                    <TableCell align="right">€{parseFloat(String(payment.amount)).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography variant="body1" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
            Nessun pagamento registrato per questo prestito.
          </Typography>
        )}
      </Paper>
    </Box>
  );
};

export default LoanDetail;
