import * as React from 'react';
import { Grid, FormControl, InputLabel, Select, MenuItem } from "@material-ui/core";
import { STATUS } from '../utils/helpers';
import styles from '../ViewNewEquipmentRequest.module.scss';
import { FormikErrors, FormikTouched } from 'formik';

interface IBasicInformationProps {
  referenceNumber: string;
  status: string;
  touched: FormikTouched<any>;
  errors: FormikErrors<any>;
  handleChange: (event: React.ChangeEvent<any>) => void;
  handleBlur: (event: React.FocusEvent<any>) => void;
}

export const BasicInformation: React.FC<IBasicInformationProps> = ({
  referenceNumber,
  status,
  touched,
  errors,
  handleChange,
  handleBlur
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Reference Number</div>
          <div>{referenceNumber}</div>
        </div>
      </Grid>
      <Grid item xs={6}>
        <FormControl fullWidth error={touched.status && !!errors.status}>
          <InputLabel>Status</InputLabel>
          <Select
            name="status"
            value={status}
            onChange={handleChange}
            onBlur={handleBlur}
          >
            {Object.values(STATUS).map((statusOption) => (
              <MenuItem key={statusOption} value={statusOption}>
                {statusOption}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </>
  );
};