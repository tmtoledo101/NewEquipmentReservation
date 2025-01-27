import * as React from "react";
import Snackbar from "@material-ui/core/Snackbar";
import MuiAlert, { AlertProps } from "@material-ui/lab/Alert";

interface INotificationProps {
  showSuccess: boolean;
  showError: boolean;
  successMessage: string;
  errorMessage: string;
  onClose: () => void;
}

function Alert(props: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export const Notification: React.FC<INotificationProps> = ({
  showSuccess,
  showError,
  successMessage,
  errorMessage,
  onClose,
}) => {
  return (
    <>
      <Snackbar open={showSuccess} autoHideDuration={1000}>
        <Alert severity="success">{successMessage}</Alert>
      </Snackbar>
      <Snackbar open={showError} autoHideDuration={1000} onClick={onClose}>
        <Alert severity="error" onClick={onClose}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
