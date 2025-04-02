import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { styled, useTheme } from '@mui/material/styles';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemIcon,
  ListItemText,
  Container,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Button,
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  Security as SecurityIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Receipt as ReceiptIcon,
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 260;

// Colori personalizzati per la sidebar
const sidebarColors = {
  background: 'linear-gradient(180deg, #1a237e 0%, #283593 100%)',
  text: '#ffffff',
  activeItem: 'rgba(255, 255, 255, 0.2)',
  hoverItem: 'rgba(255, 255, 255, 0.1)',
  divider: 'rgba(255, 255, 255, 0.12)',
  icon: '#ffffff' // Cambiato da blu a bianco per miglior contrasto
};

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(3),
  backgroundColor: '#f5f8fa',
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  transition: theme.transitions.create(['margin', 'width'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: theme.transitions.create(['margin', 'width'], {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
  justifyContent: 'flex-end',
}));

const Layout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Ottieni il percorso corrente per evidenziare la voce di menu attiva
  const location = window.location.pathname;

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Conti', icon: <AccountBalanceIcon />, path: '/accounts' },
    { text: 'Transazioni', icon: <ReceiptIcon />, path: '/transactions' },
    { text: 'Investimenti', icon: <TrendingUpIcon />, path: '/investments' },
    { text: 'Prestiti', icon: <MonetizationOnIcon />, path: '/loans' },
    { text: 'Assicurazioni', icon: <SecurityIcon />, path: '/insurance' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBarStyled position="fixed" open={open} sx={{ boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', backgroundColor: 'white', color: '#333' }}>
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerOpen}
            edge="start"
            sx={{ mr: 2, ...(open && { display: 'none' }) }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#1a237e' }}>
            Sistema di Gestione Finanziaria
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifiche">
              <IconButton sx={{ mx: 1 }}>
                <Badge badgeContent={4} color="primary">
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>
            <Tooltip title="Profilo">
              <IconButton 
                onClick={handleMenuOpen} 
                sx={{ 
                  p: 0, 
                  ml: 2, 
                  border: '2px solid #f0f0f0', 
                  padding: '2px' 
                }}
              >
                <Avatar alt={user?.username || 'User'} src="/static/images/avatar/1.jpg" />
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                <ListItemIcon>
                  <PersonIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profilo</ListItemText>
              </MenuItem>
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }}>
                <ListItemIcon>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Impostazioni</ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleMenuClose(); handleLogout(); }}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText>Logout</ListItemText>
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBarStyled>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            background: sidebarColors.background,
            color: sidebarColors.text,
            borderRight: 'none',
            boxShadow: '0 4px 20px 0 rgba(0, 0, 0, 0.12)',
          },
        }}
        variant="persistent"
        anchor="left"
        open={open}
      >
        <DrawerHeader sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          padding: 2,
          justifyContent: 'space-between' 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <AccountBalanceIcon sx={{ mr: 1, color: sidebarColors.icon, fontSize: '2rem' }} />
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: sidebarColors.text }}>
              FinanceApp
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerClose} sx={{ color: sidebarColors.text }}>
            {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          </IconButton>
        </DrawerHeader>
        <Divider sx={{ backgroundColor: sidebarColors.divider }} />
        
        {/* Sezione utente nella sidebar */}
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', mb: 1 }}>
          <Avatar
            alt={user?.username || 'User'}
            src="/static/images/avatar/1.jpg"
            sx={{ width: 40, height: 40, mr: 2 }}
          />
          <Box>
            <Typography variant="subtitle1">{user?.username || 'Utente'}</Typography>
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
              Online
            </Typography>
          </Box>
        </Box>
        <Divider sx={{ backgroundColor: sidebarColors.divider, mb: 1 }} />
        
        <List sx={{ px: 1 }}>
          {menuItems.map((item) => {
            const isActive = location === item.path || 
                          (item.path !== '/' && location.startsWith(item.path));
                          
            return (
              <ListItem 
                component={Link} 
                to={item.path} 
                key={item.text}
                sx={{
                  borderRadius: '8px',
                  mb: 0.5,
                  backgroundColor: isActive ? sidebarColors.activeItem : 'transparent',
                  '&:hover': {
                    backgroundColor: isActive ? sidebarColors.activeItem : sidebarColors.hoverItem,
                  },
                  transition: 'background-color 0.2s'
                }}
              >
                <ListItemIcon sx={{ 
                  color: isActive ? '#ffeb3b' : sidebarColors.icon, // Cambiato da bianco a giallo per il menu attivo
                  minWidth: '40px'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontWeight: isActive ? 'bold' : 'normal',
                    color: isActive ? '#ffeb3b' : '#ffffff' // Evidenziato anche il testo della voce attiva in giallo
                  }}
                />
                {isActive && (
                  <Box 
                    sx={{ 
                      width: '4px',
                      height: '100%',
                      backgroundColor: '#ffeb3b', // Cambiato da bianco a giallo per coerenza
                      position: 'absolute',
                      right: 0,
                      borderRadius: '4px'
                    }} 
                  />
                )}
              </ListItem>
            );
          })}
        </List>
        
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Button
            variant="contained"
            onClick={handleLogout}
            fullWidth
            startIcon={<LogoutIcon />}
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)'
              },
              textTransform: 'none',
              borderRadius: '8px'
            }}
          >
            Logout
          </Button>
        </Box>
      </Drawer>
      <Main open={open}>
        <DrawerHeader />
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Outlet />
        </Container>
      </Main>
    </Box>
  );
};

export default Layout;
