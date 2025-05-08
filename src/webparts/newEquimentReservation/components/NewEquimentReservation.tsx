import * as React from 'react';
import styles from './NewEquimentReservation.module.scss';
import { INewEquimentReservationProps } from './INewEquimentReservationProps';
import { INewEquimentReservationState } from "./INewEquimentReservationState";
import { Formik } from "formik";
import { Grid, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import { DropzoneArea } from "material-ui-dropzone";
import { FSS } from './utils/helpers';
import { equipmentReservationSchema } from './utils/validation';
import { SharePointService } from './services/SharePointService';
import { CustomInput, CustomDateTimePicker, Dropdown } from './common/FormComponents';
import { EquipmentDialog } from './common/EquipmentDialog';
import { ConfirmationDialog } from './common/ConfirmationDialog';
import { Notification } from './common/Notification';
import { EquipmentList } from './common/EquipmentList';
import { IEquipmentData, IDropdownItem } from './interfaces/INewEquipmentReservation';

export default class NewEquimentReservation extends React.Component<INewEquimentReservationProps, INewEquimentReservationState> {
  private inputRef: any;
  private equipmentListMap: any;
  private buildBorrowedMap: any;
  private buildEquipmentMap: any;
  private originalEquipmentList: any;
  private departmentSectorMap: any;

  constructor(props: INewEquimentReservationProps) {
    super(props);

    this.state = {
      departmentList: [],
      buildingList: [],
      toggler: false,
      timeList: [],
      borrowedFromList: [],
      showEquipmentDialog: false,
      equipmentList: [],
      quantityList: [],
      equipmentData: [],
      saveDialog: false,
      files: [],
      isSavingDone: false,
      isSavingFailure: false,
      failureMessage: "",
      requestorEmail: "",
      assetList: [],
      equipmentError: "",
      savingStart: false,
      isFssManaged: false,
    };

    this.inputRef = React.createRef();
  }

  public async componentDidMount() {
    await this.getLoggedinUser();
    await this.getDepartments();
    await this.getEquipments();
    await this.getTime();
  }

  private getLoggedinUser = async () => {
    const user = await SharePointService.getCurrentUser();
    this.inputRef.current.setFieldValue("requestedBy", user.Email);
    this.setState({ requestorEmail: user.Email });
  }

  private getDepartments = async () => {
    try {
      console.log(`USER!!!!!`, this.state.requestorEmail);
      const { departments, departmentSectorMap } = await SharePointService.getDepartments(this.state.requestorEmail);
      this.departmentSectorMap = departmentSectorMap;
      this.setState({ departmentList: departments });
    } catch (error) {
      this.setState({
        failureMessage: error.message,
        isSavingFailure: true,
      });
    }
  }

  private getEquipments = async () => {
    const {
      buildingList,
      buildBorrowedMap,
      buildEquipmentMap,
      originalEquipmentList
    } = await SharePointService.getEquipments();

    this.buildBorrowedMap = buildBorrowedMap;
    this.buildEquipmentMap = buildEquipmentMap;
    this.originalEquipmentList = originalEquipmentList;
    console.log(`buildingList`, buildingList);
    this.setState({ buildingList });
  }

  private getTime = async () => {
    const timeList = await SharePointService.getTime();
    this.setState({ timeList });
  }

  private handleDialog = (show: boolean, index: number = -1) => {
    this.setState({
      showEquipmentDialog: show,
      equipmentError: "",
    });

    if (!show) return;

    this.inputRef.current.setFieldValue("equipment", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);

    // Set currentRecord first
    this.inputRef.current.setFieldValue("currentRecord", index);

    if (index >= 0) {
      // Editing existing equipment
      console.log("Equipment data:", this.equipmentListMap);
      const data = this.state.equipmentData[index];
      const quantity = this.equipmentListMap[data.equipment].length;
      const list = Array.from({ length: quantity }, (_, i) => i + 1);
      const assetList = this.equipmentListMap[data.equipment].map(item => item.AssetNumber);

      this.setState({
        quantityList: list.map(num => ({ id: num, value: num.toString() })),
        assetList,
      });

      this.inputRef.current.setFieldValue("equipment", data.equipment);
      this.inputRef.current.setFieldValue("quantity", data.quantity);
      this.inputRef.current.setFieldValue("assetNumber", data.assetNumber);
    } 
    
    // Always refresh equipment list regardless of whether editing or adding
    if (this.equipmentListMap) {
      const selectedEquipment = this.state.equipmentData.map(item => item.equipment);
      const building = this.inputRef.current.values.building;
      const borrowedFrom = this.inputRef.current.values.borrowedFrom;
      
      if (building && borrowedFrom) {
        // Create a fresh list of equipment from current selection
        const freshEquipmentList = Object.keys(this.equipmentListMap).map(item => ({
          id: item,
          value: item
        }));
        
        // Filter out already selected equipment
        const filteredEquipmentList = freshEquipmentList.filter(item => 
          index >= 0 ? 
            item.value === this.state.equipmentData[index].equipment || !selectedEquipment.includes(item.value) : 
            !selectedEquipment.includes(item.value)
        );
        
        this.setState({ equipmentList: filteredEquipmentList });
      }
    }
  }

  private handleConfirmDialog = (show: boolean) => {
    this.setState({ saveDialog: show });
  }

  private handleDialogSave = (formik: any) => {
    const obj = {
      equipment: formik.values.equipment,
      quantity: formik.values.quantity,
      assetNumber: formik.values.assetNumber,
    };

    let data = [...this.state.equipmentData];
    const currentRecord = formik.values.currentRecord;

    if (currentRecord > -1) {
      data[currentRecord] = obj;
    } else {
      data.push(obj);
    }

    this.setState({
      equipmentData: data,
      showEquipmentDialog: false,
      quantityList: [],
      assetList: [],
      equipmentList: [],
    });

    this.inputRef.current.setFieldValue("equipment", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);
  }

  private handleSave = async (formik: any) => {
    formik.validateForm();
    if (!Object.keys(formik.errors).length) {
      const finalResult = { ...formik.values };
      delete finalResult.equipment;
      delete finalResult.quantity;
      delete finalResult.assetNumber;

      this.handleConfirmDialog(false);
      this.setState({ savingStart: true });

      try {
        await SharePointService.createRequest(
          finalResult,
          this.state.equipmentData,
          this.state.files,
          this.state.requestorEmail
        );

        this.setState({ isSavingDone: true });
        setTimeout(() => this.Redirect(), 1500);
      } catch (error) {
        this.setState({
          isSavingFailure: true,
          isSavingDone: false,
          failureMessage: "Unable to save data, Kindly contact admin",
          savingStart: false,
        });
      }
    } else {
      this.setState({ saveDialog: false });
    }
  }

  private handleFileChange = (files: File[]) => {
    this.setState({ files });
  }

  private handleQuantity = (e: any) => {
    const { value } = e.target;
    const assetList = this.state.assetList.slice(0, value);
    this.inputRef.current.setFieldValue("quantity", value);
    this.inputRef.current.setFieldValue("assetNumber", assetList);
  }

  private handleBuilding = (e: any) => {
    const { value } = e.target;
    const { isFssManaged } = this.state;

    let borrowedFromList = Array.from(this.buildBorrowedMap[value])
      .filter((item: any) => !isFssManaged ? item.exclusiveTo !== FSS : true)
      .map((item: any) => item.borrowed);

    borrowedFromList = [...new Set(borrowedFromList)].map(item => ({
      id: item,
      value: item
    }));

    this.setState({
      borrowedFromList,
      equipmentData: [],
      equipmentList: [],
    });

    this.inputRef.current.setFieldValue("building", value);
    this.inputRef.current.setFieldValue("borrowedFrom", "");
  }

  private handleBorrowedFrom = (e: any) => {
    const { value } = e.target;
    const building = this.inputRef.current.values.building;
    const key = `${building}-${value}`;

    this.equipmentListMap = this.buildEquipmentMap[key];
    this.setState({
      equipmentList: Object.keys(this.equipmentListMap).map(item => ({
        id: item,
        value: item
      })),
      equipmentData: [],
    });
  }

  private handleEquipment = (e: any) => {
    const { value } = e.target;
    const formik = this.inputRef.current;
    const currentSelectedEquipments = this.state.equipmentData.map(item => item.equipment);

    if (currentSelectedEquipments.includes(value) && formik.values.equipment !== value) {
      this.setState({
        equipmentError: "This equipment is already selected, you cannot re-select again."
      });
      return;
    }

    formik.setFieldValue("equipment", value);
    formik.setFieldValue("quantity", "");
    formik.setFieldValue("assetNumber", []);

    const fromDate = formik.values.fromDate;
    const toDate = formik.values.toDate;
    const timeslot = formik.values.time;

    if (!fromDate || !toDate || !timeslot) {
      this.setState({
        equipmentError: "Please select date and time first"
      });
      return;
    }

    const equipment = this.equipmentListMap[value];
    const availableEquipment = SharePointService.getAvailableEquipment(
      equipment,
      fromDate,
      toDate,
      timeslot
    );
    console.log('equipment',equipment);
    if (availableEquipment.length === 0) {
      this.setState({
        equipmentError: `This equipment is not available as ${equipment.length} out of ${equipment.length} in inventory is in use on the date and time selected.`
      });
      return;
    }

    const quantityList = Array.from(
      { length: availableEquipment.length },
      (_, i) => ({ id: i + 1, value: (i + 1).toString() })
    );

    this.setState({
      assetList: availableEquipment.map(item => item.AssetNumber),
      quantityList,
      equipmentError: "",
    });
  }

  private handleDepartment = (e: any) => {
    const { value } = e.target;
    if (value) {
      const isFssManaged = this.departmentSectorMap[value] === FSS;
      this.inputRef.current.setFieldValue("borrowedFrom", "");
      this.inputRef.current.setFieldValue("building", "");
      this.setState({
        isFssManaged,
        borrowedFromList: [],
        equipmentData: [],
        equipmentList: [],
      });
    }
  }

  private deleteRecord = (formik: any) => {
    const newEquipmentData = [...this.state.equipmentData];
    newEquipmentData.splice(formik.values.currentRecord, 1);
    this.setState({
      equipmentData: newEquipmentData,
      showEquipmentDialog: false,
    });
    this.inputRef.current.setFieldValue("currentRecord", -1);
  }

  private Redirect = () => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  public render(): React.ReactElement<INewEquimentReservationProps> {
    const {
      departmentList,
      buildingList,
      borrowedFromList,
      timeList,
      showEquipmentDialog,
      equipmentList,
      quantityList,
      equipmentData,
      saveDialog,
      isSavingDone,
      isSavingFailure,
      failureMessage,
      assetList,
      savingStart,
      equipmentError,
    } = this.state;

    return (
      <div className={styles.newEquimentReservation}>
        <div className={styles.container}>
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
              currentRecord: -1,
              assetNumber: [],
            }}
            validationSchema={equipmentReservationSchema}
            onSubmit={() => this.handleConfirmDialog(true)}
            innerRef={this.inputRef}
          >
            {(formik) => (
              <form onSubmit={formik.handleSubmit}>
                {showEquipmentDialog && (
                  <EquipmentDialog
                    open={showEquipmentDialog}
                    onClose={() => this.handleDialog(false)}
                    onSave={this.handleDialogSave}
                    onDelete={this.deleteRecord}
                    formik={formik}
                    equipmentList={equipmentList}
                    quantityList={quantityList}
                    assetList={assetList}
                    equipmentError={equipmentError}
                    handleEquipment={this.handleEquipment}
                    handleQuantity={this.handleQuantity}
                  />
                )}

                {saveDialog && (
                  <ConfirmationDialog
                    open={saveDialog}
                    onClose={() => this.handleConfirmDialog(false)}
                    onConfirm={this.handleSave}
                    formik={formik}
                  />
                )}

                <Grid container spacing={4}>
                  <Grid item xs={12}>
                    <h2><b>New Equipment Reservation Request</b></h2>
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
                        handleChange={this.handleDepartment}
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
                        handleChange={this.handleBuilding}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Borrowed From</div>
                      <Dropdown
                        items={borrowedFromList}
                        name="borrowedFrom"
                        handleChange={this.handleBorrowedFrom}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Time</div>
                      <Dropdown
                        items={timeList}
                        name="time"
                        handleChange={() => this.setState({ equipmentData: [] })}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Date of use - From</div>
                      <CustomDateTimePicker
                        name="fromDate"
                        handleChange={() => this.setState({ equipmentData: [] })}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.width}>
                      <div className={styles.label}>Date of use - To</div>
                      <CustomDateTimePicker
                        name="toDate"
                        handleChange={() => this.setState({ equipmentData: [] })}
                      />
                    </div>
                  </Grid>

                  <Grid item xs={12}>
                    <EquipmentList
                      equipmentData={equipmentData}
                      onAdd={() => this.handleDialog(true)}
                      onView={(index) => this.handleDialog(true, index)}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <div className={styles.width}>
                      <div className={styles.label}>Remarks</div>
                      <CustomInput name="remarks" />
                    </div>
                  </Grid>

                  <Grid item xs={6}>
                    <div className={styles.label} style={{ textAlign: "left" }}>
                      Attachment Here
                    </div>
                  </Grid>

                  <Grid item xs={6}></Grid>

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
                      previewText="Selected files"
                      onChange={this.handleFileChange}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <div className={styles.formHandle}>
                      <Button
                        type="button"
                        variant="contained"
                        startIcon={<CloseIcon />}
                        onClick={this.Redirect}
                        style={{
                          color: "lightgrey",
                          background: "grey",
                        }}
                      >
                        Close
                      </Button>

                      <Button
                        type="submit"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        color="secondary"
                        disabled={savingStart}
                      >
                        Save
                      </Button>
                    </div>
                  </Grid>
                </Grid>

                <Notification
                  open={isSavingDone}
                  message="Entry has been created successfully."
                  severity="success"
                  autoHideDuration={1000}
                />

                <Notification
                  open={isSavingFailure}
                  message={failureMessage}
                  severity="error"
                  onClose={() => this.setState({ isSavingFailure: false })}
                />
              </form>
            )}
          </Formik>
        </div>
      </div>
    );
  }
}
