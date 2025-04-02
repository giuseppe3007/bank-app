import React from 'react';
import './api/axiosConfig'; // Importo la configurazione di axios
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

// Layout components
import Layout from './components/Layout/Layout';

// Auth components
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';

// Dashboard components
import Dashboard from './components/Dashboard/Dashboard';

// Profile component
import Profile from './components/Profile/Profile';

// Account components
import AccountsList from './components/Accounts/AccountsList';
import AccountDetail from './components/Accounts/AccountDetail';
import NewAccount from './components/Accounts/NewAccount';
import NewTransaction from './components/Accounts/NewTransaction';
import TransactionsList from './components/Transactions/TransactionsList';

// Investment components
import InvestmentsList from './components/Investments/InvestmentsList';
import NewInvestment from './components/Investments/NewInvestment';
import InvestmentDetail from './components/Investments/InvestmentDetail';

// Loan components
import LoansList from './components/Loans/LoansList';
import LoanDetail from './components/Loans/LoanDetail';
import LoanPayment from './components/Loans/LoanPayment';
import NewLoan from './components/Loans/NewLoan';

// Insurance components
import InsuranceList from './components/Insurance/InsuranceList';
import NewInsurancePolicy from './components/Insurance/NewInsurancePolicy';
import InsuranceDetail from './components/Insurance/InsuranceDetail';

// Services
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
    },
  },
});

// Componente per le rotte protette che richiede autenticazione
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {

  return (
    <AuthProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              {/* Profile route */}
              <Route path="profile" element={<Profile />} />
              
              {/* Account routes */}
              <Route path="accounts" element={<AccountsList />} />
              <Route path="accounts/new" element={<NewAccount />} />
              <Route path="accounts/:id" element={<AccountDetail />} />
              <Route path="accounts/:id/transactions/new" element={<NewTransaction />} />
              
              {/* Transactions routes */}
              <Route path="transactions" element={<TransactionsList />} />
              
              {/* Investment routes */}
              <Route path="investments" element={<InvestmentsList />} />
              <Route path="investments/new" element={<NewInvestment />} />
              <Route path="investments/:id" element={<InvestmentDetail />} />
              <Route path="investments/:id/simulate" element={<div>Simulazione Investimento - Coming Soon</div>} />
              <Route path="investments/:id/close" element={<div>Chiusura Investimento - Coming Soon</div>} />
              
              {/* Loan routes */}
              <Route path="loans" element={<LoansList />} />
              <Route path="loans/new" element={<NewLoan />} />
              <Route path="loans/:id" element={<LoanDetail />} />
              <Route path="loans/:id/payment" element={<LoanPayment />} />
              
              {/* Insurance routes */}
              <Route path="insurance" element={<InsuranceList />} />
              <Route path="insurance/new" element={<NewInsurancePolicy />} />
              <Route path="insurance/:id" element={<InsuranceDetail />} />
              <Route path="insurance/:id/claim" element={<div>Nuovo Reclamo - Coming Soon</div>} />
              <Route path="insurance/:id/renew" element={<div>Rinnovo Polizza - Coming Soon</div>} />
            </Route>
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
