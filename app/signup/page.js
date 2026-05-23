'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link as MuiLink
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const { t } = useTranslation();
  const { user, isLoading, signup } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = '/';
    }
  }, [isLoading, user]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const result = await signup(username, password);
    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    }
  }

  return (
    <Container maxWidth="sm" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: '100%' }}
      >
        <Card elevation={2}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h4" align="center" gutterBottom fontWeight={600}>
              Easy-Dataset
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              {t('auth.signUpTitle', 'Create your account')}
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                label={t('auth.username', 'Username')}
                value={username}
                onChange={e => setUsername(e.target.value)}
                fullWidth
                required
                autoFocus
                helperText={t('auth.usernameHint', '2-32 characters, letters, numbers, underscores, hyphens')}
                sx={{ mb: 2 }}
              />
              <TextField
                label={t('auth.password', 'Password')}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                fullWidth
                required
                helperText={t('auth.passwordHint', 'At least 6 characters')}
                sx={{ mb: 3 }}
              />
              <Button type="submit" variant="contained" fullWidth size="large" disabled={submitting}>
                {submitting ? <CircularProgress size={24} color="inherit" /> : t('auth.signUp', 'Sign Up')}
              </Button>
            </Box>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              {t('auth.haveAccount', 'Already have an account?')}{' '}
              <MuiLink href="/login">{t('auth.signIn', 'Sign In')}</MuiLink>
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
