import * as React from 'react';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

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
  onClose
}) => {
  return (
    <Snackbar 
      open={open} 
      autoHideDuration={autoHideDuration} 
      onClose={onClose}
    >
      <Alert 
        severity={severity} 
        onClose={onClose}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};
