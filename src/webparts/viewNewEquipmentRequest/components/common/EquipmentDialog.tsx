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
  
  // Local state to ensure immediate UI updates
  const [localEquipment, setLocalEquipment] = React.useState<string>('');
  const [localQuantity, setLocalQuantity] = React.useState<string>('');
  
  // Sync local state with formik values when dialog opens or formik values change
  React.useEffect(() => {
    setLocalEquipment(formik.values.equipment || '');
    setLocalQuantity(formik.values.quantity || '');
  }, [open, formik.values.equipment, formik.values.quantity]);
  
  // Enhanced handlers that update both local state and formik values
  const handleEquipmentChangeWithLocalState = (e: any) => {
    const value = e.target.value;
    setLocalEquipment(value);
    handleEquipment(e);
  };
  
  const handleQuantityChangeWithLocalState = (e: any) => {
    const value = e.target.value;
    setLocalQuantity(value);
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
                value={localEquipment}
                onChange={handleEquipmentChangeWithLocalState}
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
                value={localQuantity}
                onChange={handleQuantityChangeWithLocalState}
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
                {(formik.values.assetNumber || []).map((asset: string, index: number) => (
                  <div key={index} style={{ margin: '4px 0' }}>{asset}</div>
                ))}
              </div>
            </div>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        {formik.values.currentRecord > -1 && (
          <Button
            onClick={() => onDelete(formik)}
            variant="contained"
            style={{ backgroundColor: '#f44336', color: 'white' }}
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        )}
        <Button
          onClick={() => onSave(formik)}
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
