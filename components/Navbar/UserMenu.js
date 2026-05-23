'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Typography, Divider, Chip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

export default function UserMenu({ theme }) {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  if (!user) return null;

  const handleClick = event => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    handleClose();
    await logout();
  };

  const handleAdmin = () => {
    handleClose();
    router.push('/admin');
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="medium"
        aria-label={t('userMenu.ariaLabel')}
        sx={{ color: theme?.palette?.text?.primary }}
      >
        <AccountCircleIcon fontSize="small" />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem disabled>
          <Typography variant="body2" fontWeight={600}>
            {user.username}
          </Typography>
          <Chip
            label={user.role}
            size="small"
            color={user.role === 'admin' ? 'primary' : 'default'}
            variant="outlined"
            sx={{ ml: 1 }}
          />
        </MenuItem>

        <Divider />

        {user.role === 'admin' && (
          <MenuItem onClick={handleAdmin}>
            <ListItemIcon>
              <AdminPanelSettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('userMenu.admin')}</ListItemText>
          </MenuItem>
        )}

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('userMenu.signOut')}</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
