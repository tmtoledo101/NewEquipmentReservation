import * as React from 'react';
import { Formik, FormikHelpers, useFormikContext } from "formik";
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
import { IApproverFormValues, convertDates, IEquipmentData } from './approverForm/interfaces/IApproverFormValues';

interface IApproverEquipmentFormProps {
  selectedRecord: any;
  onSubmit: (values: IApproverFormValues) => Promise<void>;
  onCancel: () => void;
}

interface FormContentProps {
  onCancel: () => void;
}

const FormContent: React.FC<FormContentProps> = ({ onCancel }) => {
  const { values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting, setFieldValue } = useFormikContext<IApproverFormValues>();

  const handleEquipmentUpdate = (index: number, updatedEquipment: IEquipmentData) => {
    const newEquipmentData = [...(values.equipmentData || [])];
    newEquipmentData[index] = updatedEquipment;
    setFieldValue('equipmentData', newEquipmentData);
  };

  const handleAddEquipment = () => {
    const newEquipmentData = [...(values.equipmentData || [])];
    newEquipmentData.push({
      equipment: '',
      quantity: '',
      assetNumber: []
    });
    setFieldValue('equipmentData', newEquipmentData);
  };

  return (
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
            onView={(index) => console.log('Viewing equipment at index:', index)}
            onAdd={handleAddEquipment}
            onUpdateEquipment={handleEquipmentUpdate}
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
  );
};

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
      <FormContent onCancel={onCancel} />
    </Formik>
  );
};