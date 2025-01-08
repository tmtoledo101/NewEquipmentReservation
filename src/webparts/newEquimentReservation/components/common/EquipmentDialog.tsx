import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import { FormikProps } from 'formik';
import { IEquipmentFormValues, IDropdownItem } from '../interfaces/INewEquipmentReservation';
import { Dropdown } from './FormComponents';
import { ModalPopup } from './ModalPopup';
import styles from '../NewEquimentReservation.module.scss';

interface IEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formik: FormikProps<IEquipmentFormValues>) => void;
  onDelete: (formik: FormikProps<IEquipmentFormValues>) => void;
  formik: FormikProps<IEquipmentFormValues>;
  equipmentList: IDropdownItem[];
  quantityList: IDropdownItem[];
  assetList: string[];
  equipmentError: string;
  handleEquipment: (e: any) => void;
  handleQuantity: (e: any) => void;
}

export const EquipmentDialog: React.FC<IEquipmentDialogProps> = ({
  open,
  onClose,
  onSave,
  onDelete,
  formik,
  equipmentList,
  quantityList,
  assetList,
  equipmentError,
  handleEquipment,
  handleQuantity
}) => {
  return (
    <ModalPopup
      title="Add Equipment"
      hideCloseIcon={false}
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <span style={{ color: "red" }}>
            {equipmentError}
          </span>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Equipment</div>
            <div className={styles.data}>
              <Dropdown
                items={equipmentList}
                name="equipment"
                handleChange={handleEquipment}
              />
            </div>
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Quantity</div>
            <div className={styles.data}>
              <Dropdown
                items={quantityList}
                name="quantity"
                handleChange={handleQuantity}
              />
            </div>
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Asset Number</div>
            <div className={styles.data}>
              <Dropdown
                items={assetList.map(asset => ({ id: asset, value: asset }))}
                name="assetNumber"
                disabled
                multiple
              />
            </div>
          </div>
        </Grid>
        <Grid item xs={6}>
          {" "}
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
            {formik.values.currentRecord >= 0 && (
              <Button
                color="secondary"
                variant="contained"
                style={{
                  marginLeft: "20px",
                }}
                onClick={() => onDelete(formik)}
              >
                Delete
              </Button>
            )}
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              disabled={!formik.values.equipment || !formik.values.quantity}
              onClick={() => onSave(formik)}
            >
              Save
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};
