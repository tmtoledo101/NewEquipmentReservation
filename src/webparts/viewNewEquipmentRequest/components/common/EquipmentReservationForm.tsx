import * as React from 'react';
import { Formik } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import * as moment from 'moment';
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
import { handleEquipmentSelection, cleanSiteUrl } from '../utils/helpers';
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

  const handleSubmit = React.useCallback(async (values: any, formikBag: any): Promise<void> => {
    // First touch all required fields based on tab
    const requiredFields = ['requestedBy', 'department', 'contactNumber', 'building', 'borrowedFrom', 'time', 'status'];
    
    if (tabValue === 2) { // For Release tab
      requiredFields.push('releasedTo', 'releasedBy');
    } else if (tabValue === 3) { // For Return tab
      requiredFields.push('returnedTo', 'returnedBy');
    }
    
    // Touch all required fields to ensure their validation messages show
    requiredFields.forEach(field => {
      formikBag.setFieldTouched(field, true, false); // false to prevent validation until we call validateForm
    });

    // Now validate all fields
    const errors = await formikBag.validateForm();
    
    if (Object.keys(errors).length === 0) {
      setPendingValues(values);
      setShowConfirmation(true);
    } else {
      setNotification({
        show: true,
        message: "Please fill in all required fields",
        severity: "error"
      });
    }
  }, [setPendingValues, setShowConfirmation, setNotification, tabValue]);

const getCurrentAssetList = (): string[] => {
  return equipmentData.reduce((prev: string[], current) => {
    prev = [...current.assetNumber, ...prev];
    return prev;
  }, []);
};

