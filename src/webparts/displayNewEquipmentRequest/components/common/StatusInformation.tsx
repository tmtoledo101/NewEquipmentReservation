import * as React from "react";
import { Grid } from "@material-ui/core";
import { FormikProps } from "formik";
import { CustomInput } from "./FormComponents";
import { IFormValues } from "../interfaces/IFormValues";
import { RETURN, COMPLETED } from "../utils/helpers";
import styles from "../DisplayNewEquipmentRequest.module.scss";

interface IStatusInformationProps {
  formik: FormikProps<IFormValues>;
  requestStatus: string;
  isEdit: boolean;
}

export const StatusInformation: React.FC<IStatusInformationProps> = ({
  formik,
  requestStatus,
  isEdit,
}) => {
  return (
    <>
      {(requestStatus === RETURN || requestStatus === COMPLETED) && (
        <>
          <Grid item xs={6}>
            <div className={styles.label}>Released By</div>
            <CustomInput name="releasedBy" disabled />
          </Grid>
          <Grid item xs={6}>
            <div className={styles.label}>Released To</div>
            <CustomInput name="releasedTo" disabled={true} />
          </Grid>
          <Grid item xs={6}>
            <div className={styles.label}>Released Remarks</div>
          <CustomInput
            name="releasedRemarks"
            disabled={true}
          />
          </Grid>
        </>
      )}
      {requestStatus === COMPLETED && (
        <>
          <Grid item xs={6}>
            <div className={styles.label}>Returned To</div>
            <CustomInput name="returnedTo" disabled />
          </Grid>
          <Grid item xs={6}>
            <div className={styles.label}>Returned By</div>
            <CustomInput name="returnedBy" disabled={!isEdit} />
          </Grid>
          <Grid item xs={12}>
            <div className={styles.label}>Returned Remarks</div>
            <CustomInput name="returnedRemarks" disabled={!isEdit} />
          </Grid>
        </>
      )}
      <Grid item xs={12}>
        <div className={styles.label}>Status</div>
        <CustomInput name="status" disabled />
      </Grid>
    </>
  );
};
