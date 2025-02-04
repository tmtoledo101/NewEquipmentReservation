import * as React from 'react';
import { Dialog, DialogTitle, DialogContent, IconButton } from '@material-ui/core';
import CloseIcon from '@material-ui/icons/Close';
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IModalPopupProps {
  title: string;
  open: boolean;
  hideCloseIcon?: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const ModalPopup: React.FC<IModalPopupProps> = ({
  title,
  open,
  hideCloseIcon = false,
  onClose,
  children
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className={styles.modalDialog}
    >
      <DialogTitle>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>{title}</span>
          {!hideCloseIcon && (
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          )}
        </div>
      </DialogTitle>
      <DialogContent>
        {children}
      </DialogContent>
    </Dialog>
  );
};