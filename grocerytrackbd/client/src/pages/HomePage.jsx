import React from 'react';
import { Container, Typography, Box, Button, Grid, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 8 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h2" component="h1" gutterBottom color="primary" fontWeight="bold">
          GroceryTrackBD
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Streamline your grocery inventory management and tracking
        </Typography>
        
        {!currentUser && (
          <Box sx={{ mt: 4 }}>
            <Button 
              variant="contained" 
              size="large" 
              onClick={() => navigate('/register')} 
              sx={{ mx: 1 }}
            >
              Get Started
            </Button>
            <Button 
              variant="outlined" 
              size="large" 
              onClick={() => navigate('/login')} 
              sx={{ mx: 1 }}
            >
              Login
            </Button>
          </Box>
        )}
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              For Shopkeepers
            </Typography>
            <Typography paragraph>
              Manage your inventory, track sales, and get insights on your grocery business.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              For Company Managers
            </Typography>
            <Typography paragraph>
              Monitor multiple shops, analyze performance, and optimize distribution.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              For Delivery Personnel
            </Typography>
            <Typography paragraph>
              Track deliveries, manage routes, and update delivery status in real-time.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default HomePage;