import * as React from 'react';
import { DialogContent, DialogActions, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { ModalPopup } from './ModalPopup';

interface IConfirmationDialogFormProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  status?: string;
}

export const ConfirmationDialogForm: React.FC<IConfirmationDialogFormProps> = ({
  open,
  onClose,
  onConfirm,
  status
}) => {
  return (
    <ModalPopup
      open={open}
      onClose={onClose}
      title="Confirm Action"
      maxWidth="sm"
    >
      <DialogContent>
        {status === 'Release' ? (
          <p>Are you sure you want to release this request?</p>
        ) : status === 'Cancel' ? (
          <p>Are you sure you want to cancel this request?</p>
        ) : status === 'Return' ? (
          <p>Do you want to save changes?</p>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          startIcon={<CloseIcon />}
          style={{
            color: "lightgrey",
            background: "grey",
          }}
        >
          No
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="secondary"
          startIcon={<SaveIcon />}
        >
          Yes
        </Button>
      </DialogActions>
    </ModalPopup>
  );
};