const handleConfirm = React.useCallback(async (): Promise<void> => {
  try {
    if (!pendingValues || !selectedRequest) return;
    
    setIsSubmitting(true);
    setShowConfirmation(false);
    
    // If status is cancelled, update equipment items to make them available again
    if (pendingValues.status === "Cancelled" || pendingValues.status === "Completed") {
      try {
        await SharePointService.updateEquipmentReturnStatus(
          getCurrentAssetList(),
          pendingValues.building,
          pendingValues.borrowedFrom,
          moment(pendingValues.fromDate).format("YYYY/MM/DD"),
          pendingValues.time
        );
      } catch (error) {
        console.error("Error updating equipment status:", error);
      }
    }

    await SharePointService.updateRequest(
      selectedRequest.ID || 0,
      pendingValues,
      equipmentData,
      files,
      cleanSiteUrl(siteUrl),
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
              status: selectedRequest.status || "For Return",
              currentRecord: -1,
              assetNumber: selectedRequest.assetNumber || [],
              GUID: selectedRequest.GUID || "", // Add GUID to form values
            }), [selectedRequest, tabValue])}
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
                  existingFiles={selectedRequest && selectedRequest.attachments}
                  siteUrl={siteUrl}
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

                    // Update equipment list based on building and borrowedFrom
                    updateEquipmentList(building, borrowedFrom);

                    currentFormik.setFieldValue("currentRecord", -1);
                    currentFormik.setFieldValue("equipment", "");
                    currentFormik.setFieldValue("quantity", "");
                    currentFormik.setFieldValue("assetNumber", []);
                    
                    setShowEquipmentDialog(true);
                  }, [formikRef, setNotification, setShowEquipmentDialog, updateEquipmentList])}
                  onViewEquipment={React.useCallback((index) => {
                    console.log("onViewEquipment called with index:", index);
                    
                    const currentFormik = formikRef.current;
                    if (!currentFormik) {
                      console.log("formikRef.current is undefined");
                      return;
                    }

                    const existingEquipmentData = equipmentData[index];
                    console.log("existingEquipmentData:", existingEquipmentData);
                    
                    if (!existingEquipmentData) {
                      console.log("existingEquipmentData is undefined");
                      setNotification({
                        show: true,
                        message: "Failed to load equipment data",
                        severity: "error"
                      });
                      return;
                    }

                    console.log("Setting currentRecord to:", index);
                    // Set currentRecord directly in formik.values to ensure it's immediately available
                    currentFormik.values.currentRecord = index;
                    // Also use setFieldValue for consistency
                    currentFormik.setFieldValue("currentRecord", index);
                    console.log("After setting currentRecord:", currentFormik.values.currentRecord);
                    
                    const building = currentFormik.values.building;
                    const borrowedFrom = currentFormik.values.borrowedFrom;
                    console.log("building:", building, "borrowedFrom:", borrowedFrom);
                    
                    if (!building || !borrowedFrom) {
                      console.log("building or borrowedFrom is missing");
                      setNotification({
                        show: true,
                        message: "Please select a Building and Borrowed From first",
                        severity: "error"
                      });
                      return;
                    }

                    const key = `${building}-${borrowedFrom}`;
                    console.log("buildEquipmentMap key:", key);
                    const availableEquipment = buildEquipmentMap[key];
                    console.log("availableEquipment:", availableEquipment);
                    
                    if (availableEquipment) {
                      const uniqueEquipment = [...new Set(
                        Object.values(availableEquipment)
                          .filter(item => item.equipment)
                          .map(item => item.equipment)
                      )];
                      
                      console.log("uniqueEquipment:", uniqueEquipment);
                      
                      const equipmentItems = uniqueEquipment.map(item => ({
                        id: item,
                        value: item
                      }));
                      console.log("Setting equipmentList:", equipmentItems);
                      setEquipmentList(equipmentItems);
                      
                      console.log("Setting formik values from existingEquipmentData");
                      console.log("equipment:", existingEquipmentData.equipment);
                      console.log("quantity:", existingEquipmentData.quantity);
                      console.log("assetNumber:", existingEquipmentData.assetNumber);
                      
                      // Directly create quantity list based on the existing quantity value
                      const existingQuantity = existingEquipmentData.quantity;
                      console.log("Existing quantity:", existingQuantity);
                      
                      // Create a quantity list with at least the existing quantity
                      const maxQuantity = Math.max(parseInt(existingQuantity)); // Use at least 5 as max
                      const quantities = Array.from(
                        { length: maxQuantity },
                        (_, i) => ({ id: (i + 1).toString(), value: (i + 1).toString() })
                      );
                      
                      console.log("Setting quantityList directly:", quantities);
                      setQuantityList(quantities);
                      
                      // IMPORTANT: First show the dialog, then set the values
                      setShowEquipmentDialog(true);
                      
                      // Set values after dialog is shown
                      console.log("DIRECTLY setting equipment value:", existingEquipmentData.equipment);
                      currentFormik.values.equipment = existingEquipmentData.equipment;
                      currentFormik.values.quantity = existingEquipmentData.quantity;
                      currentFormik.values.assetNumber = existingEquipmentData.assetNumber;
                      
                      // Also use setFieldValue
                      currentFormik.setFieldValue("equipment", existingEquipmentData.equipment);
                      currentFormik.setFieldValue("quantity", existingEquipmentData.quantity);
                      currentFormik.setFieldValue("assetNumber", existingEquipmentData.assetNumber);
                      
                      console.log("After setting values - formik values:", currentFormik.values);
                    } else {
                      console.log("availableEquipment is undefined or empty");
                      setNotification({
                        show: true,
                        message: "Failed to load equipment options",
                        severity: "error"
                      });
                    }
                  }, [buildEquipmentMap, equipmentData, setEquipmentList, setNotification, setShowEquipmentDialog, formikRef])}
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
        <>
          {console.log("[LOG 26] Rendering EquipmentDialogForm with props:", {
            equipmentList: equipmentList.map(item => item.value),
            quantityList: quantityList.map(item => item.value),
            assetList,
            formikValues: {
              equipment: formikRef.current.values.equipment,
              quantity: formikRef.current.values.quantity,
              assetNumber: formikRef.current.values.assetNumber,
              currentRecord: formikRef.current.values.currentRecord
            }
          })}
          {(() => {
            // Ensure asset numbers are initialized based on quantity
            const currentQuantity = formikRef.current.values.quantity;
            if (currentQuantity && assetList.length > 0) {
              const parsedQuantity = parseInt(currentQuantity);
              if (!isNaN(parsedQuantity)) {
                const selectedAssets = assetList.slice(0, parsedQuantity);
                if (JSON.stringify(selectedAssets) !== JSON.stringify(formikRef.current.values.assetNumber)) {
                  console.log("[LOG 27] Initializing asset numbers:", selectedAssets);
                  formikRef.current.setFieldValue("assetNumber", selectedAssets, false);
                }
              }
            }
            
            return (
              <EquipmentDialogForm
                open={showEquipmentDialog}
                onClose={() => {
                  console.log("[LOG 28] Closing EquipmentDialogForm");
                  setShowEquipmentDialog(false);
                }}
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
            );
          })()}
        </>
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
