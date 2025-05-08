import * as React from "react";
import { Dialog, DialogContent, DialogTitle, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import styles from "../DisplayNewEquipmentRequest.module.scss";

interface IModalPopupProps {
  children: React.ReactNode;
  title: string;
  open: boolean;
  onClose: () => void;
  hideCloseIcon?: boolean;
}

export const ModalPopup: React.FC<IModalPopupProps> = ({
  children,
  title,
  open,
  onClose,
  hideCloseIcon = false,
}) => {
  return (
    <Dialog
      open={open}
      keepMounted
      aria-labelledby="equipment-dialog-title"
      aria-describedby="equipment-dialog-description"
    >
      <DialogTitle id="equipment-dialog-title" disableTypography>
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
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
