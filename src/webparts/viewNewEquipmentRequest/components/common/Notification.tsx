import * as React from 'react';
import { Snackbar } from '@material-ui/core';
import { Alert } from '@material-ui/lab';

interface INotificationProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  autoHideDuration?: number;
  onClose?: () => void;
}

export const Notification: React.FC<INotificationProps> = ({
  open,
  message,
  severity,
  autoHideDuration = 6000,
  onClose,
}) => {
  const handleClose = (event?: React.SyntheticEvent, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={autoHideDuration}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
    >
      <Alert onClose={handleClose} severity={severity}>
        {message}
      </Alert>
    </Snackbar>
  );
};
