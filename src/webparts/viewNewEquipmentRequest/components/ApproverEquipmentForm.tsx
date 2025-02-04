import * as React from 'react';
import { Formik, FormikHelpers } from "formik";
import { Grid, Button, DialogActions } from "@material-ui/core";
import { equipmentRequestValidationSchema } from './utils/validation';
import styles from './ViewNewEquipmentRequest.module.scss';
import * as moment from 'moment';
import { BasicInformation } from './approverForm/BasicInformation';
import { RequesterInformation } from './approverForm/RequesterInformation';
import { ContactInformation } from './approverForm/ContactInformation';
import { BorrowingDetails } from './approverForm/BorrowingDetails';
import { DateSelection } from './approverForm/DateSelection';
import { EquipmentListSection } from './approverForm/EquipmentListSection';
import { RemarksSection } from './approverForm/RemarksSection';
import { IApproverFormValues, convertDates } from './approverForm/interfaces/IApproverFormValues';

interface IApproverEquipmentFormProps {
  selectedRecord: any;
  onSubmit: (values: IApproverFormValues) => Promise<void>;
  onCancel: () => void;
}

export const ApproverEquipmentForm: React.FC<IApproverEquipmentFormProps> = ({
  selectedRecord,
  onSubmit,
  onCancel
}) => {
  const handleFormSubmit = async (
    values: IApproverFormValues,
    formikHelpers: FormikHelpers<IApproverFormValues>
  ) => {
    try {
      await onSubmit(values);
    } catch (error) {
      console.error('Form submission error:', error);
      formikHelpers.setSubmitting(false);
    }
  };

  const handleViewEquipment = (index: number) => {
    // You can implement equipment viewing functionality here
    // For example, opening a dialog to show equipment details
    console.log('Viewing equipment at index:', index);
  };

  const initialValues = React.useMemo(() => {
    const convertedRecord = convertDates(selectedRecord);
    return {
      ...convertedRecord,
      fromDate: convertedRecord.fromDate ? moment(convertedRecord.fromDate).toDate() : null,
      toDate: convertedRecord.toDate ? moment(convertedRecord.toDate).toDate() : null
    };
  }, [selectedRecord]);

  return (
    <Formik<IApproverFormValues>
      initialValues={initialValues}
      validationSchema={equipmentRequestValidationSchema}
      onSubmit={handleFormSubmit}
    >
      {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
        <form onSubmit={handleSubmit}>
          <div className={styles.container}>
            <Grid container spacing={4}>
              <BasicInformation
                referenceNumber={values.referenceNumber}
                status={values.status}
                touched={touched}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              <RequesterInformation
                requestedBy={values.requestedBy}
                department={values.department}
              />

              <ContactInformation
                contactNumber={values.contactNumber || ''}
                building={values.building || ''}
                touched={touched}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              <BorrowingDetails
                borrowedFrom={values.borrowedFrom || ''}
                time={values.time || ''}
                touched={touched}
                errors={errors}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />

              <DateSelection
                fromDate={values.fromDate}
                toDate={values.toDate}
              />

              <EquipmentListSection
                equipmentData={values.equipmentData || []}
                onView={handleViewEquipment}
              />

              <RemarksSection
                remarks={values.remarks || ''}
                handleChange={handleChange}
                handleBlur={handleBlur}
              />
            </Grid>

            <DialogActions style={{ padding: "16px", marginTop: "20px" }}>
              <Button
                type="button"
                variant="contained"
                onClick={onCancel}
                style={{
                  color: "lightgrey",
                  background: "grey",
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                Update
              </Button>
            </DialogActions>
          </div>
        </form>
      )}
    </Formik>
  );
};