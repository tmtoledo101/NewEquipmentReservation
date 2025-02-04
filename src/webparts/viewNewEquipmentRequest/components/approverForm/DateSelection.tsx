import * as React from 'react';
import { Grid } from "@material-ui/core";
import { CustomDateTimePicker } from '../common/FormComponents';
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IDateSelectionProps {
  fromDate: Date | string | null;
  toDate: Date | string | null;
}

export const DateSelection: React.FC<IDateSelectionProps> = () => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>From Date</div>
          <CustomDateTimePicker
            name="fromDate"
          />
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>To Date</div>
          <CustomDateTimePicker
            name="toDate"
          />
        </div>
      </Grid>
    </>
  );
};