import * as React from 'react';
import { Fab } from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import VisibilityIcon from "@material-ui/icons/Visibility";
import { IEquipmentData } from '../interfaces/INewEquipmentReservation';
import styles from '../NewEquimentReservation.module.scss';

interface IEquipmentListProps {
  equipmentData: IEquipmentData[];
  onAdd: () => void;
  onView: (index: number) => void;
}

export const EquipmentList: React.FC<IEquipmentListProps> = ({
  equipmentData,
  onAdd,
  onView
}) => {
  return (
    <>
      <div className={styles.label}>Reserve Equipment</div>
      <div className={styles.data}>
        <Fab
          color="primary"
          aria-label="add"
          size="small"
          onClick={onAdd}
        >
          <AddIcon />
        </Fab>
      </div>
      {equipmentData.length > 0 && (
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
                    <div onClick={() => onView(index)}>
                      <VisibilityIcon />
                    </div>
                  </td>
                  <td>{item.equipment}</td>
                  <td>{item.quantity}</td>
                  <td>
                    {item.assetNumber.map((asset, number) => (
                      <span key={asset}>
                        {asset}
                        {item.assetNumber.length > 0 && 
                          (number < item.assetNumber.length - 1) ? ',' : ""}
                      </span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};
