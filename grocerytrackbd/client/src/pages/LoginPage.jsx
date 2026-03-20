import React, { useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Box } from '@mui/material';
import GoogleAuthButton from '../components/auth/GoogleLoginButton';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await res.json();
      
      if (res.ok) {
        login(data.token, data.user);
      } else {
        setError(data.msg || 'Login failed');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" fontWeight="bold" color="primary">
          GroceryTrackBD
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom align="center" sx={{ mb: 3 }}>
          Login to Your Account
        </Typography>
        
        {error && (
          <Box sx={{ color: 'error.main', mb: 2, textAlign: 'center' }}>
            {error}
          </Box>
        )}
        
        <GoogleAuthButton />
        
        <Box sx={{ my: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }} />
          <Typography sx={{ mx: 2, color: 'text.secondary' }}>or</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', flexGrow: 1 }} />
        </Box>
        
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email Address"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, py: 1.5, fontSize: '1.1rem' }}
          >
            Login
          </Button>
        </form>
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography>
            Don't have an account? <Button onClick={() => navigate('/register')}>Register</Button>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage;