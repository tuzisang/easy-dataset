'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Snackbar,
  Tooltip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SettingsIcon from '@mui/icons-material/Settings';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function AdminPage() {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [projectDialogUser, setProjectDialogUser] = useState(null);
  const [projectList, setProjectList] = useState([]);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [projectSaving, setProjectSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (authLoading) return;
    if (!user || user.role !== 'admin') {
      window.location.href = '/';
      return;
    }
    fetchUsers();
  }, [authLoading, user]);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data.users);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setUsers(prev => prev.map(u => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.id })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to delete user');
        return;
      }
      setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  async function openProjectDialog(targetUser) {
    setProjectDialogUser(targetUser);
    setProjectSearch('');
    setProjectLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${targetUser.id}/projects`);
      if (!res.ok) throw new Error('Failed to fetch projects');
      const data = await res.json();
      setProjectList(data.projects);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
      setProjectDialogUser(null);
    } finally {
      setProjectLoading(false);
    }
  }

  function handleProjectRoleChange(projectId, newRole) {
    setProjectList(prev => prev.map(p => (p.id === projectId ? { ...p, role: newRole || null } : p)));
  }

  async function handleSaveProjects() {
    setProjectSaving(true);
    const items = projectList.filter(p => p.role).map(p => ({ projectId: p.id, role: p.role }));
    try {
      const res = await fetch(`/api/admin/users/${projectDialogUser.id}/projects`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to update');
      }
      setSnackbar({ open: true, message: t('admin.projectAccessSaved'), severity: 'success' });
      setProjectDialogUser(null);
    } catch (err) {
      setSnackbar({ open: true, message: err.message, severity: 'error' });
    } finally {
      setProjectSaving(false);
    }
  }

  function closeProjectDialog() {
    setProjectDialogUser(null);
    setProjectList([]);
  }

  const filteredProjects = projectList.filter(p => p.name.toLowerCase().includes(projectSearch.toLowerCase()));

  if (authLoading || loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Typography variant="h4" fontWeight={600} sx={{ mb: 3 }}>
          {t('admin.title')}
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('admin.tableUsername')}</TableCell>
                <TableCell>{t('admin.tableRole')}</TableCell>
                <TableCell>{t('admin.tableProjects')}</TableCell>
                <TableCell>{t('admin.tableCreated')}</TableCell>
                <TableCell align="right">{t('admin.tableActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <Typography fontWeight={500}>{u.username}</Typography>
                    {u.id === user?.id && (
                      <Chip
                        label={t('admin.youLabel')}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={u.role}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      disabled={u.id === user?.id}
                    >
                      <MenuItem value="admin">{t('admin.roleAdmin')}</MenuItem>
                      <MenuItem value="member">{t('admin.roleMember')}</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{u.projectCount}</TableCell>
                  <TableCell>{new Date(u.createAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Tooltip title={t('admin.manageProjects')}>
                      <IconButton onClick={() => openProjectDialog(u)}>
                        <SettingsIcon />
                      </IconButton>
                    </Tooltip>
                    <IconButton color="error" onClick={() => setDeleteTarget(u)} disabled={u.id === user?.id}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {t('admin.noUsers')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>

      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('admin.deleteUserTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t('admin.deleteUserConfirm', { username: deleteTarget?.username })}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('admin.deleteConfirm')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={!!projectDialogUser}
        onClose={projectSaving ? undefined : closeProjectDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('admin.projectAccess', { username: projectDialogUser?.username })}</DialogTitle>
        <DialogContent>
          {projectLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                size="small"
                placeholder={t('admin.searchProjects')}
                value={projectSearch}
                onChange={e => setProjectSearch(e.target.value)}
                sx={{ mb: 2, mt: 1 }}
              />
              <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
                {filteredProjects.map(p => (
                  <Box
                    key={p.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    <Typography variant="body2" sx={{ flex: 1, mr: 2 }}>
                      {p.name}
                    </Typography>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                      <InputLabel>{t('admin.tableRole')}</InputLabel>
                      <Select
                        value={p.role || ''}
                        label={t('admin.tableRole')}
                        onChange={e => handleProjectRoleChange(p.id, e.target.value)}
                      >
                        <MenuItem value="">{t('admin.noAccess')}</MenuItem>
                        <MenuItem value="owner">{t('members.roleOwner')}</MenuItem>
                        <MenuItem value="editor">{t('members.roleEditor')}</MenuItem>
                        <MenuItem value="viewer">{t('members.roleViewer')}</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                ))}
                {filteredProjects.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    {projectSearch ? t('admin.noMatchingProjects') : t('admin.noUsers')}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeProjectDialog}>{t('common.cancel')}</Button>
          <Button onClick={handleSaveProjects} variant="contained" disabled={projectLoading || projectSaving}>
            {projectSaving ? <CircularProgress size={20} color="inherit" /> : t('admin.saveChanges')}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          severity={snackbar.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
