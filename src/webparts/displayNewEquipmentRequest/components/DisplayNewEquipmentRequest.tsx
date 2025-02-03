import * as React from "react";
import { Grid } from "@material-ui/core";
import { Formik } from "formik";
import * as moment from "moment";
import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

import styles from "./DisplayNewEquipmentRequest.module.scss";
import { SharePointService } from "./services/SharePointService";
import { equipmentRequestValidationSchema } from "./utils/validation";
import { isFirstNotIncluded } from "./utils/helpers";
import { IDisplayNewEquipmentRequestProps } from "./interfaces/IDisplayNewEquipmentRequest";
import { IDisplayNewEquipmentRequestState } from "./interfaces/IDisplayNewEquipmentRequest";
import { BasicInformation } from "./common/BasicInformation";
import { StatusInformation } from "./common/StatusInformation";
import { EquipmentList } from "./common/EquipmentList";
import { EquipmentDialog } from "./common/EquipmentDialog";
import { FileList } from "./common/FileList";
import { ActionButtons } from "./common/ActionButtons";
import { ConfirmationDialog } from "./common/ConfirmationDialog";
import { Notification } from "./common/Notification";

interface IEquipmentItem {
  AssetNumber: string;
  BlockedDateAM: string;
  BlockedDatePM: string;
  BlockedDateWholeDay: string;
  [key: string]: any;
}

export default class DisplayNewEquipmentRequest extends React.Component<
  IDisplayNewEquipmentRequestProps,
  IDisplayNewEquipmentRequestState
