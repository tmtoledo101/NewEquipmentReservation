import * as React from 'react';
import { Grid, TextField } from "@material-ui/core";
import styles from '../ViewNewEquipmentRequest.module.scss';
import { FormikErrors, FormikTouched } from 'formik';

interface IBorrowingDetailsProps {
  borrowedFrom: string;
  time: string;
  touched: FormikTouched<any>;
  errors: FormikErrors<any>;
  handleChange: (event: React.ChangeEvent<any>) => void;
  handleBlur: (event: React.FocusEvent<any>) => void;
}

export const BorrowingDetails: React.FC<IBorrowingDetailsProps> = ({
  borrowedFrom,
  time,
  touched,
  errors,
  handleChange,
  handleBlur
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Borrowed From</div>
          <TextField
            fullWidth
            name="borrowedFrom"
            value={borrowedFrom}
            onChange={handleChange}
            onBlur={handleBlur}
          />
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Time</div>
          <TextField
            fullWidth
            name="time"
            value={time}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.time && !!errors.time}
            helperText={touched.time && errors.time}
          />
        </div>
      </Grid>
    </>
  );
};