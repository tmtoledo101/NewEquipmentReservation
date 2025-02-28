import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
  TextField,
  MenuItem,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import { Dropdown } from './FormComponents';

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
    console.log("Dialog effect - checking if state needs update");
    
    // Only update if the values are different to avoid loops
    if (formik.values.equipment && formik.values.equipment !== selectedEquipment) {
      console.log("Updating selectedEquipment from formik:", formik.values.equipment);
      setSelectedEquipment(formik.values.equipment);
    }
    
    if (formik.values.quantity && formik.values.quantity !== selectedQuantity) {
      console.log("Updating selectedQuantity from formik:", formik.values.quantity);
      setSelectedQuantity(formik.values.quantity);
    }
  }, [formik.values.equipment, formik.values.quantity]);
  
  // Additional effect to initialize state when dialog opens
  React.useEffect(() => {
    if (open) {
      console.log("Dialog opened - initializing state");
      // Only set if not already set to avoid overwriting user selections
      if (!selectedEquipment && formik.values.equipment) {
        setSelectedEquipment(formik.values.equipment);
      }
      if (!selectedQuantity && formik.values.quantity) {
        setSelectedQuantity(formik.values.quantity);
      }
    }
  }, [open]);
  
  // Log current state with currentRecord
  console.log("[DIALOG] Current state:", {
    selectedEquipment,
    selectedQuantity,
    formikEquipment: formik.values.equipment,
    formikQuantity: formik.values.quantity,
    currentRecord: formik.values.currentRecord
  });
  
  // Custom handlers that update internal state first, then call parent handlers
  const handleEquipmentSelect = (e: any) => {
    const value = e.target.value;
    console.log("[DIALOG] Equipment selected:", value);
    
    // Update internal state immediately
    setSelectedEquipment(value);
    
    // Call parent handler
    handleEquipment(e);
  };
  
  const handleQuantitySelect = (e: any) => {
    const value = e.target.value;
    console.log("[DIALOG] Quantity selected:", value);
    
    // Update internal state immediately
    setSelectedQuantity(value);
    
    // Call parent handler
    handleQuantity(e);
  };

  return (
    <Dialog 
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
      maxWidth="sm" 
      fullWidth
    >
      <DialogTitle>Equipment Details</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>Equipment</div>
              <TextField
                select
                fullWidth
                variant="standard"
                name="equipment"
                value={selectedEquipment}
                onChange={handleEquipmentSelect}
              >
                <MenuItem value="">
                  <em>Select...</em>
                </MenuItem>
                {equipmentList.map((item) => (
                  <MenuItem key={item.id} value={item.value}>
                    {item.value}
                  </MenuItem>
                ))}
              </TextField>
              {equipmentError && (
                <div style={{ color: 'red', fontSize: '12px', marginTop: '4px' }}>
                  {equipmentError}
                </div>
              )}
            </div>
          </Grid>

          <Grid item xs={12}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>Quantity</div>
              <TextField
                select
                fullWidth
                variant="standard"
                name="quantity"
                value={selectedQuantity}
                onChange={handleQuantitySelect}
              >
                <MenuItem value="">
                  <em>Select...</em>
                </MenuItem>
                {quantityList.map((item) => (
                  <MenuItem key={item.id} value={item.value}>
                    {item.value}
                  </MenuItem>
                ))}
              </TextField>
            </div>
          </Grid>

          <Grid item xs={12}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ marginBottom: '8px' }}>Asset Number</div>
              <div style={{ border: '1px solid #ccc', padding: '8px', borderRadius: '4px', minHeight: '56px' }}>
                {(() => {
                  // Log asset information for debugging
                  console.log("[DIALOG] Asset display logic:", {
                    selectedQuantity,
                    formikAssetNumber: formik.values.assetNumber,
                    assetList,
                    currentRecord: formik.values.currentRecord
                  });
                  
                  // If we have asset numbers in formik values and it's an existing record (currentRecord > -1),
                  // use those asset numbers directly
                  if (formik.values.assetNumber && formik.values.assetNumber.length > 0 && formik.values.currentRecord > -1) {
                    console.log("[DIALOG] Using existing asset numbers from formik");
                    return formik.values.assetNumber.map((asset: string, index: number) => (
                      <div key={index} style={{ margin: '4px 0' }}>{asset}</div>
                    ));
                  }
                  // Otherwise, if quantity is selected, show asset numbers from assetList based on quantity
                  else if (selectedQuantity) {
                    console.log("[DIALOG] Using asset numbers from assetList based on quantity");
                    return assetList.slice(0, parseInt(selectedQuantity)).map((asset: string, index: number) => (
                      <div key={index} style={{ margin: '4px 0' }}>{asset}</div>
                    ));
                  }
                  // Fallback to empty array if no asset numbers available
                  else {
                    console.log("[DIALOG] No asset numbers to display");
                    return null;
                  }
                })()}
              </div>
            </div>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        {formik.values.currentRecord > -1 && (
          <Button
            onClick={() => {
              console.log("[DIALOG] Delete button clicked with currentRecord:", formik.values.currentRecord);
              
              // Create a modified formik object with the selected values
              const modifiedFormik = {
                ...formik,
                values: {
                  ...formik.values,
                  equipment: selectedEquipment,
                  quantity: selectedQuantity,
                  // Include selected asset numbers based on quantity
                  assetNumber: selectedQuantity ? 
                    assetList.slice(0, parseInt(selectedQuantity)) : 
                    formik.values.assetNumber
                }
              };
              
              onDelete(modifiedFormik);
            }}
            variant="contained"
            style={{ backgroundColor: '#f44336', color: 'white' }}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        )}
        <Button
          onClick={() => {
            // Pass the selected values to the onSave function
            console.log("[DIALOG] Save button clicked with values:", {
              selectedEquipment,
              selectedQuantity
            });
            
            // Create a modified formik object with the selected values
            const modifiedFormik = {
              ...formik,
              values: {
                ...formik.values,
                equipment: selectedEquipment,
                quantity: selectedQuantity,
                // Include selected asset numbers based on quantity
                assetNumber: selectedQuantity ? 
                  assetList.slice(0, parseInt(selectedQuantity)) : 
                  formik.values.assetNumber,
                // Make sure to preserve the currentRecord value
                currentRecord: formik.values.currentRecord
              }
            };
            
            onSave(modifiedFormik);
          }}
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
