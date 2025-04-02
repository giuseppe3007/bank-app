import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Avatar, 
  Box, 
  Alert, 
  CircularProgress,
  Card,
  CardContent,
  Snackbar,
  IconButton,
  useTheme 
} from '@mui/material';
import { 
  Person as PersonIcon,
  Email as EmailIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Security as SecurityIcon,
  Badge as BadgeIcon
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Profile: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const theme = useTheme();
  
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
  });
  
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordEditMode, setPasswordEditMode] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  
  // Per gestire il messaggio di successo
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
      });
    }
  }, [user]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (!editMode === false) {
      // Reset form when canceling edit
      setProfileData({
        username: user?.username || '',
        email: user?.email || '',
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
      });
      setError(null);
    }
  };

  const togglePasswordEditMode = () => {
    setPasswordEditMode(!passwordEditMode);
    if (!passwordEditMode === false) {
      // Reset form when canceling password edit
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordError(null);
    }
  };

  const validateProfileForm = () => {
    if (!profileData.username.trim()) {
      setError("Il nome utente è obbligatorio");
      return false;
    }
    if (!profileData.email.trim()) {
      setError("L'email è obbligatoria");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      setError("L'email non è valida");
      return false;
    }
    
    return true;
  };

  const validatePasswordForm = () => {
    if (!passwordData.currentPassword) {
      setPasswordError("La password attuale è obbligatoria");
      return false;
    }
    if (!passwordData.newPassword) {
      setPasswordError("La nuova password è obbligatoria");
      return false;
    }
    if (passwordData.newPassword.length < 8) {
      setPasswordError("La nuova password deve contenere almeno 8 caratteri");
      return false;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("Le password non corrispondono");
      return false;
    }
    return true;
  };

  const saveProfile = async () => {
    if (!validateProfileForm()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.put(`/api/users/profile/`, {
        username: profileData.username,
        email: profileData.email,
        first_name: profileData.first_name,
        last_name: profileData.last_name
      });
      
      if (response.status === 200) {
        setSuccess("Profilo aggiornato con successo");
        setSnackbarMessage("Profilo aggiornato con successo");
        setOpenSnackbar(true);
        setEditMode(false);
        // Force a refresh of user data
        window.location.reload();
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || 
        "Si è verificato un errore durante l'aggiornamento del profilo"
      );
      console.error('Profile update error:', err);
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!validatePasswordForm()) return;
    
    setLoading(true);
    setPasswordError(null);
    
    try {
      const response = await axios.post(`/api/users/change-password/`, {
        current_password: passwordData.currentPassword,
        new_password: passwordData.newPassword
      });
      
      if (response.status === 200) {
        setPasswordSuccess("Password aggiornata con successo");
        setSnackbarMessage("Password aggiornata con successo");
        setOpenSnackbar(true);
        setPasswordEditMode(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (err: any) {
      setPasswordError(
        err.response?.data?.detail || 
        "Si è verificato un errore durante l'aggiornamento della password"
      );
      console.error('Password change error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCloseSnackbar = () => {
    setOpenSnackbar(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Gestione Profilo
      </Typography>
      
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
        {/* Avatar e info principali */}
        <Box sx={{ width: { xs: '100%', md: '33.33%' } }}>
          <Card sx={{ height: '100%', borderRadius: 2, boxShadow: 3 }}>
            <CardContent sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              justifyContent: 'center', 
              gap: 2,
              textAlign: 'center',
              height: '100%'
            }}>
              <Avatar 
                sx={{ 
                  width: 120, 
                  height: 120, 
                  bgcolor: theme.palette.primary.main,
                  fontSize: '4rem',
                  mb: 2
                }}
              >
                {user?.first_name?.charAt(0) || user?.username?.charAt(0) || <PersonIcon sx={{ fontSize: '4rem' }} />}
              </Avatar>
              
              <Typography variant="h5" fontWeight="bold">
                {user?.first_name && user?.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user?.username || 'Utente'}
              </Typography>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 1,
                mb: 1
              }}>
                <BadgeIcon />
                <Typography variant="body1">{user?.username || 'Username non impostato'}</Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 1 
              }}>
                <EmailIcon />
                <Typography variant="body1">{user?.email || 'Email non impostata'}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
        
        {/* Dettagli profilo */}
        <Box sx={{ width: { xs: '100%', md: '66.67%' } }}>
          <Card sx={{ 
            borderRadius: 2, 
            boxShadow: 3, 
            mb: 3 
          }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Informazioni Personali
                </Typography>
                <Button 
                  startIcon={!editMode ? <EditIcon /> : <CancelIcon />}
                  variant="outlined"
                  color={!editMode ? "primary" : "error"}
                  onClick={toggleEditMode}
                  disabled={loading}
                >
                  {!editMode ? "Modifica" : "Annulla"}
                </Button>
              </Box>
              
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                  <CircularProgress />
                </Box>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              
              {success && !loading && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    disabled={!editMode || loading}
                    sx={{
                      mb: 2
                    }}
                    margin="normal"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={!editMode || loading}
                    sx={{
                      mb: 2
                    }}
                    margin="normal"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="Nome"
                    name="first_name"
                    value={profileData.first_name}
                    onChange={handleProfileChange}
                    disabled={!editMode || loading}
                    sx={{
                      mb: 2
                    }}
                    margin="normal"
                  />
                </Box>
                <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                  <TextField
                    fullWidth
                    label="Cognome"
                    name="last_name"
                    value={profileData.last_name}
                    onChange={handleProfileChange}
                    disabled={!editMode || loading}
                    sx={{
                      mb: 2
                    }}
                    margin="normal"
                  />
                </Box>
              </Box>
              
              {editMode && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    startIcon={<SaveIcon />}
                    onClick={saveProfile}
                    disabled={loading}
                  >
                    Salva
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Sezione password */}
          <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2 
              }}>
                <Typography variant="h6" fontWeight="bold">
                  Sicurezza
                </Typography>
                <Button 
                  startIcon={!passwordEditMode ? <SecurityIcon /> : <CancelIcon />}
                  variant="outlined"
                  color={!passwordEditMode ? "primary" : "error"}
                  onClick={togglePasswordEditMode}
                  disabled={loading}
                >
                  {!passwordEditMode ? "Cambia Password" : "Annulla"}
                </Button>
              </Box>
              
              {passwordError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {passwordError}
                </Alert>
              )}
              
              {passwordSuccess && !loading && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {passwordSuccess}
                </Alert>
              )}
              
              {!passwordEditMode ? (
                <Typography variant="body1" color="text.secondary">
                  Qui puoi cambiare la tua password. Per motivi di sicurezza, è consigliato modificarla regolarmente.
                </Typography>
              ) : (
                <>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box width="100%">
                      <TextField
                        fullWidth
                        label="Password Attuale"
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        margin="normal"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                        <TextField
                          fullWidth
                          label="Nuova Password"
                          name="newPassword"
                          type="password"
                          value={passwordData.newPassword}
                          onChange={handlePasswordChange}
                          disabled={loading}
                          margin="normal"
                          helperText="La password deve contenere almeno 8 caratteri"
                        />
                      </Box>
                      <Box sx={{ width: { xs: '100%', sm: 'calc(50% - 8px)' } }}>
                        <TextField
                          fullWidth
                          label="Conferma Nuova Password"
                          name="confirmPassword"
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={handlePasswordChange}
                          disabled={loading}
                          margin="normal"
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Button 
                      variant="contained" 
                      color="primary" 
                      startIcon={<SaveIcon />}
                      onClick={changePassword}
                      disabled={loading}
                    >
                      Salva Password
                    </Button>
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
      
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
      />
    </Container>
  );
};

export default Profile;
