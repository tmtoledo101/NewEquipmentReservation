import * as React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Button,
} from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import SaveIcon from '@material-ui/icons/Save';
import { Formik } from 'formik';
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Equipment Details</DialogTitle>
      <Formik
        enableReinitialize
        initialValues={{
          equipment: formik.values.equipment || '',
          quantity: formik.values.quantity || '',
          assetNumber: formik.values.assetNumber || [],
          currentRecord: formik.values.currentRecord || -1,
        }}
        onSubmit={() => {}}
      >
        {({ values, setFieldValue }) => (
          <>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ marginBottom: '8px' }}>Equipment</div>
                    <Dropdown
                      name="equipment"
                      items={equipmentList}
                      handleChange={handleEquipment}
                    />
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
                    <Dropdown
                      name="quantity"
                      items={quantityList}
                      handleChange={handleQuantity}
                    />
                  </div>
                </Grid>

                <Grid item xs={12}>
                  <div>
                    <div style={{ marginBottom: '8px' }}>Asset Number</div>
                    <div style={{ fontSize: '14px' }}>
                      {values.assetNumber.map((asset: string, index: number) => (
                        <div key={index}>{asset}</div>
                      ))}
                    </div>
                  </div>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              {values.currentRecord > -1 && (
                <Button
                  onClick={() => onDelete({ values, setFieldValue })}
                  variant="contained"
                  style={{ backgroundColor: '#f44336', color: 'white' }}
                  startIcon={<DeleteIcon />}
                >
                  Delete
                </Button>
              )}
              <Button
                onClick={() => onSave({ values, setFieldValue })}
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
              >
                Save
              </Button>
            </DialogActions>
          </>
        )}
      </Formik>
    </Dialog>
  );
};
