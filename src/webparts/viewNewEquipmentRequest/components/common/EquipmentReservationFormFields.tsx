import * as React from 'react';
import { Grid } from "@material-ui/core";
import { CustomInput, CustomDateTimePicker, Dropdown } from './FormComponents';
import { EquipmentList } from './EquipmentList';
import { DropzoneArea } from "material-ui-dropzone";
import { IDropdownItem, IEquipmentData } from '../utils/helpers';
import styles from './EquipmentReservationForm.module.scss';

interface IEquipmentReservationFormFieldsProps {
  departmentList: IDropdownItem[];
  buildingList: IDropdownItem[];
  borrowedFromList: IDropdownItem[];
  timeList: IDropdownItem[];
  equipmentData: IEquipmentData[];
  tabValue: number;
  handleBuilding: (e: any) => void;
  handleBorrowedFrom: (e: any) => void;
  handleTimeChange: (e: any) => void;
  handleFileChange: (files: File[]) => void;
  onAddEquipment: () => void;
  onViewEquipment: (index: number) => void;
  formik: any;
}

const RETURNED_STATUS = [{ id: 'Return', value: 'Return' }];
const REGULAR_STATUS = [
  { id: 'Release', value: 'Release' },
  { id: 'Cancel', value: 'Cancel' }
];

const EquipmentReservationFormFieldsBase: React.FC<IEquipmentReservationFormFieldsProps> = ({
  departmentList,
  buildingList,
  borrowedFromList,
  timeList,
  equipmentData,
  tabValue,
  handleBuilding,
  handleBorrowedFrom,
  handleTimeChange,
  handleFileChange,
  onAddEquipment,
  onViewEquipment,
  formik
}: IEquipmentReservationFormFieldsProps) => {
  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <h2><b>Equipment Reservation Details</b></h2>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <CustomInput name="requestedBy" disabled />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Department</div>
          <Dropdown
            items={departmentList}
            name="department"
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Contact No.</div>
          <CustomInput name="contactNumber" />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <Dropdown
            items={buildingList}
            name="building"
            handleChange={handleBuilding}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Borrowed From</div>
          <Dropdown
            items={borrowedFromList}
            name="borrowedFrom"
            handleChange={handleBorrowedFrom}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Time</div>
          <Dropdown
            items={timeList}
            name="time"
            handleChange={handleTimeChange}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - From</div>
          <CustomDateTimePicker
            name="fromDate"
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - To</div>
          <CustomDateTimePicker
            name="toDate"
          />
        </div>
      </Grid>

      <Grid item xs={12}>
        <EquipmentList
          equipmentData={equipmentData}
          onAdd={onAddEquipment}
          onView={onViewEquipment}
        />
      </Grid>

      <Grid item xs={12}>
        <div className={styles.width}>
          <div className={styles.label}>Remarks</div>
          <CustomInput name="remarks" />
        </div>
      </Grid>

      <Grid item xs={12}>
        <div className={styles.width}>
          <div className={styles.label}>Status</div>
          <Dropdown
            items={tabValue === 3 ? RETURNED_STATUS : REGULAR_STATUS}
            name="status"
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.label}>
          Attachment Here
        </div>
      </Grid>

      <Grid item xs={12}>
        <DropzoneArea
          showPreviews={true}
          showPreviewsInDropzone={false}
          useChipsForPreview
          dropzoneClass={styles.dropZone}
          previewGridProps={{
            container: { spacing: 1, direction: "row" },
          }}
          previewChipProps={{
            classes: { root: styles.previewChip },
          }}
          dropzoneText="Drag and drop files here or click"
          previewText="Selected files"
          maxFileSize={50000000}
          onChange={handleFileChange}
        />
      </Grid>
    </Grid>
  );
};

export const EquipmentReservationFormFields = React.memo(EquipmentReservationFormFieldsBase, (prevProps, nextProps) => {
  return (
    prevProps.tabValue === nextProps.tabValue &&
    prevProps.equipmentData === nextProps.equipmentData &&
    prevProps.departmentList === nextProps.departmentList &&
    prevProps.buildingList === nextProps.buildingList &&
    prevProps.borrowedFromList === nextProps.borrowedFromList &&
    prevProps.timeList === nextProps.timeList &&
    prevProps.formik === nextProps.formik
  );
});
