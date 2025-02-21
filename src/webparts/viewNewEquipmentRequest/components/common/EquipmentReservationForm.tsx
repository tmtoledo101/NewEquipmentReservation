import * as React from 'react';
import { Formik } from "formik";
import { MuiPickersUtilsProvider } from '@material-ui/pickers';
import DateFnsUtils from '@date-io/date-fns';
import { 
  DialogContent, 
  DialogActions,
  Grid,
  Button,
  CircularProgress,
  Snackbar,
} from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import { DropzoneArea } from "material-ui-dropzone";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { CustomInput, CustomDateTimePicker, Dropdown } from './FormComponents';
import { EquipmentDialog } from './EquipmentDialog';
import { EquipmentList } from './EquipmentList';
import { ModalPopup } from './ModalPopup';
import { SharePointService } from '../services/SharePointService';
import { IEquipmentRequest } from '../interfaces/IEquipmentRequest';
import * as Yup from 'yup';
import styles from './EquipmentReservationForm.module.scss';

const equipmentReservationSchema = Yup.object().shape({
  requestedBy: Yup.string().required('Required'),
  department: Yup.string().required('Required'),
  contactNumber: Yup.string().required('Required'),
  building: Yup.string().required('Required'),
  borrowedFrom: Yup.string().required('Required'),
  time: Yup.string().required('Required'),
  status: Yup.string().required('Required'),
  fromDate: Yup.date().required('Required').nullable(),
  toDate: Yup.date()
    .required('Required')
    .nullable()
    .min(Yup.ref('fromDate'), 'End date must be after start date'),
  remarks: Yup.string(),
});

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
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showEquipmentDialog, setShowEquipmentDialog] = React.useState(false);
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [pendingValues, setPendingValues] = React.useState<any>(null);
  
  interface IDropdownItem {
    id: string;
    value: string;
  }

  interface IEquipmentData {
    equipment: string;
    quantity: string;
    assetNumber: string[];
  }

  const [departmentList, setDepartmentList] = React.useState<IDropdownItem[]>([]);
  const [buildingList, setBuildingList] = React.useState<IDropdownItem[]>([]);
  const [borrowedFromList, setBorrowedFromList] = React.useState<IDropdownItem[]>([]);
  const [timeList, setTimeList] = React.useState<IDropdownItem[]>([]);
  const [equipmentList, setEquipmentList] = React.useState<IDropdownItem[]>([]);
  const [quantityList, setQuantityList] = React.useState<IDropdownItem[]>([]);
  const [equipmentData, setEquipmentData] = React.useState<IEquipmentData[]>([]);
  const [assetList, setAssetList] = React.useState<string[]>([]);
  const [buildBorrowedMap, setBuildBorrowedMap] = React.useState<any>({});
  const [buildEquipmentMap, setBuildEquipmentMap] = React.useState<any>({});
  const [files, setFiles] = React.useState<File[]>([]);
  const [notification, setNotification] = React.useState<{
    show: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    show: false,
    message: "",
    severity: "success"
  });

  const formikRef = React.useRef<any>(null);

  React.useEffect(() => {
    const init = async () => {
      if (isOpen && selectedRequest) {
        try {
          const user = await SharePointService.getCurrentUser();
          const { departments } = await SharePointService.getDepartments(user.Title);
          setDepartmentList(departments);

          const equipmentResponse = await SharePointService.getEquipments();
          const {
            buildingList: buildings,
            buildBorrowedMap: borrowedMap,
            buildEquipmentMap: equipmentMap,
          } = equipmentResponse;
          
          setBuildingList(buildings);
          setBuildBorrowedMap(borrowedMap);
          setBuildEquipmentMap(equipmentMap);

          const times = await SharePointService.getTime();
          setTimeList(times);

          if (formikRef.current && selectedRequest) {
            formikRef.current.setValues({
              ...formikRef.current.values,
              requestedBy: selectedRequest.requestedBy || "",
              department: selectedRequest.department || "",
              contactNumber: selectedRequest.contactNumber || "",
              time: selectedRequest.time || "",
              fromDate: selectedRequest.fromDate ? new Date(selectedRequest.fromDate) : null,
              toDate: selectedRequest.toDate ? new Date(selectedRequest.toDate) : null,
              remarks: selectedRequest.remarks || "",
              status: selectedRequest.status || "",
            });

            if (selectedRequest.equipment) {
              try {
                const parsedEquipment = JSON.parse(selectedRequest.equipment);
                if (Array.isArray(parsedEquipment)) {
                  setEquipmentData(parsedEquipment.map((item) => ({
                    equipment: item.equipment || '',
                    quantity: item.quantity || '',
                    assetNumber: Array.isArray(item.assetNumber) ? item.assetNumber : []
                  })));
                }
              } catch (error) {
                console.error('Error parsing equipment data:', error);
                setNotification({
                  show: true,
                  message: "Failed to load equipment data",
                  severity: "error"
                });
              }
            }

            if (selectedRequest.building && borrowedMap) {
              formikRef.current.setFieldValue("building", selectedRequest.building);
              
              const buildingBorrowedMap = borrowedMap[selectedRequest.building];
              if (buildingBorrowedMap) {
                const borrowedList = Array.from(buildingBorrowedMap)
                  .map((item: string) => ({
                    id: item,
                    value: item
                  }));
                
                setBorrowedFromList(borrowedList);

                if (selectedRequest.borrowedFrom) {
                  formikRef.current.setFieldValue("borrowedFrom", selectedRequest.borrowedFrom);
                  
                  const key = selectedRequest.building + "-" + selectedRequest.borrowedFrom;
                  const availableEquipment = equipmentMap[key];
                  
                  if (availableEquipment) {
                    const uniqueEquipment = Array.from(new Set(
                      Object.values(availableEquipment)
                        .filter((item: any) => item.equipment)
                        .map((item: any) => item.equipment)
                    ));
                    
                    setEquipmentList(uniqueEquipment.map((item: string) => ({
                      id: item,
                      value: item
                    })));
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error('Error initializing form:', error);
          setNotification({
            show: true,
            message: "Failed to load form data. Please try again.",
            severity: "error"
          });
        }
      }
    };

    init();
  }, [isOpen, selectedRequest]);

  const handleSubmit = async (values: any) => {
    setPendingValues(values);
    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    try {
      if (!pendingValues || !selectedRequest) {
        return;
      }
      
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
  };

  const handleBuilding = (e: any) => {
    const value = e.target.value;
    const formik = formikRef.current;
    const currentBuilding = formik && formik.values ? formik.values.building : undefined;
    
    if (value !== currentBuilding) {
      if (buildBorrowedMap && buildBorrowedMap[value]) {
        const borrowedList = Array.from(buildBorrowedMap[value])
          .map((item: string) => ({
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
  };

  const handleBorrowedFrom = (e: any) => {
    const value = e.target.value;
    const formik = formikRef.current;
    const building = formik && formik.values ? formik.values.building : undefined;
    
    if (building && buildBorrowedMap && buildBorrowedMap[building]) {
      const key = building + "-" + value;
      const availableEquipment = buildEquipmentMap[key];
      
      if (availableEquipment) {
        const uniqueEquipment = Array.from(new Set(
          Object.values(availableEquipment)
            .filter((item: any) => item.equipment)
            .map((item: any) => item.equipment)
        ));
        
        setEquipmentList(uniqueEquipment.map((item: string) => ({
          id: item,
          value: item
        })));
      }
    }
    
    if (formik && formik.setFieldValue) {
      formik.setFieldValue("borrowedFrom", value);
      formik.setFieldValue("equipment", "");
      formik.setFieldValue("quantity", "");
      formik.setFieldValue("assetNumber", []);
    }
  };

  const handleFileChange = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

  if (!selectedRequest) {
    return null;
  }

  return (
    <MuiPickersUtilsProvider utils={DateFnsUtils}>
      <ModalPopup 
        open={isOpen} 
        title={"Equipment Reservation - " + selectedRequest.referenceNumber}
        onClose={onClose}
        maxWidth="lg"
        fullWidth
      >
        <DialogContent>
          <Formik
            initialValues={{
              requestedBy: "",
              department: "",
              building: "",
              fromDate: null,
              toDate: null,
              equipment: "",
              quantity: "",
              remarks: "",
              contactNumber: "",
              borrowedFrom: "",
              time: "",
              status: "",
              currentRecord: -1,
              assetNumber: []
            }}
            validationSchema={equipmentReservationSchema}
            onSubmit={handleSubmit}
            innerRef={formikRef}
          >
            {(formikBag) => (
              <form onSubmit={formikBag.handleSubmit}>
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
                        multiple={false}
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
                        multiple={false}
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
                        multiple={false}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Time</div>
                      <Dropdown
                        items={timeList}
                        name="time"
                        multiple={false}
                        handleChange={(e) => {
                          const formik = formikRef.current;
                          const currentTime = formik && formik.values ? formik.values.time : undefined;
                          if (e.target.value !== currentTime) {
                            setEquipmentData([]);
                          }
                        }}
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
                      onAdd={() => {
                        const currentFormik = formikRef.current;
                        if (!currentFormik) {
                          return;
                        }

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
                      }}
                      onView={(index) => {
                        const currentFormik = formikRef.current;
                        if (!currentFormik) {
                          return;
                        }

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

                        const key = building + "-" + borrowedFrom;
                        const availableEquipment = buildEquipmentMap[key];
                        
                        if (availableEquipment) {
                          const uniqueEquipment = Array.from(new Set(
                            Object.values(availableEquipment)
                              .filter((item: any) => item.equipment)
                              .map((item: any) => item.equipment)
                          ));
                          
                          setEquipmentList(uniqueEquipment.map((item: string) => ({
                            id: item,
                            value: item
                          })));
                          
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
                      }}
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
                        items={tabValue === 3 ? 
                          [{ id: 'Returned', value: 'Returned' }] :
                          [
                            { id: 'Released', value: 'Released' },
                            { id: 'Cancelled', value: 'Cancelled' }
                          ]
                        }
                        name="status"
                        multiple={false}
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
        <Alert onClose={() => setNotification({ ...notification, show: false })} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {formikRef.current && showEquipmentDialog && (
        <EquipmentDialog
          open={showEquipmentDialog}
          onClose={() => setShowEquipmentDialog(false)}
          onSave={(formik) => {
            if (!formik || !formik.values) {
              return;
            }
            
            const newData = {
              equipment: formik.values.equipment,
              quantity: formik.values.quantity,
              assetNumber: formik.values.assetNumber,
            };

            const updatedEquipmentData = [...equipmentData];
            if (formik.values.currentRecord > -1) {
              updatedEquipmentData[formik.values.currentRecord] = newData;
            } else {
              updatedEquipmentData.push(newData);
            }

            setEquipmentData(updatedEquipmentData);
            setShowEquipmentDialog(false);
            
            if (formik.setFieldValue) {
              formik.setFieldValue("equipment", "");
              formik.setFieldValue("quantity", "");
              formik.setFieldValue("assetNumber", []);
              formik.setFieldValue("currentRecord", -1);
            }
          }}
          onDelete={(formik) => {
            if (!formik || !formik.values) {
              return;
            }
            
            const updatedEquipmentData = equipmentData.filter(
              (_, index) => index !== formik.values.currentRecord
            );
            setEquipmentData(updatedEquipmentData);
            setShowEquipmentDialog(false);
            
            if (formik.setFieldValue) {
              formik.setFieldValue("equipment", "");
              formik.setFieldValue("quantity", "");
              formik.setFieldValue("assetNumber", []);
              formik.setFieldValue("currentRecord", -1);
            }
          }}
          formik={formikRef.current}
          equipmentList={equipmentList}
          quantityList={quantityList}
          assetList={assetList}
          equipmentError=""
          handleEquipment={(e) => {
            const formik = formikRef.current;
            const value = e.target.value;
            const currentSelectedEquipments = equipmentData.map((item) => item.equipment);

            if (currentSelectedEquipments.indexOf(value) > -1 && (formik && formik.values && formik.values.equipment !== value)) {
              setNotification({
                show: true,
                message: "This equipment is already selected, you cannot re-select again.",
                severity: "error"
              });
              return;
            }
            
            if (formik && formik.setFieldValue) {
              formik.setFieldValue("equipment", value);
              formik.setFieldValue("quantity", "");
              formik.setFieldValue("assetNumber", []);

              const fromDate = formik.values.fromDate;
              const toDate = formik.values.toDate;
              const timeslot = formik.values.time;

              if (!fromDate || !toDate || !timeslot) {
                setNotification({
                  show: true,
                  message: "Please select date and time first",
                  severity: "error"
                });
                return;
              }

              const building = formik.values.building;
              const borrowedFrom = formik.values.borrowedFrom;
              const key = building + "-" + borrowedFrom;
              const equipmentMap = buildEquipmentMap[key];
              
              if (equipmentMap) {
                const equipment = Object.values(equipmentMap).filter((item: any) => item.equipment === value);
                const availableEquipment = SharePointService.getAvailableEquipment(
                  equipment,
                  fromDate,
                  toDate,
                  timeslot
                );

                if (availableEquipment.length === 0) {
                  setNotification({
                    show: true,
                    message: "This equipment is not available as " + equipment.length + " out of " + equipment.length + " in inventory is in use on the date and time selected.",
                    severity: "error"
                  });
                  return;
                }

                const quantities = Array.from(
                  { length: availableEquipment.length },
                  (_, i) => ({ id: (i + 1).toString(), value: (i + 1).toString() })
                );

                setQuantityList(quantities);
                const assetNumbers = availableEquipment.map((item: any) => item.assetNumber);
                setAssetList(assetNumbers);
                formik.setFieldValue("assetNumber", assetNumbers);
              }
            }
          }}
          handleQuantity={(e) => {
            const formik = formikRef.current;
            const value = e.target.value;
            if (formik && formik.setFieldValue) {
              formik.setFieldValue("quantity", value);
              const currentAssetNumbers = formik.values.assetNumber || [];
              const updatedAssetNumbers = currentAssetNumbers.slice(0, parseInt(value));
              setAssetList(updatedAssetNumbers);
              formik.setFieldValue("assetNumber", updatedAssetNumbers);
            }
          }}
        />
      )}

      <ModalPopup
        open={showConfirmation}
        onClose={() => {
          setShowConfirmation(false);
          setPendingValues(null);
        }}
        title="Confirm Action"
        maxWidth="sm"
      >
        <DialogContent>
          {pendingValues && pendingValues.status === 'Released' ? (
            <p>Are you sure you want to release this request?</p>
          ) : (pendingValues && pendingValues.status === 'Cancelled') ? (
            <p>Are you sure you want to cancel this request?</p>
          ) : (pendingValues && pendingValues.status === 'Returned') ? (
            <p>Do you want to save changes?</p>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setShowConfirmation(false);
              setPendingValues(null);
            }}
            startIcon={<CloseIcon />}
            style={{
              color: "lightgrey",
              background: "grey",
            }}
          >
            No
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="secondary"
            startIcon={<SaveIcon />}
          >
            Yes
          </Button>
        </DialogActions>
      </ModalPopup>
    </MuiPickersUtilsProvider>
  );
};
