import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import { IEquipmentData } from './interfaces/IApproverFormValues';
import { Dropdown } from '../common/FormComponents';
import { ModalPopup } from '../common/ModalPopup';
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IDropdownItem {
  id: string | number;
  value: string;
}

interface IApproverEquipmentDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (equipment: IEquipmentData) => void;
  currentEquipment: IEquipmentData;
  equipmentList: IDropdownItem[];
  quantityList: IDropdownItem[];
  assetList: string[];
  equipmentError?: string;
  handleEquipment: (e: React.ChangeEvent<{ name?: string; value: any }>) => void;
  handleQuantity: (e: React.ChangeEvent<{ name?: string; value: any }>) => void;
}

export const ApproverEquipmentDialog: React.FC<IApproverEquipmentDialogProps> = ({
  open,
  onClose,
  onSave,
  currentEquipment,
  equipmentList,
  quantityList,
  assetList,
  equipmentError,
  handleEquipment,
  handleQuantity
}) => {
  const handleSave = () => {
    onSave(currentEquipment);
  };

  return (
    <ModalPopup
      title="View/Edit Equipment"
      open={open}
      onClose={onClose}
    >
      <Grid container spacing={2}>
        <Grid item xs={12}>
          {equipmentError && (
            <span style={{ color: "red" }}>
              {equipmentError}
            </span>
          )}
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Equipment</div>
            <Dropdown
              items={equipmentList}
              name="equipment"
              handleChange={handleEquipment}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Quantity</div>
            <Dropdown
              items={quantityList}
              name="quantity"
              handleChange={handleQuantity}
            />
          </div>
        </Grid>
        <Grid item xs={6}>
          <div className={styles.width}>
            <div className={styles.label}>Asset Number</div>
            <Dropdown
              items={assetList.map(asset => ({ id: asset, value: asset }))}
              name="assetNumber"
              disabled
              multiple
            />
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
            <Button
              color="primary"
              variant="contained"
              style={{
                marginLeft: "20px",
              }}
              disabled={!currentEquipment.equipment || !currentEquipment.quantity}
              onClick={handleSave}
            >
              Save
            </Button>
          </div>
        </Grid>
      </Grid>
    </ModalPopup>
  );
};