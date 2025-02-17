import * as React from "react";
import { Grid } from "@material-ui/core";
import { FormikProps } from "formik";
import { CustomInput, Dropdown, CustomDateTimePicker } from "./FormComponents";
import { IFormValues } from "../interfaces/IFormValues";
import styles from "../DisplayNewEquipmentRequest.module.scss";

interface IBasicInformationProps {
  formik: FormikProps<IFormValues>;
  departmentList: Array<{ id: string | number; value: string }>;
  buildingList: Array<{ id: string | number; value: string }>;
  borrowedFromList: Array<{ id: string | number; value: string }>;
  timeList: Array<{ id: string | number; value: string }>;
  handleBuilding: (e: any) => void;
  handleBorrowedFrom: (e: any, formik: FormikProps<IFormValues>) => void;
  isEdit: boolean;
}

export const BasicInformation: React.FC<IBasicInformationProps> = ({
  formik,
  departmentList,
  buildingList,
  borrowedFromList,
  timeList,
  handleBuilding,
  handleBorrowedFrom,
  isEdit,
}) => {
  return (
    <>
      <Grid item xs={12} sm={6}>
        <div className={styles.label}>Reference Number</div>
        <CustomInput name="referenceNumber" disabled />
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.label}>Request Date</div>
        <CustomInput name="requestDate" disabled />
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.label}>Requested By</div>
        <CustomInput name="requestedBy" disabled />
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Department</div>
          <Dropdown items={departmentList} name="department" disabled />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.label}>Contact No.</div>
        <CustomInput name="contactNumber" disabled />
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <Dropdown
            items={buildingList}
            name="building"
            handleChange={handleBuilding}
            disabled
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Borrowed From</div>
          <Dropdown
            items={borrowedFromList}
            name="borrowedFrom"
            handleChange={(e) => handleBorrowedFrom(e, formik)}
            disabled
          />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Time</div>
          <Dropdown items={timeList} name="time" disabled />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - From</div>
          <CustomDateTimePicker name="fromDate" disabled />
        </div>
      </Grid>
      <Grid item xs={12} sm={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - To</div>
          <CustomDateTimePicker name="toDate" disabled />
        </div>
      </Grid>
      <Grid item xs={12}>
        <div className={styles.width}>
          <div className={styles.label}>Remarks</div>
          <CustomInput name="remarks" disabled />
        </div>
      </Grid>
    </>
  );
};
