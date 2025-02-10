import * as React from 'react';
import { Dialog, DialogTitle } from '@material-ui/core';

interface IModalPopupProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
}

export const ModalPopup: React.FC<IModalPopupProps> = ({
  open,
  title,
  onClose,
  children,
  maxWidth = 'md',
  fullWidth = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="modal-dialog-title"
    >
      {title && (
        <DialogTitle id="modal-dialog-title">
          {title}
        </DialogTitle>
      )}
      {children}
    </Dialog>
  );
};
