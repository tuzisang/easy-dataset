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
  CircularProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function SetupPage() {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch('/api/auth/setup-check');
        const { needsSetup } = await res.json();
        if (!needsSetup) {
          window.location.href = '/login';
          return;
        }
      } catch {
        // proceed anyway
      } finally {
        setChecking(false);
      }
    }
    check();
  }, []);

  if (checking) {
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

    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Setup failed');
        setSubmitting(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setError('Network error. Please try again.');
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
              {t('auth.setupTitle', 'Welcome to Easy-Dataset')}
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              {t('auth.setupDescription', 'Create your admin account to get started')}
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
                {submitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  t('auth.createAdminAccount', 'Create Admin Account')
                )}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    </Container>
  );
}
