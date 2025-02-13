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
import styles from '../ViewNewEquipmentRequest.module.scss';

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

interface IFormStyles {
  formField: {
    width: string;
    marginBottom: string;
  };
  label: {
    marginBottom: string;
    fontSize: string;
  };
  dropZoneClass: string;
  previewChipClass: string;
  formHandle: {
    display: string;
    justifyContent: string;
    gap: string;
  };
}

const formStyles: IFormStyles = {
  formField: {
    width: '100%',
    marginBottom: '16px',
  },
  label: {
    marginBottom: '8px',
    fontSize: '14px',
  },
  dropZoneClass: 'dropZone',
  previewChipClass: 'previewChip',
  formHandle: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '8px',
  },
};

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
  const [departmentSectorMap, setDepartmentSectorMap] = React.useState<{ [key: string]: string }>({});
  const [buildingList, setBuildingList] = React.useState<IDropdownItem[]>([]);
  const [borrowedFromList, setBorrowedFromList] = React.useState<IDropdownItem[]>([]);
  const [timeList, setTimeList] = React.useState<IDropdownItem[]>([]);
  const [equipmentList, setEquipmentList] = React.useState<IDropdownItem[]>([]);
  const [quantityList, setQuantityList] = React.useState<IDropdownItem[]>([]);
  const [equipmentData, setEquipmentData] = React.useState<IEquipmentData[]>([]);
  const [assetList, setAssetList] = React.useState<string[]>([]);
  const [buildBorrowedMap, setBuildBorrowedMap] = React.useState<any>({});
  const [buildEquipmentMap, setBuildEquipmentMap] = React.useState<{
    [key: string]: {
      [id: number]: {
        equipment: string;
        borrowed: string;
        assetNumber: string;
        blockedDateAM: string | null;
        blockedDatePM: string | null;
        blockedDateWholeDay: string | null;
      }
    }
  }>({}); 
  const [isFssManaged, setIsFssManaged] = React.useState<boolean>(false);
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
          const { departments, departmentSectorMap: deptSectorMap } = await SharePointService.getDepartments(user.Title);
          setDepartmentList(departments);
          console.log(`Departments: ${departmentList}, Department Sector Map: ${deptSectorMap}`);
          setDepartmentSectorMap(deptSectorMap);

          const equipmentResponse = await SharePointService.getEquipments();
          console.log('Debug - SharePoint Equipment Response:', equipmentResponse);
          
      
          const {
            buildingList: buildings,
            buildBorrowedMap: borrowedMap,
            buildEquipmentMap: equipmentMap,
            originalEquipmentList
          } = equipmentResponse;
          
          setBuildingList(buildings);
          setBuildBorrowedMap(borrowedMap);
          setBuildEquipmentMap(equipmentMap);

          const times = await SharePointService.getTime();
          setTimeList(times);

          // Set initial values
          const formik = formikRef.current;
          if (formik && selectedRequest) {
            formik.setValues({
              ...formik.values,
              requestedBy: selectedRequest.requestedBy || "",
              department: selectedRequest.department || "",
              contactNumber: selectedRequest.contactNumber || "",
              time: selectedRequest.time || "",
              fromDate: selectedRequest.fromDate ? new Date(selectedRequest.fromDate) : null,
              toDate: selectedRequest.toDate ? new Date(selectedRequest.toDate) : null,
              remarks: selectedRequest.remarks || "",
              status: selectedRequest.status || "",
            });

            // Parse and set equipment data
            if (selectedRequest.equipment) {
              try {
                const parsedEquipment = JSON.parse(selectedRequest.equipment);
                if (Array.isArray(parsedEquipment)) {
                  setEquipmentData(parsedEquipment.map(item => ({
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

            if (selectedRequest.building) {
              formik.setFieldValue("building", selectedRequest.building);
              
              let borrowedList: any[] = [];

              if (borrowedMap[selectedRequest.building]) {
                const filteredItems = Array.from(borrowedMap[selectedRequest.building])
                  .filter((item: any) => !isFssManaged ? item.exclusiveTo !== 'FSS' : true);
                
                borrowedList = filteredItems.map((item: any) => ({
                  id: item.borrowed,
                  value: item.borrowed
                }));
                
                setBorrowedFromList(borrowedList);

                const hasMatch = borrowedList.some(item => item.value === selectedRequest.borrowedFrom);
                if (selectedRequest.borrowedFrom && hasMatch) {
                  formik.setFieldValue("borrowedFrom", selectedRequest.borrowedFrom);
                  
                  // Get available equipment options from buildEquipmentMap
                  const key = `${selectedRequest.building}-${selectedRequest.borrowedFrom}`;
                  const availableEquipment = buildEquipmentMap[key];
                  
                  if (availableEquipment) {
                    // Extract unique equipment names
                    const uniqueEquipment = [...new Set(
                      Object.values(availableEquipment)
                        .filter(item => item.equipment)
                        .map(item => item.equipment)
                    )];
                    
                    // Create equipment items for dropdown
                    const equipmentItems = uniqueEquipment.map(item => ({
                      id: item,
                      value: item
                    }));
                    setEquipmentList(equipmentItems);
                    console.log('Debug - Equipment Items:', equipmentItems);
                    
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

  const handleSubmit = async (values: any): Promise<void> => {
    // Store values and show confirmation dialog
    setPendingValues(values);
    setShowConfirmation(true);
  };

  const handleConfirm = async (): Promise<void> => {
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
  };

  const handleBuilding = React.useCallback((e: any) => {
    const { value } = e.target;
    const formik = formikRef.current;
    const currentBuilding = formik && formik.values ? formik.values.building : undefined;
    
    if (value !== currentBuilding) {
      if (buildBorrowedMap && buildBorrowedMap[value]) {
        const filteredItems = Array.from(buildBorrowedMap[value])
          .filter((item: any) => !isFssManaged ? item.exclusiveTo !== 'FSS' : true)
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
  }, [buildBorrowedMap, isFssManaged]);

  const handleBorrowedFrom = React.useCallback((e: any) => {
    const { value } = e.target;
    const formik = formikRef.current;
    const currentBuilding = formik && formik.values ? formik.values.building : undefined;
    
    if (currentBuilding && buildBorrowedMap && buildBorrowedMap[currentBuilding]) {
      // Get available equipment options from buildEquipmentMap
      const key = `${currentBuilding}-${value}`;
      const availableEquipment = buildEquipmentMap[key];
      
      if (availableEquipment) {
        // Extract unique equipment names
        const uniqueEquipment = [...new Set(
          Object.values(availableEquipment)
            .filter(item => item.equipment)
            .map(item => item.equipment)
        )];
        
        // Create equipment items for dropdown
        const equipmentItems = uniqueEquipment.map(item => ({
          id: item,
          value: item
        }));
        setEquipmentList(equipmentItems);
        console.log('Debug - Equipment Items:', equipmentItems);
        
      }
    }
    
    if (formik && formik.setFieldValue) {
      formik.setFieldValue("borrowedFrom", value);
      // Reset equipment-related values
      formik.setFieldValue("equipment", "");
      formik.setFieldValue("quantity", "");
      formik.setFieldValue("assetNumber", []);
    }
  }, [buildBorrowedMap, buildEquipmentMap]);

  const handleFileChange = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles);
  };

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
              assetNumber: [],
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
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Requested By</div>
                      <CustomInput name="requestedBy" disabled />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Department</div>
                      <Dropdown
                        items={departmentList}
                        name="department"
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Contact No.</div>
                      <CustomInput name="contactNumber" />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Building</div>
                      <Dropdown
                        items={buildingList}
                        name="building"
                        handleChange={handleBuilding}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Borrowed From</div>
                      <Dropdown
                        items={borrowedFromList}
                        name="borrowedFrom"
                        handleChange={handleBorrowedFrom}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Time</div>
                      <Dropdown
                        items={timeList}
                        name="time"
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

                        // Explicitly set currentRecord to -1 for new equipment
                        currentFormik.setFieldValue("currentRecord", -1);
                        currentFormik.setFieldValue("equipment", "");
                        currentFormik.setFieldValue("quantity", "");
                        currentFormik.setFieldValue("assetNumber", []);
                        
                        setShowEquipmentDialog(true);
                      }}
                      onView={(index) => {
                        const currentFormik = formikRef.current;
                        if (!currentFormik) return;

                        // Get the existing equipment data first
                        const existingEquipmentData = equipmentData[index];
                        if (!existingEquipmentData) {
                          setNotification({
                            show: true,
                            message: "Failed to load equipment data",
                            severity: "error"
                          });
                          return;
                        }

                        // Set the currentRecord first to ensure it's available
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

                        // Get available equipment options from buildEquipmentMap
                        const key = `${building}-${borrowedFrom}`;
                        const availableEquipment = buildEquipmentMap[key];
                        
                        if (availableEquipment) {
                          // Extract unique equipment names
                          const uniqueEquipment = [...new Set(
                            Object.values(availableEquipment)
                              .filter(item => item.equipment)
                              .map(item => item.equipment)
                          )];
                          
                          // Create equipment items for dropdown
                          const equipmentItems = uniqueEquipment.map(item => ({
                            id: item,
                            value: item
                          }));
                          setEquipmentList(equipmentItems);
                          
                          // Set the equipment values
                          currentFormik.setFieldValue("equipment", existingEquipmentData.equipment);
                          currentFormik.setFieldValue("quantity", existingEquipmentData.quantity);
                          currentFormik.setFieldValue("assetNumber", existingEquipmentData.assetNumber);
                          
                          // Show the dialog
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
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Remarks</div>
                      <CustomInput name="remarks" />
                    </div>
                  </Grid>

                  <Grid item xs={12}>
                    <div style={formStyles.formField}>
                      <div style={formStyles.label}>Status</div>
                      <Dropdown
                        items={tabValue === 3 ? 
                          [{ id: 'Returned', value: 'Returned' }] :
                          [
                            { id: 'Released', value: 'Released' },
                            { id: 'Cancelled', value: 'Cancelled' }
                          ]
                        }
                        name="status"
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div style={formStyles.label}>
                      Attachment Here
                    </div>
                  </Grid>

                  <Grid item xs={12}>
                    <DropzoneArea
                      showPreviews={true}
                      showPreviewsInDropzone={false}
                      useChipsForPreview
                      dropzoneClass={formStyles.dropZoneClass}
                      previewGridProps={{
                        container: { spacing: 1, direction: "row" },
                      }}
                      previewChipProps={{
                        classes: { root: formStyles.previewChipClass },
                      }}
                      dropzoneText="Drag and drop files here or click"
                      previewText="Selected files"
                      maxFileSize={50000000}
                      onChange={handleFileChange}
                    />
                  </Grid>
                </Grid>

                <DialogActions>
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
            if (!formik || !formik.values) return;
            
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
            if (!formik || !formik.values) return;
            
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
            const currentSelectedEquipments = equipmentData.map(item => item.equipment);

            if (currentSelectedEquipments.includes(value) && (formik && formik.values.equipment !== value)) {
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
              const key = `${building}-${borrowedFrom}`;
              const equipmentMap = buildEquipmentMap[key];
              
              if (equipmentMap) {
                const equipment = Object.values(equipmentMap).filter(item => item.equipment === value);
                const availableEquipment = SharePointService.getAvailableEquipment(
                  equipment,
                  fromDate,
                  toDate,
                  timeslot
                );

                if (availableEquipment.length === 0) {
                  setNotification({
                    show: true,
                    message: `This equipment is not available as ${equipment.length} out of ${equipment.length} in inventory is in use on the date and time selected.`,
                    severity: "error"
                  });
                  return;
                }

                const quantities = Array.from(
                  { length: availableEquipment.length },
                  (_, i) => ({ id: (i + 1).toString(), value: (i + 1).toString() })
                );

                setQuantityList(quantities);
                const assetNumbers = availableEquipment.map(item => item.assetNumber);
                setAssetList(assetNumbers);
                if (formik.setFieldValue) {
                  formik.setFieldValue("assetNumber", assetNumbers);
                }
              }
            }
          }}
          handleQuantity={(e) => {
            const formik = formikRef.current;
            const value = e.target.value;
            if (formik && formik.setFieldValue) {
              formik.setFieldValue("quantity", value);
              // Update asset numbers based on quantity
              const currentAssetNumbers = formik.values.assetNumber || [];
              const updatedAssetNumbers = currentAssetNumbers.slice(0, parseInt(value));
              setAssetList(updatedAssetNumbers);
              formik.setFieldValue("assetNumber", updatedAssetNumbers);
            }
          }}
        />
      )}
      {/* Confirmation Dialog */}
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
