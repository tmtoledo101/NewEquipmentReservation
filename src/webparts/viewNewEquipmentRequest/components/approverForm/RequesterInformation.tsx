import * as React from 'react';
import { Grid } from "@material-ui/core";
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IRequesterInformationProps {
  requestedBy: string;
  department: string;
}

export const RequesterInformation: React.FC<IRequesterInformationProps> = ({
  requestedBy,
  department
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <div>{requestedBy}</div>
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Department</div>
          <div>{department}</div>
        </div>
      </Grid>
    </>
  );
};