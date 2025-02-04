import * as React from 'react';
import { Grid, TextField } from "@material-ui/core";
import styles from '../ViewNewEquipmentRequest.module.scss';
import { FormikErrors, FormikTouched } from 'formik';

interface IContactInformationProps {
  contactNumber: string;
  building: string;
  touched: FormikTouched<any>;
  errors: FormikErrors<any>;
  handleChange: (event: React.ChangeEvent<any>) => void;
  handleBlur: (event: React.FocusEvent<any>) => void;
}

export const ContactInformation: React.FC<IContactInformationProps> = ({
  contactNumber,
  building,
  touched,
  errors,
  handleChange,
  handleBlur
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Contact Number</div>
          <TextField
            fullWidth
            name="contactNumber"
            value={contactNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.contactNumber && !!errors.contactNumber}
            helperText={touched.contactNumber && errors.contactNumber}
          />
        </div>
      </Grid>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <TextField
            fullWidth
            name="building"
            value={building}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.building && !!errors.building}
            helperText={touched.building && errors.building}
          />
        </div>
      </Grid>
    </>
  );
};