import React, { useState } from 'react';
import { 
  Container, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Link, 
  Alert,
  CircularProgress,
  Card,
  InputAdornment,
  Avatar,
  useTheme,
  alpha
} from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, loading, error } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic form validation
    if (!username || !password) {
      setFormError('Inserisci sia username che password.');
      return;
    }
    
    setFormError('');
    
    try {
      await login(username, password);
      // Redirect to dashboard on successful login
      navigate('/');
    } catch (err) {
      // Error handling is managed in the AuthContext
    }
  };
  
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
        py: 8
      }}
    >
      <Container maxWidth="sm">
        <Card
          elevation={6}
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: '0 8px 40px rgba(0,0,0,0.12)'
          }}
        >
          <Box
            sx={{
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'white'
            }}
          >
            <Avatar 
              sx={{
                mb: 2,
                width: 64,
                height: 64, 
                bgcolor: theme.palette.primary.main,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
              }}
            >
              <AccountBalanceIcon fontSize="large" />
            </Avatar>
            <Typography 
              component="h1" 
              variant="h4" 
              sx={{ 
                mb: 0.5,
                fontWeight: 700,
                letterSpacing: 0.5
              }}
            >
              Benvenuto
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary"
              align="center"
              sx={{ mb: 3 }}
            >
              Accedi al tuo internet banking personale
            </Typography>
      
            {(error || formError) && (
              <Alert 
                severity="error" 
                sx={{ 
                  mt: 1, 
                  mb: 3, 
                  width: '100%',
                  borderRadius: 1 
                }}
              >
                {formError || error}
              </Alert>
            )}
      
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="primary" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1.5,
                  }
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ 
                  mt: 3, 
                  mb: 2,
                  py: 1.2,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  textTransform: 'none',
                  fontSize: '1rem',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Accedi'}
              </Button>
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Link 
                  component={RouterLink} 
                  to="/register" 
                  variant="body2"
                  sx={{
                    textDecoration: 'none',
                    fontWeight: 500,
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}
                >
                  Non hai un account? Registrati
                </Link>
              </Box>
            </Box>
          </Box>
        </Card>
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="body2" color="white">
            © {new Date().getFullYear()} ItaliaBanca — Tutti i diritti riservati
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Login;
