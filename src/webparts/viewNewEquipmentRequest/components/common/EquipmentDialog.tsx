import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import { Dropdown } from './FormComponents';
import { ModalPopup } from './ModalPopup';
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (formik: any) => void;
  onDelete: (formik: any) => void;
  formik: any;
  equipmentList: Array<{ id: string; value: string }>;
  quantityList: Array<{ id: string | number; value: string }>;
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
  handleQuantity,
}) => {
  if (!formik) return null;
  
  // Use internal state to track selected values
  const [selectedEquipment, setSelectedEquipment] = React.useState("");
  const [selectedQuantity, setSelectedQuantity] = React.useState("");
  
  // Sync internal state with formik values when dialog opens or when formik values change
  React.useEffect(() => {
    if (formik.values.equipment && formik.values.equipment !== selectedEquipment) {
      setSelectedEquipment(formik.values.equipment);
    }
    
    if (formik.values.quantity && formik.values.quantity !== selectedQuantity) {
      setSelectedQuantity(formik.values.quantity);
    }
  }, [formik.values.equipment, formik.values.quantity]);
  
  // Additional effect to initialize state when dialog opens
  React.useEffect(() => {
    if (open) {
      if (!selectedEquipment && formik.values.equipment) {
        setSelectedEquipment(formik.values.equipment);
      }
      if (!selectedQuantity && formik.values.quantity) {
        setSelectedQuantity(formik.values.quantity);
      }
    }
  }, [open]);

  // Custom handlers that update internal state first, then call parent handlers
  const handleEquipmentSelect = (e: any) => {
    setSelectedEquipment(e.target.value);
    handleEquipment(e);
  };
  
  const handleQuantitySelect = (e: any) => {
    setSelectedQuantity(e.target.value);
    handleQuantity(e);
  };

  return (
    <ModalPopup
      title="Add Equipment"
      hideCloseIcon={false}
      open={open}
      onClose={() => {
        if (formik && formik.setFieldValue) {
          formik.setFieldValue("equipment", "");
          formik.setFieldValue("quantity", "");
          formik.setFieldValue("assetNumber", []);
          formik.setFieldValue("currentRecord", -1);
        }
        onClose();
      }}
    >
      <Grid container spacing={2} style={{ margin: 0, width: '100%', padding: '16px' }}>
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
                handleChange={handleEquipmentSelect}
                value={selectedEquipment || ''}
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
                handleChange={handleQuantitySelect}
                value={selectedQuantity || ''}
              />
            </div>
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Asset Number</div>
            <div className={styles.data}>
              <Dropdown
                items={(() => {
                  // If viewing an existing record, use its asset numbers
                  if (formik.values.currentRecord > -1 && formik.values.assetNumber && formik.values.assetNumber.length > 0) {
                    return formik.values.assetNumber.map(asset => ({ id: asset, value: asset }));
                  }
                  // If selecting a new quantity, show available asset numbers based on quantity
                  else if (selectedQuantity) {
                    return assetList.slice(0, parseInt(selectedQuantity)).map(asset => ({ id: asset, value: asset }));
                  }
                  return [];
                })()}
                name="assetNumber"
                disabled
                multiple
                value={formik.values.assetNumber || []}
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
              justifyContent: "flex-end",
              alignItems: "center",
              marginTop: "20px"
            }}
          >
            <Button
              color="secondary"
              variant="contained"
              onClick={onClose}
            >
              Cancel
            </Button>
            {formik.values.currentRecord > -1 && (
              <Button
                color="secondary"
                variant="contained"
                style={{
                  marginLeft: "20px"
                }}
                onClick={() => {
                  const modifiedFormik = {
                    ...formik,
                    values: {
                      ...formik.values,
                      equipment: selectedEquipment,
                      quantity: selectedQuantity,
                      assetNumber: selectedQuantity ? 
                        assetList.slice(0, parseInt(selectedQuantity)) : 
                        formik.values.assetNumber
                    }
                  };
                  onDelete(modifiedFormik);
                }}
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
              startIcon={<SaveIcon />}
              disabled={!selectedEquipment || !selectedQuantity}
              onClick={() => {
                const modifiedFormik = {
                  ...formik,
                  values: {
                    ...formik.values,
                    equipment: selectedEquipment,
                    quantity: selectedQuantity,
                    assetNumber: selectedQuantity ? 
                      assetList.slice(0, parseInt(selectedQuantity)) : 
                      formik.values.assetNumber,
                    currentRecord: formik.values.currentRecord
                  }
                };
                onSave(modifiedFormik);
              }}
            >
              Save
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};
