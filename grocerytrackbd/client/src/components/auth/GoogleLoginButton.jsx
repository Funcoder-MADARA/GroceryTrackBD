import React from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../context/AuthContext';
import { Button } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

const GoogleLoginButton = () => {
  const { login } = useAuth();
  
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/google/callback?access_token=${tokenResponse.access_token}`);
        const data = await response.json();
        
        if (data.token) {
          login(data.token, data.user);
        }
      } catch (error) {
        console.error('Google login failed:', error);
      }
    },
    onError: (error) => {
      console.error('Google login error:', error);
    },
  });

  return (
    <Button
      variant="contained"
      startIcon={<LoginIcon />}
      onClick={() => googleLogin()}
      fullWidth
      sx={{ mt: 2, py: 1.5 }}
    >
      Continue with Google
    </Button>
  );
};

export default function GoogleAuthButton() {
  return (
    <GoogleOAuthProvider clientId={process.env.REACT_APP_GOOGLE_CLIENT_ID}>
      <GoogleLoginButton />
    </GoogleOAuthProvider>
  );
}