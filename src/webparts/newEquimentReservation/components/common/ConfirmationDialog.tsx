import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import { FormikProps } from 'formik';
import { IEquipmentFormValues } from '../interfaces/INewEquipmentReservation';
import { ModalPopup } from './ModalPopup';

interface IConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (formik: FormikProps<IEquipmentFormValues>) => void;
  formik: FormikProps<IEquipmentFormValues>;
}

export const ConfirmationDialog: React.FC<IConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
  formik
}) => {
  return (
    <ModalPopup
      title=""
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <h3>Do you want to create this request?</h3>
        </Grid>
        <Grid item xs={12}>
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              alignItems: "center",
            }}
          >
            <Button
              color="secondary"
              variant="contained"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              onClick={() => onConfirm(formik)}
            >
              Ok
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};
