import * as React from 'react';
import { Grid, TextField } from "@material-ui/core";
import styles from '../ViewNewEquipmentRequest.module.scss';

interface IRemarksSectionProps {
  remarks: string;
  handleChange: (event: React.ChangeEvent<any>) => void;
  handleBlur: (event: React.FocusEvent<any>) => void;
}

export const RemarksSection: React.FC<IRemarksSectionProps> = ({
  remarks,
  handleChange,
  handleBlur
}) => {
  return (
    <Grid item xs={12}>
      <div className={styles.width}>
        <div className={styles.label}>Remarks</div>
        <TextField
          fullWidth
          name="remarks"
          value={remarks}
          onChange={handleChange}
          onBlur={handleBlur}
          multiline
          rows={4}
        />
      </div>
    </Grid>
  );
};