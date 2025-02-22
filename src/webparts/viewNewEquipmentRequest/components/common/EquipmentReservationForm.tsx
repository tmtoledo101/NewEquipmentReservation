import * as React from 'react';
import { Formik } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { 
  DialogContent, 
  DialogActions,
  Button,
  CircularProgress,
  Snackbar
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { ModalPopup } from './ModalPopup';
import { EquipmentDialogForm } from './EquipmentDialogForm';
import { SharePointService } from '../services/SharePointService';
import { IEquipmentRequest } from '../interfaces/IEquipmentRequest';
import { equipmentReservationSchema } from '../utils/validation';
import { useEquipmentReservation } from '../hooks/useEquipmentReservation';
import { EquipmentReservationFormFields } from './EquipmentReservationFormFields';
import { ConfirmationDialogForm } from './ConfirmationDialogForm';
import styles from './EquipmentReservationForm.module.scss';

interface IEquipmentReservationFormProps {
  isOpen: boolean;
  selectedRequest: IEquipmentRequest | null;
  onClose: () => void;
  onUpdateSuccess: () => void;
  siteUrl: string;
  tabValue: number;
}

export const EquipmentReservationForm: React.FC<IEquipmentReservationFormProps> = ({
  isOpen,
  selectedRequest,
  onClose,
  onUpdateSuccess,
  siteUrl,
  tabValue
}) => {
  const formikRef = React.useRef<any>(null);
  const {
    isSubmitting,
    setIsSubmitting,
    showEquipmentDialog,
    setShowEquipmentDialog,
    showConfirmation,
    setShowConfirmation,
    pendingValues,
    setPendingValues,
    departmentList,
    buildingList,
    borrowedFromList,
    setBorrowedFromList,
    timeList,
    equipmentList,
    setEquipmentList,
    quantityList,
    setQuantityList,
    equipmentData,
    setEquipmentData,
    assetList,
    setAssetList,
    buildBorrowedMap,
    buildEquipmentMap,
    files,
    setFiles,
    notification,
    setNotification,
    updateEquipmentList
  } = useEquipmentReservation(isOpen, selectedRequest, formikRef);

  const handleSubmit = React.useCallback(async (values: any): Promise<void> => {
    setPendingValues(values);
    setShowConfirmation(true);
  }, [setPendingValues, setShowConfirmation]);

  const handleConfirm = React.useCallback(async (): Promise<void> => {
    try {
      if (!pendingValues || !selectedRequest) return;
      
      setIsSubmitting(true);
      setShowConfirmation(false);
      
      await SharePointService.updateRequest(
        selectedRequest.ID || 0,
        pendingValues,
        equipmentData,
        files
      );
      
      setNotification({
        show: true,
        message: "Request updated successfully",
        severity: "success"
      });

      setTimeout(() => {
        onUpdateSuccess();
        onClose();
      }, 1500);

    } catch (error) {
      setNotification({
        show: true,
        message: "Failed to update request. Please try again.",
        severity: "error"
      });
    } finally {
      setIsSubmitting(false);
      setPendingValues(null);
    }
  }, [selectedRequest, pendingValues, setIsSubmitting, setShowConfirmation, equipmentData, files, setNotification, onUpdateSuccess, onClose, setPendingValues]);

  const handleBuilding = React.useCallback((e: any) => {
    const { value } = e.target;
    const formik = formikRef.current;
    const currentBuilding = formik && formik.values ? formik.values.building : undefined;
    
    if (value !== currentBuilding) {
      if (buildBorrowedMap && buildBorrowedMap[value]) {
        const filteredItems = Array.from(buildBorrowedMap[value])
          .filter((item: any) => item.exclusiveTo !== 'FSS')
          .map((item: any) => item.borrowed);
        
        const uniqueBorrowed = [...new Set(filteredItems)];
        const borrowedList = uniqueBorrowed.map(item => ({
          id: item,
          value: item
        }));
        
        setBorrowedFromList(borrowedList);
      } else {
        setBorrowedFromList([]);
      }
      
      setEquipmentData([]);
      setEquipmentList([]);
      setQuantityList([]);
      if (formik && formik.setFieldValue) {
        formik.setFieldValue("building", value);
        formik.setFieldValue("borrowedFrom", "");
      }
    }
  }, [buildBorrowedMap, setBorrowedFromList, setEquipmentData, setEquipmentList, setQuantityList, formikRef]);

  const handleBorrowedFrom = React.useCallback((e: any) => {
    const { value } = e.target;
    const formik = formikRef.current;
    const currentBuilding = formik && formik.values ? formik.values.building : undefined;
    
    if (currentBuilding) {
      updateEquipmentList(currentBuilding, value);
    }
    
    if (formik && formik.setFieldValue) {
      formik.setFieldValue("borrowedFrom", value);
      formik.setFieldValue("equipment", "");
      formik.setFieldValue("quantity", "");
      formik.setFieldValue("assetNumber", []);
    }
  }, [updateEquipmentList]);

  if (!selectedRequest) return null;

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <ModalPopup 
        open={isOpen} 
        title={`Equipment Reservation - ${selectedRequest.referenceNumber}`}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          <Formik
            initialValues={React.useMemo(() => ({
              requestedBy: selectedRequest.requestedBy || "",
              department: selectedRequest.department || "",
              building: selectedRequest.building || "",
              fromDate: selectedRequest.fromDate || null,
              toDate: selectedRequest.toDate || null,
              equipment: selectedRequest.equipment || "",
              quantity: selectedRequest.quantity || "",
              remarks: selectedRequest.remarks || "",
              contactNumber: selectedRequest.contactNumber || "",
              borrowedFrom: selectedRequest.borrowedFrom || "",
              time: selectedRequest.time || "",
              status: selectedRequest.status || "Release",
              currentRecord: -1,
              assetNumber: selectedRequest.assetNumber || [],
            }), [selectedRequest])}
            validationSchema={equipmentReservationSchema}
            onSubmit={handleSubmit}
            innerRef={formikRef}
          >
            {(formikBag) => (
              <form onSubmit={formikBag.handleSubmit}>
                <EquipmentReservationFormFields
                  departmentList={departmentList}
                  buildingList={buildingList}
                  borrowedFromList={borrowedFromList}
                  timeList={timeList}
                  equipmentData={equipmentData}
                  tabValue={tabValue}
                  handleBuilding={handleBuilding}
                  handleBorrowedFrom={handleBorrowedFrom}
                  handleTimeChange={React.useCallback((e) => {
                    const formik = formikRef.current;
                    const currentTime = formik && formik.values ? formik.values.time : undefined;
                    if (e.target.value !== currentTime) {
                      setEquipmentData([]);
                    }
                  }, [setEquipmentData])}
                  handleFileChange={setFiles}
                  onAddEquipment={React.useCallback(() => {
                    const currentFormik = formikRef.current;
                    if (!currentFormik) return;

                    const building = currentFormik.values.building;
                    const borrowedFrom = currentFormik.values.borrowedFrom;
                    
                    if (!building || !borrowedFrom) {
                      setNotification({
                        show: true,
                        message: "Please select a Building and Borrowed From first",
                        severity: "error"
                      });
                      return;
                    }

                    currentFormik.setFieldValue("currentRecord", -1);
                    currentFormik.setFieldValue("equipment", "");
                    currentFormik.setFieldValue("quantity", "");
                    currentFormik.setFieldValue("assetNumber", []);
                    
                    setShowEquipmentDialog(true);
                  }, [formikRef, setNotification, setShowEquipmentDialog])}
                  onViewEquipment={React.useCallback((index) => {
                    const currentFormik = formikRef.current;
                    if (!currentFormik) return;

                    const existingEquipmentData = equipmentData[index];
                    if (!existingEquipmentData) {
                      setNotification({
                        show: true,
                        message: "Failed to load equipment data",
                        severity: "error"
                      });
                      return;
                    }

                    currentFormik.setFieldValue("currentRecord", index);
                    
                    const building = currentFormik.values.building;
                    const borrowedFrom = currentFormik.values.borrowedFrom;
                    
                    if (!building || !borrowedFrom) {
                      setNotification({
                        show: true,
                        message: "Please select a Building and Borrowed From first",
                        severity: "error"
                      });
                      return;
                    }

                    const key = `${building}-${borrowedFrom}`;
                    const availableEquipment = buildEquipmentMap[key];
                    
                    if (availableEquipment) {
                      const uniqueEquipment = [...new Set(
                        Object.values(availableEquipment)
                          .filter(item => item.equipment)
                          .map(item => item.equipment)
                      )];
                      
                      const equipmentItems = uniqueEquipment.map(item => ({
                        id: item,
                        value: item
                      }));
                      setEquipmentList(equipmentItems);
                      
                      currentFormik.setFieldValue("equipment", existingEquipmentData.equipment);
                      currentFormik.setFieldValue("quantity", existingEquipmentData.quantity);
                      currentFormik.setFieldValue("assetNumber", existingEquipmentData.assetNumber);
                      
                      setShowEquipmentDialog(true);
                    } else {
                      setNotification({
                        show: true,
                        message: "Failed to load equipment options",
                        severity: "error"
                      });
                    }
                  }, [buildEquipmentMap, equipmentData, setEquipmentList, setNotification, setShowEquipmentDialog])}
                  formik={formikRef.current}
                />

                <DialogActions className={styles.formHandle}>
                  <Button
                    onClick={onClose}
                    startIcon={<CloseIcon />}
                    style={{
                      color: "lightgrey",
                      background: "grey",
                    }}
                    disabled={isSubmitting}
                  >
                    Close
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    color="secondary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
                  </Button>
                </DialogActions>
              </form>
            )}
          </Formik>
        </DialogContent>
      </ModalPopup>

      <Snackbar
       open={notification.show}
       autoHideDuration={6000}
       onClose={() => setNotification({ ...notification, show: false })}
     >
       <Alert
         onClose={() => setNotification({ ...notification, show: false })}
         severity={notification.severity}
       >
          {notification.message}
        </Alert>
      </Snackbar>

      {formikRef.current && showEquipmentDialog && (
        <EquipmentDialogForm
          open={showEquipmentDialog}
          onClose={() => setShowEquipmentDialog(false)}
          formik={formikRef.current}
          equipmentList={equipmentList}
          quantityList={quantityList}
          assetList={assetList}
          equipmentData={equipmentData}
          buildEquipmentMap={buildEquipmentMap}
          setEquipmentData={setEquipmentData}
          setQuantityList={setQuantityList}
          setAssetList={setAssetList}
          setNotification={setNotification}
        />
      )}
      <ConfirmationDialogForm
        open={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingValues(null);
        }}
        onConfirm={handleConfirm}
        status={pendingValues && pendingValues.status}
      />
    </MuiPickersUtilsProvider>
  );
};
