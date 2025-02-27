import * as React from 'react';
import { Grid, Chip, CircularProgress } from "@material-ui/core";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { CustomInput, CustomDateTimePicker, Dropdown } from './FormComponents';
import { EquipmentList } from './EquipmentList';
import { DropzoneArea } from "material-ui-dropzone";
import { IDropdownItem, IEquipmentData } from '../utils/helpers';
import styles from './EquipmentReservationForm.module.scss';
import { configService } from '../../../../shared/services/ConfigurationService';
import { Notification } from './Notification';

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
  isForReturnProp?: boolean;
  existingFiles?: string[]; // Add prop for existing files
  siteUrl: string; // Add siteUrl prop for file downloads
}

const getStatusOptions = (currentStatus: string, tabValue: number) => {
  if (tabValue === 3) { // Return tab
    return [{ id: 'Completed', value: 'Completed' }];
  }
  return [
    { id: 'For Return', value: 'For Return' },
    { id: 'Cancelled', value: 'Cancelled' }
  ];
};

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
  formik,
  isForReturnProp = false,
  existingFiles = [],
  siteUrl
}: IEquipmentReservationFormFieldsProps) => {
  const currentStatus = (formik && formik.values && formik.values.status) ? formik.values.status : '';
  
  // Disable logic based on tab and status:
  // - For Release (2): Files are disabled, Building/Borrowed From/Time/Dates are always disabled
  // - For Return (3): Equipment list is disabled, Building/Borrowed From/Time/Dates are always disabled
  const isFilesDisabled = tabValue === 2;  // Files are read-only in For Release tab
  const isEquipmentDisabled = tabValue === 3;  // Equipment list is disabled in For Return tab
  
  // Basic information fields are always disabled
  const isBasicInfoDisabled = true;
  
  // Department, Contact, and Remarks fields should be disabled in both For Release and For Return tabs
  const isDepartmentContactDisabled = true; // Always disabled regardless of tab
  
  // Enable return fields editing when status is Completed
  const canEditReturnFields = currentStatus === 'Completed';
  
  // Enable release fields editing when in For Release tab
  const canEditReleaseFields = tabValue === 2;

  // State for loading indicators and notifications
  const [loading, setLoading] = React.useState<{[key: string]: boolean}>({});
  const [notification, setNotification] = React.useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({
    open: false,
    message: '',
    severity: 'error'
  });

  // Log when component renders
  React.useEffect(() => {
    console.log(
        'EquipmentReservationFormFields rendered with formik values:',
        formik && formik.values ? formik.values : {}
    );
}, [formik && formik.values ? JSON.stringify(formik.values) : undefined]);


  // Handle file download
  const handleFileDownload = async (fileName: string) => {
    setLoading(prev => ({ ...prev, [fileName]: true }));
    try {
      // Log all relevant information for debugging
      console.log('Attempting to download file:', {
        fileName,
        formikValues: formik.values,
        GUID: formik.values.GUID,
        siteUrl,
        fullPath: `${siteUrl}/NewEquipmentRequestDocs/${formik.values.GUID}/${fileName}`,
        tabValue,
        isFilesDisabled
      });
      
      // Get GUID from formik values
      const guid = formik.values.GUID;
      if (!guid) {
        console.error('GUID not found in formik values:', formik.values);
        console.error('Please check SharePointService.getEquipmentRequests response');
        setNotification({
          open: true,
          message: 'Unable to download file. Document ID not found.',
          severity: 'error'
        });
        return;
      }

      // Construct the full URL
      const fileUrl = `${siteUrl}/NewEquipmentRequestDocs/${guid}/${encodeURIComponent(fileName)}`;
      
      // Create a hidden anchor element
      const link = document.createElement("a");
      link.style.display = 'none';
      link.href = fileUrl;
      link.download = fileName;
      
      // Add to document, click, and remove
      document.body.appendChild(link);
      try {
        link.click();
      } catch (error) {
        console.error('Error downloading file:', error);
        setNotification({
          open: true,
          message: 'Error downloading file. Opening in new tab instead.',
          severity: 'error'
        });
        // Fallback - open in new tab
        window.open(fileUrl, '_blank');
      } finally {
        document.body.removeChild(link);
      }
    } finally {
      setLoading(prev => ({ ...prev, [fileName]: false }));
    }
  };

  return (
    <Grid container spacing={4}>
      <Grid item xs={12}>
        <h2><b>Equipment Reservation Details</b></h2>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Requested By</div>
          <CustomInput name="requestedBy" disabled={true} />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Department</div>
          <Dropdown
            items={departmentList}
            name="department"
            disabled={isDepartmentContactDisabled}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Contact No.</div>
          <CustomInput 
            name="contactNumber" 
            disabled={isDepartmentContactDisabled}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Building</div>
          <Dropdown
            items={buildingList}
            name="building"
            handleChange={handleBuilding}
            disabled={isBasicInfoDisabled}
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
            disabled={isBasicInfoDisabled}
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
            disabled={isBasicInfoDisabled}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - From</div>
          <CustomDateTimePicker
            name="fromDate"
            disabled={isBasicInfoDisabled}
          />
        </div>
      </Grid>

      <Grid item xs={6}>
        <div className={styles.width}>
          <div className={styles.label}>Date of use - To</div>
          <CustomDateTimePicker
            name="toDate"
            disabled={isBasicInfoDisabled}
          />
        </div>
      </Grid>

      <Grid item xs={12}>
        <EquipmentList
          equipmentData={equipmentData}
          onAdd={onAddEquipment}
          onView={onViewEquipment}
          disabled={isEquipmentDisabled}  // Only disabled in For Return tab
        />
      </Grid>

      <Grid item xs={12}>
        <div className={styles.width}>
          <div className={styles.label}>Remarks</div>
          <CustomInput 
            name="remarks" 
            disabled={isDepartmentContactDisabled} // Disable in For Return tab
          />
        </div>
      </Grid>

      <Grid item xs={12}>
        <div className={styles.width}>
          <div className={styles.label}>Status</div>
          <Dropdown
            items={getStatusOptions(currentStatus, tabValue)}
            name="status"
          />
        </div>
      </Grid>

      {tabValue === 2 && ( // For Release fields - show in Release tab
        <>
          <Grid item xs={6}>
            <div className={styles.width}>
              <div className={styles.label}>Released To</div>
              <CustomInput 
                name="releasedTo" 
                disabled={!canEditReleaseFields}
              />
            </div>
          </Grid>

          <Grid item xs={6}>
            <div className={styles.width}>
              <div className={styles.label}>Released By</div>
              <CustomInput 
                name="releasedBy" 
                disabled={true}
              />
            </div>
          </Grid>

          <Grid item xs={12}>
            <div className={styles.width}>
              <div className={styles.label}>Release Remarks</div>
              <CustomInput 
                name="releaseRemarks" 
                multiline 
                rows={4}
                disabled={!canEditReleaseFields}
              />
            </div>
          </Grid>
        </>
      )}

      {tabValue === 3 && ( // For Return fields - show in Return tab
        <>
          <Grid item xs={6}>
            <div className={styles.width}>
              <div className={styles.label}>Returned To</div>
              <CustomInput 
                name="returnedTo" 
                disabled={true}
              />
            </div>
          </Grid>

          <Grid item xs={6}>
            <div className={styles.width}>
              <div className={styles.label}>Returned By</div>
              <CustomInput 
                name="returnedBy"
                disabled={!canEditReturnFields}
              />
            </div>
          </Grid>

          <Grid item xs={12}>
            <div className={styles.width}>
              <div className={styles.label}>Return Remarks</div>
              <CustomInput 
                name="returnRemarks" 
                multiline 
                rows={4}
                disabled={!canEditReturnFields}
              />
            </div>
          </Grid>
        </>
      )}

      <Grid item xs={6}>
        <div className={styles.label}>
          Attachment Here
        </div>
      </Grid>

      <Grid item xs={12}>
        {isFilesDisabled ? (
          // For Release tab: Show only chips
          <div>
            {existingFiles && existingFiles.map((fileName) => (
              <Chip
                key={fileName}
                label={fileName}
                icon={loading[fileName] ? <CircularProgress size={16} /> : <AttachFileIcon />}
                style={{
                  margin: "5px",
                  height: "32px",
                  cursor: loading[fileName] ? "default" : "pointer",
                  padding: "0 10px",
                  opacity: loading[fileName] ? 0.7 : 1
                }}
                clickable={!loading[fileName]}
                onClick={() => !loading[fileName] && handleFileDownload(fileName)}
              />
            ))}
          </div>
        ) : (
          // For Return tab: Show DropzoneArea first, then chips below
          <>
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
              initialFiles={[]}  // Don't show existing files in DropzoneArea since we show them as chips
            />
            <div style={{ marginTop: '20px' }}>
              {existingFiles && existingFiles.map((fileName) => (
                <Chip
                  key={fileName}
                  label={fileName}
                  icon={loading[fileName] ? <CircularProgress size={16} /> : <AttachFileIcon />}
                  style={{
                    margin: "5px",
                    height: "32px",
                    cursor: loading[fileName] ? "default" : "pointer",
                    padding: "0 10px",
                    opacity: loading[fileName] ? 0.7 : 1
                  }}
                  clickable={!loading[fileName]}
                  onClick={() => !loading[fileName] && handleFileDownload(fileName)}
                />
              ))}
            </div>
          </>
        )}
      </Grid>

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={() => setNotification({ open: false, message: '', severity: 'error' })}
      />
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
