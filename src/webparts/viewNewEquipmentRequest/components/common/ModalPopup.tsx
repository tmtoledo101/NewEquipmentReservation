import * as React from 'react';
import { Dialog, DialogTitle, Button } from '@material-ui/core';
import CloseIcon from "@material-ui/icons/Close";
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IModalPopupProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
  fullWidth?: boolean;
  hideCloseIcon?: boolean;
}

export const ModalPopup: React.FC<IModalPopupProps> = ({
  open,
  title,
  onClose,
  children,
  maxWidth = 'md',
  fullWidth = false,
  hideCloseIcon = false,
}) => {
  return (
    <Dialog
      open={open}
      keepMounted
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      aria-labelledby="modal-dialog-title"
      disableBackdropClick
    >
      <DialogTitle id="modal-dialog-title" disableTypography>
        <h4>{title}</h4>
        {!hideCloseIcon && (
          <Button
            onClick={onClose}
            className={styles.closeBtn}
            style={{
              position: "absolute",
              top: "0",
              right: "0",
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </DialogTitle>
      {children}
    </Dialog>
  );
};
