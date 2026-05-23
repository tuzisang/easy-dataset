'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function MembersPage({ params }) {
  const { t } = useTranslation();
  const { projectId } = params;
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newRole, setNewRole] = useState('editor');
  const [addError, setAddError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`);
      if (res.status === 403) {
        window.location.href = `/projects/${projectId}`;
        return;
      }
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data.members);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  async function handleAddMember() {
    setAddError('');
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: newUsername, role: newRole })
      });
      const data = await res.json();
      if (!res.ok) {
        setAddError(data.error || 'Failed to add member');
        return;
      }
      await fetchMembers();
      setAddDialogOpen(false);
      setNewUsername('');
      setNewRole('editor');
    } catch (err) {
      setAddError(err.message);
    }
  }

  async function handleRoleChange(userId, newRole) {
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });
      if (!res.ok) throw new Error('Failed to update role');
      setMembers(prev => prev.map(m => (m.userId === userId ? { ...m, role: newRole } : m)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/members`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: deleteTarget.userId })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to remove member');
        setDeleteTarget(null);
        return;
      }
      setMembers(prev => prev.filter(m => m.userId !== deleteTarget.userId));
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const isOwner = members.some(m => m.userId === user?.id && m.role === 'owner');

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight={600}>
            {t('members.title')}
          </Typography>
          {isOwner && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)}>
              {t('members.addMember')}
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <TableContainer component={Paper} elevation={2}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('members.tableUserId')}</TableCell>
                <TableCell>{t('members.tableRole')}</TableCell>
                <TableCell>{t('members.tableAdded')}</TableCell>
                <TableCell align="right">{t('members.tableActions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map(m => (
                <TableRow key={m.id}>
                  <TableCell>
                    <Typography fontWeight={500}>{m.username || m.userId}</Typography>
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={m.role}
                      onChange={e => handleRoleChange(m.userId, e.target.value)}
                      disabled={
                        !isOwner ||
                        (m.userId === user?.id &&
                          m.role === 'owner' &&
                          members.filter(x => x.role === 'owner').length <= 1)
                      }
                    >
                      <MenuItem value="owner">{t('members.roleOwner')}</MenuItem>
                      <MenuItem value="editor">{t('members.roleEditor')}</MenuItem>
                      <MenuItem value="viewer">{t('members.roleViewer')}</MenuItem>
                    </Select>
                  </TableCell>
                  <TableCell>{new Date(m.createAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    {isOwner && m.userId !== user?.id && (
                      <IconButton color="error" onClick={() => setDeleteTarget(m)}>
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </motion.div>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)}>
        <DialogTitle>{t('members.addDialogTitle')}</DialogTitle>
        <DialogContent>
          {addError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {addError}
            </Alert>
          )}
          <TextField
            label={t('members.userIdLabel')}
            value={newUsername}
            onChange={e => setNewUsername(e.target.value)}
            fullWidth
            required
            sx={{ mb: 2, mt: 1 }}
            helperText={t('members.userIdHelper')}
          />
          <Select value={newRole} onChange={e => setNewRole(e.target.value)} fullWidth>
            <MenuItem value="editor">{t('members.roleEditor')}</MenuItem>
            <MenuItem value="viewer">{t('members.roleViewer')}</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleAddMember} variant="contained">
            {t('members.addButton')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)}>
        <DialogTitle>{t('members.removeDialogTitle')}</DialogTitle>
        <DialogContent>
          {t('members.removeConfirm', { username: deleteTarget?.username || deleteTarget?.userId })}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            {t('members.removeButton')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