> {
  private formikRef: any;
  private buildBorrowedMap: { [key: string]: Set<string> };
  private buildEquipmentMap: { [key: string]: { [key: string]: IEquipmentItem[] } };
  private equipmentListMap: { [key: string]: IEquipmentItem[] };

  constructor(props: IDisplayNewEquipmentRequestProps) {
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
      assetList: [],
      equipmentData: [],
      saveDialog: false,
      files: [],
      isSavingDone: false,
      isSavingFailure: false,
      isEdit: false,
      requestStatus: "",
      requestor: "",
      guid: "",
      Files: [],
      equipmentOwner: [],
      currentUser: "",
      newStatus: "",
      saveStart: false,
      equipmentError: "",
      failureMessage: "",
    };

    this.formikRef = React.createRef();
    this.buildBorrowedMap = {};
    this.buildEquipmentMap = {};
    this.equipmentListMap = {};
  }

  public componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("pid");
    if (id) {
      this.getLoggedinUser();
      this.getTime();
      this.getItems(id);
    }
  }

  private getLoggedinUser = async () => {
    const user = await SharePointService.getLoggedinUser();
    this.setState({
      currentUser: user.Email,
    });
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("releasedBy", user.Title);
      this.formikRef.current.setFieldValue("returnedTo", user.Title);
    }
  }

  private getTime = async () => {
    const timeList = await SharePointService.getTime();
    this.setState({
      timeList,
    });
  }

  private getItems = async (id: string) => {
    try {
      const item = await sp.web.lists
        .getByTitle("NewEquipmentRequestList")
        .items.getById(Number(id))
        .get();

      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue("referenceNumber", item.ReferenceNumber);
        this.formikRef.current.setFieldValue("requestDate", moment(item.Created).format("MM/DD/yyyy"));
        this.formikRef.current.setFieldValue("requestedBy", item.RequestedBy);
        this.formikRef.current.setFieldValue("department", item.Department);
        this.formikRef.current.setFieldValue("building", item.Building);
        this.formikRef.current.setFieldValue("contactNumber", item.ContactNumber);
        this.formikRef.current.setFieldValue("fromDate", moment(item.FromDate).format("MM/DD/yyyy"));
        this.formikRef.current.setFieldValue("toDate", moment(item.ToDate).format("MM/DD/yyyy"));
        this.formikRef.current.setFieldValue("remarks", item.Remarks);
        this.formikRef.current.setFieldValue("status", item.Status);
        this.formikRef.current.setFieldValue("time", item.Time);
        this.formikRef.current.setFieldValue("borrowedFrom", item.BorrowedFrom);

        if (item.ReleasedBy) {
          this.formikRef.current.setFieldValue("releasedBy", item.ReleasedBy);
        }
        if (item.ReturnedTo) {
          this.formikRef.current.setFieldValue("returnedTo", item.ReturnedTo);
        }
        this.formikRef.current.setFieldValue("releasedTo", item.ReleasedTo);
        this.formikRef.current.setFieldValue("releasedRemarks", item.ReleaseRemarks);
        this.formikRef.current.setFieldValue("returnedBy", item.ReturnedBy);
        this.formikRef.current.setFieldValue("returnedRemarks", item.ReturnedRemarks);
      }

      await this.getEquipmentsOwner(item.BorrowedFrom);
      await this.getFiles(item.GUID);
      await this.getDepartments(item.RequestorEmail);
      await this.getEquipments(item.Building, item.BorrowedFrom);

      this.setState({
        requestor: item.RequestorEmail,
        guid: item.GUID,
        requestStatus: item.Status,
        equipmentData: JSON.parse(item.EquipmentData),
      });
    } catch (error) {
      console.error("Error fetching item:", error);
    }
  }

  private getEquipmentsOwner = async (department: string) => {
    const equipmentOwner = await SharePointService.getEquipmentsOwner(department);
    this.setState({
      equipmentOwner,
    });
  }

  private getFiles = async (guid: string) => {
    const files = await SharePointService.getFiles(guid, this.props.siteRelativeUrl);
    this.setState({
      Files: files,
    });
  }

  private getDepartments = async (email: string) => {
    const departmentList = await SharePointService.getDepartments(email);
    this.setState({
      departmentList,
    });
  }

  private getEquipments = async (building: string, borrowedFrom: string) => {
    const { buildingList, buildBorrowedMap, buildEquipmentMap, equipmentData } = 
      await SharePointService.getEquipments(building, borrowedFrom);
    
    this.buildBorrowedMap = buildBorrowedMap;
    this.buildEquipmentMap = buildEquipmentMap;
    this.equipmentListMap = equipmentData;
    
    this.setState({
      buildingList,
    });
  }

  private handleBuilding = (e: any) => {
    const { value } = e.target;
    const borrowerList = Array.from(this.buildBorrowedMap[value]).map((item: string, index) => ({
      id: index,
      value: item,
    }));
    this.setState({
      borrowedFromList: borrowerList,
    });
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("building", value);
      this.formikRef.current.setFieldValue("borrowedFrom", "");
    }
  }

  private handleBorrowedFrom = (e: any, formik: any) => {
    const { value } = e.target;
    const buildingValue = formik.values && formik.values["building"];
    const key = buildingValue ? `${buildingValue}-${value}` : value;
    this.equipmentListMap = this.buildEquipmentMap[key] || {};
    this.setState({
      equipmentList: Object.keys(this.equipmentListMap).map((item, index) => ({
        id: index,
        value: item,
      })),
    });
  }

  private handleEquipment = (e: any) => {
    const { value } = e.target;

    let currentValue;
    if (this.formikRef.current && this.formikRef.current.values) {
      currentValue = this.formikRef.current.values["equipment"];
    } else {
      currentValue = undefined; // or some default
    }

    const currentSelectedEquipments = this.state.equipmentData.map(
      (item) => item.equipment
    );

    if (currentSelectedEquipments.indexOf(value) > -1 && currentValue !== value) {
      this.setState({
        equipmentError:
          "This equipment is already selected, you cannot re-select again.",
      });
      return;
    }

    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("equipment", value);
      
      let fromDate;
      if (
        this.formikRef.current &&
        this.formikRef.current.values
      ) {
        fromDate = this.formikRef.current.values["fromDate"];
      } else {
        fromDate = undefined; // or some default
      }

      let endDate;
      if (
        this.formikRef.current &&
        this.formikRef.current.values
      ) {
        endDate = this.formikRef.current.values["toDate"];
      } else {
        endDate = undefined; // or some default if desired
      }

      let timeslot;
      if (this.formikRef.current && this.formikRef.current.values) {
        timeslot = this.formikRef.current.values["time"];
      } else {
        timeslot = undefined; // or some default value if needed
      }


      const from = moment(moment(fromDate).format("YYYY/MM/DD"));
      const to = moment(moment(endDate).format("YYYY/MM/DD"));
      const days = to.diff(from, "days", true);
      const requestedDateArray = [];
      for (let i = 0; i <= days; i++) {
        requestedDateArray.push(moment(from).add(i, "days"));
      }

      const itemArray = this.equipmentListMap[value];
      const key = `BlockedDate${timeslot}`;
      const equipment = itemArray.filter((item) => {
        const blockedDates = JSON.parse(item[key]) || [];
        if (timeslot === "WholeDay") {
          const amBlockedDates = JSON.parse(item[`BlockedDateAM`]) || [];
          const pmBlockedDates = JSON.parse(item[`BlockedDatePM`]) || [];
          if (
            !(
              isFirstNotIncluded(requestedDateArray.map(d => d.format("YYYY/MM/DD")), amBlockedDates) &&
              isFirstNotIncluded(requestedDateArray.map(d => d.format("YYYY/MM/DD")), pmBlockedDates)
            )
          ) {
            return false;
          }
        }

        if (timeslot === "AM" || timeslot === "PM") {
          const wholedaysBlockedDates =
            JSON.parse(item[`BlockedDateWholeDay`]) || [];
          if (!isFirstNotIncluded(requestedDateArray.map(d => d.format("YYYY/MM/DD")), wholedaysBlockedDates)) {
            return false;
          }
        }

        return (
          blockedDates.length === 0 ||
          isFirstNotIncluded(requestedDateArray.map(d => d.format("YYYY/MM/DD")), blockedDates)
        );
      });

      const quantity = equipment.length;
      if (quantity === 0) {
        this.setState({
          equipmentError: `This equipment is not available as ${itemArray.length} out of ${itemArray.length} in inventory is in use on the date and time selected.`,
        });
        return;
      }

      const list = [];
      for (let i = 1; i <= quantity; i++) {
        list.push(i);
      }
      const assetList = equipment.map((item) => item.AssetNumber);
      this.setState({
        assetList,
        quantityList: list.map((item, index) => ({
          id: index,
          value: item.toString(),
        })),
      });
    }
  }

  private handleQuantity = (e: any) => {
    const { value } = e.target;
    const asset: any = this.state.assetList;
    const assetList = asset.slice(0, value);
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("quantity", value);
      this.formikRef.current.setFieldValue("assetNumber", assetList);
    }
  }

  private handleDialog = (show: boolean, index = -1) => {
    this.setState({
      showEquipmentDialog: show,
      equipmentError: "",
    });

    if (!show) {
      return;
    }

    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("equipment", "");
      this.formikRef.current.setFieldValue("quantity", "");
      this.formikRef.current.setFieldValue("assetNumber", []);
    }

    let equipmentList = Object.keys(this.equipmentListMap || {}).map((item) => ({
      id: item,
      value: item,
    }));

    if (index >= 0) {
      const data = this.state.equipmentData[index];
      const quantity = this.equipmentListMap[data.equipment].length;
      const list = [];
      for (let i = 1; i <= quantity; i++) {
        list.push(i);
      }
      const assetList = this.equipmentListMap[data.equipment].map(
        (item) => item.AssetNumber
      );

      this.setState({
        showEquipmentDialog: show,
        equipmentList,
        quantityList: list.map((item, idx) => ({
          id: idx,
          value: item.toString(),
        })),
        assetList,
      });

      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue("equipment", data.equipment);
        this.formikRef.current.setFieldValue("quantity", data.quantity);
        this.formikRef.current.setFieldValue("assetNumber", data.assetNumber);
        this.formikRef.current.setFieldValue("currentRecord", index);
      }
    } else {
      const list = this.state.equipmentData.map((item) => item.equipment);
      equipmentList = equipmentList.filter(
        (item) => list.indexOf(item.id) === -1
      );

      this.setState({
        equipmentList,
      });
      if (this.formikRef.current) {
        this.formikRef.current.setFieldValue("equipment", "");
        this.formikRef.current.setFieldValue("quantity", "");
        this.formikRef.current.setFieldValue("assetNumber", []);
        this.formikRef.current.setFieldValue("currentRecord", -1);
      }
    }
  }

  private handleDialogSave = (formik: any) => {
    const obj = {
      equipment: formik.values.equipment,
      quantity: formik.values.quantity,
      assetNumber: formik.values.assetNumber,
    };
    let data = [...this.state.equipmentData];
    
        // Manual null checks
    let currentRecord = -1; // default value
    if (
      this.formikRef.current &&
      this.formikRef.current.values &&
      this.formikRef.current.values["currentRecord"] !== undefined &&
      this.formikRef.current.values["currentRecord"] !== null
    ) {
      currentRecord = this.formikRef.current.values["currentRecord"];
    }

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
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("equipment", "");
      this.formikRef.current.setFieldValue("quantity", "");
      this.formikRef.current.setFieldValue("assetNumber", []);
    }
  }

  private deleteRecord = (formik: any) => {
    const newEquipmentData = [...this.state.equipmentData];
    newEquipmentData.splice(formik.values.currentRecord, 1);
    this.setState({
      equipmentData: newEquipmentData,
      showEquipmentDialog: false,
    });
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("currentRecord", -1);
    }
  }

  private handleConfirmDialog = (show: boolean) => {
    if (this.formikRef.current) {
      this.formikRef.current.setFieldValue("newstatus", this.state.newStatus);
    }
    this.setState({
      saveDialog: show,
    });
  }

  private handleSave = async (formik: any) => {
    const finalResult = formik.values;
    formik.validateForm();
    if (!Object.keys(formik.errors).length) {
      delete finalResult.equipment;
      delete finalResult.quantity;
      delete finalResult.assetNumber;
      finalResult["equipmentData"] = this.state.equipmentData;
      finalResult["files"] = this.state.files;
      this.handleConfirmDialog(false);
      await this.updateRequest(finalResult);
    } else {
      this.setState({
        saveDialog: false,
      });
    }
  }

  private updateRequest = async (formData: any) => {
    this.setState({
      saveStart: true,
    });

    const queryParams = new URLSearchParams(window.location.search);
    const id = Number(queryParams.get("pid"));
    const { newStatus } = this.state;

    try {
      const dataNeedsToBeUpdated = {
        Status: newStatus,
        EquipmentData: JSON.stringify(formData["equipmentData"]),
      };

      if (newStatus === "For Return") {
        dataNeedsToBeUpdated["ReleasedTo"] = formData["releasedTo"];
        dataNeedsToBeUpdated["ReleasedBy"] = formData["releasedBy"];
        dataNeedsToBeUpdated["ReleaseRemarks"] = formData["releasedRemarks"];
      }

      if (newStatus === "Completed") {
        await SharePointService.updateEquipmentReturnStatus(
          this.getCurrentAssetList(),
          formData["building"],
          formData["borrowedFrom"],
          moment(formData["fromDate"]).format("YYYY/MM/DD"),
          formData["time"]
        );
        dataNeedsToBeUpdated["ReturnedTo"] = formData["returnedTo"];
        dataNeedsToBeUpdated["ReturnedBy"] = formData["returnedBy"];
        dataNeedsToBeUpdated["ReturnedRemarks"] = formData["returnedRemarks"];
      }

      if (newStatus === "Cancelled") {
        await SharePointService.updateEquipmentReturnStatus(
          this.getCurrentAssetList(),
          formData["building"],
          formData["borrowedFrom"],
          moment(formData["fromDate"]).format("YYYY/MM/DD"),
          formData["time"]
        );
      }

      await SharePointService.updateRequest(id, dataNeedsToBeUpdated);

      if (this.state.guid) {
        await SharePointService.uploadFiles(this.state.guid, formData.files);
      }

      this.setState({
        isSavingDone: true,
      });
      setTimeout(() => {
        this.Redirect();
      }, 1500);
    } catch (error) {
      console.error(error);
      this.setState({
        isSavingFailure: true,
        saveStart: false,
        failureMessage:
          "Some issue while updating request, Kindly contact Admin.",
      });
    }
  }

  private getCurrentAssetList = () => {
    return this.state.equipmentData.reduce((prev, current) => {
      prev = [...current.assetNumber, ...prev];
      return prev;
    }, []);
  }

  private handleFileChange = (files: File[]) => {
    this.setState({
      files,
    });
  }

  private handleFileDownload = (fileName: string) => {
    const f = `${this.props.siteUrl}/NewEquipmentRequestDocs/${this.state.guid}/${fileName}`;
    const link = document.createElement("a");
    link.href = f;
    link.download = f.substr(f.lastIndexOf("/") + 1);
    link.click();
  }

  private onEditClick = () => {
    this.setState({
      isEdit: true,
    });
  }

  private Redirect = () => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }

  public render(): React.ReactElement<IDisplayNewEquipmentRequestProps> {
    const {
      departmentList,
      buildingList,
      borrowedFromList,
      timeList,
      showEquipmentDialog,
      equipmentList,
      quantityList,
      assetList,
      equipmentData,
      saveDialog,
      isSavingDone,
      isSavingFailure,
      requestStatus,
      isEdit,
      Files,
      currentUser,
      equipmentOwner,
      requestor,
      saveStart,
      equipmentError,
      failureMessage,
      newStatus,
    } = this.state;

    return (
      <div className={styles.displayNewEquipmentRequest}>
        <div className={styles.container}>
          <Formik
            initialValues={{
              referenceNumber: "",
              requestDate: "",
              requestedBy: "",
              department: "",
              building: "",
              fromDate: "",
              toDate: "",
              equipment: "",
              quantity: "",
              remarks: "",
              contactNumber: "",
              borrowedFrom: "",
              time: "",
              status: "",
              currentRecord: -1,
              releasedTo: "",
              releasedBy: "",
              releasedRemarks: "",
              returnedTo: "",
              returnedBy: "",
              returnedRemarks: "",
              newstatus: "",
              assetNumber: []
            }}
            validationSchema={equipmentRequestValidationSchema}
            onSubmit={() => {
              this.handleConfirmDialog(true);
            }}
            innerRef={this.formikRef}
          >
            {(formik) => (
              <form onSubmit={formik.handleSubmit}>
                <Grid container spacing={4}>
                  {!isEdit && (
                    <Grid item xs={12}>
                      <h2>
                        <b>Display Equipment Reservation</b>
                      </h2>
                    </Grid>
                  )}

                  <BasicInformation
                    formik={formik}
                    departmentList={departmentList}
                    buildingList={buildingList}
                    borrowedFromList={borrowedFromList}
                    timeList={timeList}
                    handleBuilding={this.handleBuilding}
                    handleBorrowedFrom={this.handleBorrowedFrom}
                    isEdit={isEdit}
                  />

                  <Grid item xs={12}>
                    <EquipmentList
                      equipmentData={equipmentData}
                      onAdd={() => this.handleDialog(true)}
                      onView={(index) => this.handleDialog(true, index)}
                      disabled={requestStatus === "For Return"}
                    />
                  </Grid>

                  <StatusInformation
                    formik={formik}
                    requestStatus={requestStatus}
                    isEdit={isEdit}
                  />

                  <Grid item xs={12}>
                    <FileList
                      files={this.state.files}
                      existingFiles={Files}
                      onFileChange={this.handleFileChange}
                      onFileDownload={this.handleFileDownload}
                      disabled={!isEdit}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <ActionButtons
                      formik={formik}
                      requestStatus={requestStatus}
                      currentUser={currentUser}
                      equipmentOwner={equipmentOwner}
                      requestor={requestor}
                      isEdit={isEdit}
                      saveStart={saveStart}
                      onEdit={this.onEditClick}
                      onClose={this.Redirect}
                      setNewStatus={(status) =>
                        this.setState({ newStatus: status })
                      }
                    />
                  </Grid>
                </Grid>

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
                    handleEquipment={this.handleEquipment}
                    handleQuantity={this.handleQuantity}
                    equipmentError={equipmentError}
                  />
                )}

                {saveDialog && (
                  <ConfirmationDialog
                    open={saveDialog}
                    onClose={() => this.handleConfirmDialog(false)}
                    onConfirm={this.handleSave}
                    formik={formik}
                    newStatus={newStatus}
                  />
                )}

                <Notification
                  showSuccess={isSavingDone}
                  showError={isSavingFailure}
                  successMessage="Request has been updated successfully."
                  errorMessage={failureMessage}
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
