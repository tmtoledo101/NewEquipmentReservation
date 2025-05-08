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

  console.log('EquipmentDialog Props:', {
    assetList,
    formikValues: formik.values,
    currentRecord: formik.values.currentRecord,
    assetNumber: formik.values.assetNumber,
    equipmentList,
    quantityList
  });
  
  // Use internal state to track selected values and validation
  const [selectedEquipment, setSelectedEquipment] = React.useState("");
  const [selectedQuantity, setSelectedQuantity] = React.useState("");
  const [selectedAssets, setSelectedAssets] = React.useState<string[]>([]);
  const [isValidating, setIsValidating] = React.useState(false);
  
  // Effect to update asset numbers whenever quantity changes
  React.useEffect(() => {
    if (selectedQuantity && assetList.length > 0) {
      const parsedQuantity = parseInt(selectedQuantity);
      if (!isNaN(parsedQuantity)) {
        const newSelectedAssets = assetList.slice(0, parsedQuantity);
        console.log('Updating asset numbers:', {
          quantity: parsedQuantity,
          selectedAssets: newSelectedAssets,
          currentAssetNumbers: formik.values.assetNumber
        });
        
        setSelectedAssets(newSelectedAssets);
        formik.setFieldValue('assetNumber', newSelectedAssets, false);
      }
    }
  }, [selectedQuantity, assetList]);
  
  // Effect to initialize state when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log('Dialog Effect:', {
        open,
        selectedEquipment,
        selectedQuantity,
        assetList,
        formikValues: formik.values
      });

      if (!selectedEquipment && formik.values.equipment) {
        setSelectedEquipment(formik.values.equipment);
      }
      if (!selectedQuantity && formik.values.quantity) {
        setSelectedQuantity(formik.values.quantity);
      }
      if (formik.values.assetNumber && formik.values.assetNumber.length > 0) {
        setSelectedAssets(formik.values.assetNumber);
      }
    }
  }, [open]);

  // Custom handlers that update internal state first, then call parent handlers
  const handleEquipmentSelect = (e: any) => {
    console.log('Equipment Selected:', {
      value: e.target.value,
      previousEquipment: selectedEquipment
    });
    setSelectedEquipment(e.target.value);
    handleEquipment(e);
  };
  
  const handleQuantitySelect = async (e: any) => {
    const newQuantity = e.target.value;
    console.log('Quantity Selected:', {
      value: newQuantity,
      previousQuantity: selectedQuantity,
      availableAssets: assetList,
      currentFormikValues: formik.values
    });

    setSelectedQuantity(newQuantity);
    await handleQuantity(e);
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
      <Grid container spacing={2} style={{ maxHeight: '60vh', overflowY: 'auto', margin: 0, width: '100%', padding: '16px' }}>
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
                items={assetList.map(asset => ({
                  id: asset,
                  value: asset
                }))}
                name="assetNumber"
                disabled
                multiple
                value={selectedAssets}
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
              alignItems: "center"
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
                      assetNumber: selectedAssets
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
                marginLeft: "20px"
              }}
              disabled={!selectedEquipment || !selectedQuantity}
              onClick={async () => {
                setIsValidating(true);
                
                console.log('Saving Equipment:', {
                  selectedEquipment,
                  selectedQuantity,
                  selectedAssets,
                  originalAssetNumbers: formik.values.assetNumber,
                  availableAssets: assetList
                });

                try {
                  // Update formik values without validation
                  await formik.setFieldValue("equipment", selectedEquipment, false);
                  await formik.setFieldValue("quantity", selectedQuantity, false);
                  await formik.setFieldValue("assetNumber", selectedAssets, false);
                  
                  // Create modified formik instance for save
                  const modifiedFormik = {
                    ...formik,
                    values: {
                      ...formik.values,
                      equipment: selectedEquipment,
                      quantity: selectedQuantity,
                      assetNumber: selectedAssets,
                      currentRecord: formik.values.currentRecord
                    }
                  };
                  
                  onSave(modifiedFormik);
                } catch (error) {
                  console.error('Error saving equipment:', error);
                } finally {
                  setIsValidating(false);
                }
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
