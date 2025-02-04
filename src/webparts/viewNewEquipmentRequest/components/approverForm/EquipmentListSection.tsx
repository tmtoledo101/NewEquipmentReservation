import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import AddIcon from "@material-ui/icons/Add";
import styles from '../ViewNewEquipmentRequest.module.scss';
import { IEquipmentData } from './interfaces/IApproverFormValues';
import { ApproverEquipmentDialog } from './ApproverEquipmentDialog';

interface IEquipmentListSectionProps {
  equipmentData: IEquipmentData[];
  onView?: (index: number) => void;
  onAdd?: () => void;
  onUpdateEquipment?: (index: number, updatedEquipment: IEquipmentData) => void;
}

export const EquipmentListSection: React.FC<IEquipmentListSectionProps> = ({
  equipmentData,
  onView,
  onAdd,
  onUpdateEquipment
}) => {
  const [selectedIndex, setSelectedIndex] = React.useState<number>(-1);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [currentEquipment, setCurrentEquipment] = React.useState<IEquipmentData | null>(null);
  const [equipmentError, setEquipmentError] = React.useState<string>("");

  const handleAdd = () => {
    setCurrentEquipment({
      equipment: '',
      quantity: '',
      assetNumber: []
    });
    setDialogOpen(true);
    setSelectedIndex(-1);
    if (onAdd) {
      onAdd();
    }
  };

  const handleView = (index: number) => {
    setSelectedIndex(index);
    setCurrentEquipment(equipmentData[index]);
    setDialogOpen(true);
    if (onView) {
      onView(index);
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setCurrentEquipment(null);
    setSelectedIndex(-1);
    setEquipmentError("");
  };

  const handleEquipmentUpdate = (updatedEquipment: IEquipmentData) => {
    if (onUpdateEquipment && selectedIndex >= 0) {
      onUpdateEquipment(selectedIndex, updatedEquipment);
    }
    handleDialogClose();
  };

  const validateEquipment = (equipment: IEquipmentData) => {
    if (!equipment.equipment || !equipment.quantity) {
      setEquipmentError("Equipment and quantity are required");
    } else {
      setEquipmentError("");
    }
  };

  const handleEquipmentChange = (e: React.ChangeEvent<{ name?: string; value: any }>) => {
    if (currentEquipment) {
      const newEquipment = {
        ...currentEquipment,
        equipment: e.target.value as string
      };
      setCurrentEquipment(newEquipment);
      validateEquipment(newEquipment);
    }
  };

  const handleQuantityChange = (
    e: React.ChangeEvent<{ name?: string; value: any }>
  ) => {
    if (!currentEquipment) return;
  
    // Check that e.target and its value exist before casting.
    const quantity =
      e.target && e.target.value ? (e.target.value as string) : '';
  
    const newEquipment = {
      ...currentEquipment,
      quantity,
    };
  
    setCurrentEquipment(newEquipment);
    validateEquipment(newEquipment);
  };

  return (
    <Grid item xs={12}>
      <div className={styles.viewNewEquipmentRequest}>
        <div className={styles.width}>
          <div className={styles.label}>Equipment List</div>
          <div style={{ marginBottom: '20px' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAdd}
              startIcon={<AddIcon />}
            >
              Add Equipment
            </Button>
          </div>
          {equipmentData && equipmentData.length > 0 && (
            <div className={styles.equipmentDetails}>
              <table>
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Equipment</th>
                    <th>Quantity</th>
                    <th>Asset Number</th>
                  </tr>
                </thead>
                <tbody>
                  {equipmentData.map((item, index) => (
                    <tr key={index}>
                      <td>
                        <div onClick={() => handleView(index)} style={{ cursor: 'pointer' }}>
                          <VisibilityIcon />
                        </div>
                      </td>
                      <td>{item.equipment}</td>
                      <td>{item.quantity}</td>
                      <td>
                        {item.assetNumber && item.assetNumber.map((asset, number) => (
                          <span key={asset}>
                            {asset}
                            {item.assetNumber.length > 0 &&
                              (number < item.assetNumber.length - 1) ? ', ' : ''}
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {dialogOpen && currentEquipment && (
        <ApproverEquipmentDialog
          open={dialogOpen}
          onClose={handleDialogClose}
          onSave={handleEquipmentUpdate}
          currentEquipment={currentEquipment}
          equipmentList={[{ id: currentEquipment.equipment, value: currentEquipment.equipment }]}
          quantityList={[{ id: currentEquipment.quantity, value: currentEquipment.quantity.toString() }]}
          assetList={currentEquipment.assetNumber}
          equipmentError={equipmentError}
          handleEquipment={handleEquipmentChange}
          handleQuantity={handleQuantityChange}
        />
      )}
    </Grid>
  );
};