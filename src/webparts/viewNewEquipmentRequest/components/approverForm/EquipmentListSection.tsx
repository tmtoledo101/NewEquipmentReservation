import * as React from 'react';
import { Grid } from "@material-ui/core";
import VisibilityIcon from "@material-ui/icons/Visibility";
import styles from '../ViewNewEquipmentRequest.module.scss';
import { IEquipmentData } from './interfaces/IApproverFormValues';

interface IEquipmentListSectionProps {
  equipmentData: IEquipmentData[];
  onView?: (index: number) => void;
}

export const EquipmentListSection: React.FC<IEquipmentListSectionProps> = ({
  equipmentData,
  onView
}) => {
  if (!equipmentData || equipmentData.length === 0) {
    return null;
  }

  const handleView = (index: number) => {
    if (onView) {
      onView(index);
    }
  };

  return (
    <Grid item xs={12}>
      <div className={styles.viewNewEquipmentRequest}>
        <div className={styles.width}>
          <div className={styles.label}>Equipment List</div>
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
                      <div onClick={() => handleView(index)}>
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
        </div>
      </div>
    </Grid>
  );
};