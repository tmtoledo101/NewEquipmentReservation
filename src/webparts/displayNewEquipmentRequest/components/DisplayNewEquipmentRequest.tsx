import * as React from "react";
import styles from "./DisplayNewEquipmentRequest.module.scss";
import { IDisplayNewEquipmentRequestProps } from "./IDisplayNewEquipmentRequestProps";
import { IDisplayNewEquipmentRequestState } from "./IDisplayNewEquipmentRequestState";

import * as yup from "yup";
import * as moment from "moment";
import { Formik, Field } from "formik";
import DateFnsUtils from "@date-io/date-fns";
import {
  Grid,
  TextField,
  Select,
  MenuItem,
  FormControl,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Checkbox,
  Chip,
  Box,
  Tooltip,
  Fab,
} from "@material-ui/core";
import EditIcon from "@material-ui/icons/Edit";
import CloseIcon from "@material-ui/icons/Close";
import SaveIcon from "@material-ui/icons/Save";
import AddIcon from "@material-ui/icons/Add";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import { DropzoneArea } from "material-ui-dropzone";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert, { AlertProps } from '@material-ui/lab/Alert';
import VisibilityIcon from "@material-ui/icons/Visibility";

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

const RETURN = 'For Return';
const COMPLETED = 'Completed';
const CANCELLED = 'Cancelled';
const RELEASE = 'For Release';

const  statusMapper = {
  'For Return': "Release the equipment",
  'Completed': "Return the equipment",
  'Cancelled': "Cancel the equipment reservation request",
};
const isFirstNotIncluded = (firstArray, secondArray) => {
  const data = firstArray.filter(item => secondArray.includes(item));
  return data.length === 0 ? true : false;
};
const validateDateTime = (startDateTime, endDateTime) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isSameOrAfter(startDateTime);

const dateFormat = (date) => {
  return moment(date).format("MM/DD/yyyy");
};

const CustomInput = (props) => {
  const { name, disabled = false } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <TextField
              value={field.value}
              variant="standard"
              onChange={(e) => {
                field.onChange(e);
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              name={name}
              disabled={disabled}
              className={styles.width}
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
            />
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

const validate = yup.object().shape({
  requestedBy: yup.string().required(),
  department: yup.string().required("Department is required"),
  building: yup.string().required("Building is required"),
  contactNumber: yup.number().required("Contact number is required"),
  borrowedFrom: yup.mixed().test("building", 
  "Building selection is required", function(){
    const { parent } = this;
    if(!parent.building) {
      return false;
    }
      return true;
   }
  ).required("Borrowed From is required"),
  status: yup.string(),
  newstatus: yup.string(),
  releasedTo: yup.mixed().test("newstatus", 
  "Released to is required", function(){
    const { parent } = this;
    if(parent.status === RELEASE && parent.newstatus === RETURN && !parent.releasedTo) {
      return false;
    }
      return true;
   }
  ).nullable(),
  returnedBy: yup.mixed().test("newstatus", 
  "Returned By is required", function(){
    const { parent } = this;
    if(parent.status === RETURN && parent.newstatus === COMPLETED && !parent.returnedBy) {
      return false;
    }
      return true;
   }
  ).nullable(),
  time: yup.string().required("Time is required"),
  fromDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .required("From date is required");
    }
    return yup.string().required("From date is required");
  }),
  toDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .when("fromDate", (fromDate, schema) => {
          return schema.test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range, fromDate < toDate",
          });
        })
        .required("toDate is required");
    }
    return yup.mixed().when("fromDate", (fromDate, schema) => {
      if (fromDate) {
        return schema
          .test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range",
          })
          .required("toDate is required");
      }
      return yup.mixed().required("toDate is required");
    });
  }),
});

function Alert(props1: AlertProps) {
  return <MuiAlert elevation={6} variant="filled" {...props1} />;
}
const Dropdown = (props) => {
  const { items, handleChange, name, multiple } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <Select
              name={field.name}
              multiple={multiple}
              onChange={(e) => {
                field.onChange(e);
                if (handleChange) {
                  handleChange(e);
                }
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              value={field.value}
              variant="standard"
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
              renderValue={(selected: any) => {
                if (multiple) {
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      {selected &&
                        selected.map((value) => (
                          <Chip
                            key={value}
                            label={value}
                            style={{ margin: "3px", height: "20px" }}
                          />
                        ))}
                    </Box>
                  );
                } else {
                  return selected;
                }
              }}
              {...props}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {multiple && (
                    <Checkbox checked={field.value.indexOf(item.value) > -1} />
                  )}
                  {item.value}
                </MenuItem>
              ))}
            </Select>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

const CustomDateTimePicker = (props) => {
  const { name, handleChange, disabled } = props;
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                clearable
                autoOk
                disabled={disabled}
                format="MM/dd/yyyy"
                value={field.value ? field.value : null}
                onChange={(e) => {
                  form.setFieldValue(name, e);
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
              />
            </MuiPickersUtilsProvider>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

const ModalPopup = ({ children, title, open, onClose, hideCloseIcon }) => {
  return (
    <Dialog
      open={open}
      keepMounted
      aria-labelledby="equipment-dialog-title"
      aria-describedby="equipment-dialog-description"
    >
      <DialogTitle id="equipment-dialog-title" disableTypography>
        <h4>{title}</h4>
        {!hideCloseIcon && (
          <Button
            onClick={onClose}
            className={styles.closeBtn}
            style={{
              position: "absolute",
              top: "0",
              right: "0",
            }}
          >
            <CloseIcon />
          </Button>
        )}
      </DialogTitle>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
};
const mapArrayToObject = (obj) =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });
const arrayToDropDownValues = (array) =>
  array.map((item) => ({ id: item, value: item }));

export default class DisplayNewEquipmentRequest extends React.Component<
  IDisplayNewEquipmentRequestProps,
  IDisplayNewEquipmentRequestState
> {
  public inputRef: any;
  public equipmentListMap: any;
  public buildBorrowedMap: any;
  public buildEquipmentMap: any;
  public equipmentList: any;
  public originalEquipmentList: any;

  constructor(props) {
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
    this.inputRef = React.createRef<HTMLInputElement>();
  }

  public handleFileChange = (files) => {
    this.setState({
      files,
    });
  }

  public handleDialog = (show, index = -1) => {
    this.setState({
      showEquipmentDialog: show,
      equipmentError: "",
    });
     /* 
    equipmentListMap ===> {
                Charger:  [item1, item2],
                Microphone: [],
                Laptop: [],
      }
    
   */

    if(!show) {
      return;
    }

    this.inputRef.current.setFieldValue("equipment", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);
    let equipmentList = mapArrayToObject(this.equipmentListMap);
    
    if(index >=0) {
      const data = this.state.equipmentData[index];
      const quantity = this.equipmentListMap[data.equipment].length;
      const list = [];
      for (let i = 1; i <= quantity; i++) {
        list.push(i);
      }
      const assetList = this.equipmentListMap[data.equipment].map(item => item.AssetNumber);
      this.inputRef.current.setFieldValue("equipment", data.equipment);
      this.setState({
        showEquipmentDialog: show,
        equipmentList: [...equipmentList],
        quantityList: arrayToDropDownValues(list),
        assetList: assetList,
      });
       
       this.inputRef.current.setFieldValue("equipment", data.equipment);
       this.inputRef.current.setFieldValue("quantity", data.quantity);
       this.inputRef.current.setFieldValue("assetNumber", data.assetNumber);
       this.inputRef.current.setFieldValue("currentRecord", index);
    } else {
      // removing already selected equipment
      const list = this.state.equipmentData.map(item => item.equipment);
      equipmentList = equipmentList.filter(item => list.indexOf(item.id) === -1);

    this.setState({
      equipmentList: [...equipmentList],
    });
    this.inputRef.current.setFieldValue("equipment", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);
    this.inputRef.current.setFieldValue("currentRecord", -1);
   }
  }


  public deleteRecord = (formik) => {
    const newEquipmentData = [...this.state.equipmentData];
    newEquipmentData.splice(formik.values.currentRecord,1);
    this.setState({
      equipmentData: newEquipmentData,
      showEquipmentDialog: false,
    });
  this.inputRef.current.setFieldValue("currentRecord", -1);
  }

  public handleConfirmDialog = (show) => {
    this.inputRef.current.setFieldValue("newstatus", this.state.newStatus);
    this.setState({
      saveDialog: show,
    });
  }

  public handleDialogSave = (formik) => {
    const obj = {
      equipment: formik.values.equipment,
      quantity: formik.values.quantity,
      assetNumber: formik.values.assetNumber,
    };
    let data = [...this.state.equipmentData];
    const currentRecord = this.inputRef.current.values["currentRecord"];
    if(currentRecord > -1 ) {
      data[currentRecord] = obj;
    } else {
    data.push(obj);
    }
    this.setState({
      equipmentData: [...data],
      showEquipmentDialog: false,
      quantityList: [],
      assetList: [],
      equipmentList: [],
    });
    this.inputRef.current.setFieldValue("equipment", "");
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);
  }

  public handleSave = (formik) => {
    const finalResult = formik.values;
    formik.validateForm();
    if (!Object.keys(formik.errors).length) {
      delete finalResult.equipment;
      delete finalResult.quantity;
      delete finalResult.assetNumber;
      finalResult["equipmentData"] = this.state.equipmentData;
      finalResult["files"] = this.state.files;
      this.handleConfirmDialog(false);
      this.updateRequest(finalResult);
    } else {
      this.setState({
        saveDialog: false,
      });
    }
  }

  public updateRequest = async (Formdata) => {
    this.setState({
      saveStart: true,
    });
    const queryParams = new URLSearchParams(window.location.search);
    const id = Number(queryParams.get("pid"));
   
    const { newStatus } = this.state;
    
    try {
      const dataNeedsToBeUpdated = {
        "Status" : newStatus,
        EquipmentData : JSON.stringify(Formdata["equipmentData"]),
      };
     
      if(newStatus === RETURN) {
          dataNeedsToBeUpdated["ReleasedTo"] = Formdata["releasedTo"];
          dataNeedsToBeUpdated["ReleasedBy"] = Formdata["releasedBy"];
          dataNeedsToBeUpdated["ReleaseRemarks"] = Formdata["releasedRemarks"];
        
      }
      if(newStatus === COMPLETED) {
        await this.updateEquipmentReturnStatus(Formdata["building"], Formdata["borrowedFrom"]);
        dataNeedsToBeUpdated["ReturnedTo"] = Formdata["returnedTo"];
        dataNeedsToBeUpdated["ReturnedBy"] = Formdata["returnedBy"];
        dataNeedsToBeUpdated["ReturnedRemarks"] = Formdata["returnedRemarks"];
      }
      if(newStatus === CANCELLED){
         await this.deleteEquipmentBlockedStatus(Formdata["building"], Formdata["borrowedFrom"]);
      }
     
      await sp.web.lists.getByTitle('NewEquipmentRequestList').items.getById(id).update({
        ...dataNeedsToBeUpdated,  
        });

     
      const  _itemId = this.state.guid;
      console.log(_itemId);
      if(_itemId) {
      const f = "/sites/ResourceReservation" + "/NewEquipmentRequestDocs/" + _itemId;
      await sp.web.lists.getByTitle("NewEquipmentRequestDocs").rootFolder.folders.getByName(_itemId).delete();
      await sp.web.lists.getByTitle("NewEquipmentRequestDocs").rootFolder.folders
      .add(_itemId)
      .then(r => {
         Promise.all(Formdata.files.map( (file) => {
         if (file.size <= 10485760) {
             sp.web.getFolderByServerRelativeUrl(f).files.add(file.name, file, true)
             .then(result => {  
              result.file.getItem()
              .then(item => {  
                  item.update({  
                    RequestId : _itemId  
                  });
              });  
          });
          } else {
             sp.web.getFolderByServerRelativeUrl(f).files.addChunked(file.name, file, d1 => {
            }, true).then(({ file:fileData }) => fileData.getItem()).then((item:any) => {  
                return item.update({  
                  RequestId : _itemId
                });
            });
          }
        }));
      });
      }
      
      this.setState({
        isSavingDone: true,
      });
      setTimeout(() => {
        this.Redirect();
      }, 1500);
    } catch (error) {
      console.log(error);
      this.setState({
        isSavingFailure: true,
        saveStart: false,
        failureMessage: "Some issue while updating request, Kindly contact Admin.",
      });
    }
  }

  public handleQuantity = (e) => {
    const { target: { value }} =  e;
    const asset:any =  this.state.assetList;
    const assetList = asset.slice(0, value);
    this.inputRef.current.setFieldValue("quantity", value);
    this.inputRef.current.setFieldValue("assetNumber", assetList);
  }

  public Redirect = () => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }
  public componentDidMount() {
    const queryParams = new URLSearchParams(window.location.search);
    const id = queryParams.get("pid");
    if(id){
      this.getLoggedinUser();
      this.getTime();
      this.getItems(id);
    }
  }
  public getItems = async (id) => {
    const item = await sp.web.lists
      .getByTitle("NewEquipmentRequestList")
      .items.getById(id)
      .get();
    this.inputRef.current.setFieldValue("referenceNumber", item.ReferenceNumber);
    this.inputRef.current.setFieldValue(
      "requestDate",
      dateFormat(item.Created)
    );
    this.inputRef.current.setFieldValue("requestedBy", item.RequestedBy);
    this.inputRef.current.setFieldValue("department", item.Department);
    this.getEquipmentsOwner(item.BorrowedFrom);
    this.inputRef.current.setFieldValue("building", item.Building);
    this.inputRef.current.setFieldValue("contactNumber", item.ContactNumber);
    this.inputRef.current.setFieldValue("fromDate", dateFormat(item.FromDate));
    this.inputRef.current.setFieldValue("toDate", dateFormat(item.ToDate));
    this.inputRef.current.setFieldValue("remarks", item.Remarks);
    this.inputRef.current.setFieldValue("status", item.Status);
    this.inputRef.current.setFieldValue("time", item.Time);
    this.inputRef.current.setFieldValue("borrowedFrom", item.BorrowedFrom);
    if(item.ReleasedBy){
      this.inputRef.current.setFieldValue("releasedBy", item.ReleasedBy);
    }
    if(item.ReturnedTo){
      this.inputRef.current.setFieldValue("returnedTo", item.ReturnedTo);
    }
    this.inputRef.current.setFieldValue("releasedTo", item.ReleasedTo);
    this.inputRef.current.setFieldValue("releasedRemarks", item.ReleaseRemarks);
    this.inputRef.current.setFieldValue("returnedBy", item.ReturnedBy);
    this.inputRef.current.setFieldValue("returnedRemarks", item.ReturnedRemarks);
    
    this.getFiles(item.GUID);
    this.getDepartments(item.RequestorEmail);
    this.getEquipments(item.Building, item.BorrowedFrom);
    this.setState({
      requestor: item.RequestorEmail,
      guid: item.GUID,
      requestStatus: item.Status,
      equipmentData: JSON.parse(item.EquipmentData),
    });
  }
  public getEquipmentsOwner = async (department) => {
    const equipmentList: any[] = await sp.web.lists
      .getByTitle("EquipmentOwner")
      .items.select(
        "Department/Department",
       "EquipmentOwner/EMail"
      )
      .expand(
        "EquipmentOwner/EMail",
        "Department/FieldValuesAsText"
      ).filter(`Department/Department eq '${department}'`)
      .get();
    const equipmentOwnerList = {};
    equipmentList.forEach(item => {
      equipmentOwnerList[item.EquipmentOwner.EMail] = item.EquipmentOwner.EMail;
    });
    this.setState({
      equipmentOwner:  Object.keys(equipmentOwnerList)
    });
  }
  public getFiles = async (guid) => {
    let docs = await sp.web
      .getFolderByServerRelativeUrl(
        this.props.siteRelativeUrl + "/NewEquipmentRequestDocs/" + guid
      )
      .files.select("*")
      .top(5000)
      .expand("ListItemAllFields") // For Metadata extraction
      .get();

    let files = docs.map((row) => {
      return row.Name;
    });
    this.setState({
      Files: [...files],
    });
  }
  public getLoggedinUser = () => {
    sp.web.currentUser.get().then((user) => {
      this.setState({
        currentUser: user.Email,
      });
      this.inputRef.current.setFieldValue("releasedBy", user.Title);
      this.inputRef.current.setFieldValue("returnedTo", user.Title);
    });
  }
  public getDepartments = async (email) => {
    const deparmentData: any[] = await sp.web.lists
      .getByTitle("EquipUsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      ).filter(`EmployeeName/EMail eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        "EmployeeName/EMail",
      )
      .get();
  
   
  const temp = deparmentData.map(item => item.Department.Department);
  const deparment = arrayToDropDownValues(temp);
    this.setState({
      departmentList: deparment,
    });
  }
  public getEquipments = async (building, borrowedFrom) => {
    const equipmentData: any[] = await sp.web.lists
      .getByTitle("NewEquipment")
      .items.select(
        "Building",
        "BorrowedFrom/Department",
        "Equiupment",
        "AssetNumber",
        "ID",
        "BlockedDateAM",
        "BlockedDatePM",
        "BlockedDateWholeDay",
      ).expand("BorrowedFrom/FieldValuesAsText")
      .get();
    const buildObj = {};
    const buildBorrowedMap = {};
    const buildEquipmentMap = {};
    
    /*   
    buildEquipmentMap === Structure
       building-borrrowedFrom  ===>   {
                  Charger:  [ch001, ch002],
                  Microphone: [],
                  Laptop: [],
            }
    */
    equipmentData.forEach((item) => {
      if (item.Building) {
        buildObj[item.Building] = item.Building;
      }
      if(!buildBorrowedMap[item.Building]) {
        // This is a set
        buildBorrowedMap[item.Building] = new Set();
      }
      if(!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`]){
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`] = {};
      }
      buildBorrowedMap[item.Building].add(item.BorrowedFrom.Department);
      if(!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment]) {
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment] = [];
      }
      buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment].push(item);
    });
    this.buildBorrowedMap = buildBorrowedMap;
    this.buildEquipmentMap = buildEquipmentMap;
    this.setState({
      buildingList: [
        ...Object.keys(buildObj).map((item, index) => ({
          id: index,
          value: item,
        })),
      ],
    });
   
    const equipmentData1 = this.buildEquipmentMap[`${building}-${borrowedFrom}`];
    this.equipmentListMap = equipmentData1;
  }
  public getTime = async () => {
    const timeData: any[] = await sp.web.lists
      .getByTitle("Time")
      .items.select("Time")
      .get();
    const tempArray = timeData.map((item, index) => ({
      id: index,
      value: item.Time,
    }));
    this.setState({
      timeList: tempArray,
    });
  }
  public handleBuilding = (e) => {
    const {
      target: { value },
    } = e;
    const borrowerList = arrayToDropDownValues(this.buildBorrowedMap[value]);
    this.setState({
      borrowedFromList: borrowerList,
    });
    this.inputRef.current.setFieldValue("building", value);
    this.inputRef.current.setFieldValue("borrowedFrom", "");
  }
  public handleBorrowedFrom = (e, formik) => {
    const {
      target: { value },
    } = e;
    const key = `${formik.values["building"]}-${value}`;
    const equipmentData = this.buildEquipmentMap[key];
    const equipmentListMap = {};
    for (let item of equipmentData) {
      equipmentListMap[item.equipment] = item;
    }
    this.equipmentListMap = equipmentListMap;
    this.setState({
      equipmentList: arrayToDropDownValues(Object.keys(this.equipmentListMap)),
    });
  }
  public handleEquipment = (e) => {
    const { target: { value } } = e;
   /* 
    equipmentListMap ===> {
                Charger:  [item1, item2],
                Microphone: [],
                Laptop: [],
      }
    
 */
  this.inputRef.current.setFieldValue("equipment", "");

  this.setState({
    equipmentError :"",
    assetList: [],
    quantityList: [],
  });

  const currentValue =  this.inputRef.current.values["equipment"];
  const currentSelectedEquipments = this.state.equipmentData.map(item => item.equipment);
  if(currentSelectedEquipments.indexOf(value) > -1 && currentValue !== value) {
    this.setState({
      equipmentError :"This equipment is already selected, you cannot re-select again."
    });
    return;
  } else  {
    this.inputRef.current.setFieldValue("quantity", "");
    this.inputRef.current.setFieldValue("assetNumber", []);
  }

  this.inputRef.current.setFieldValue("equipment", value);
  const fromDate  = this.inputRef.current.values["fromDate"];
  const endDate  = this.inputRef.current.values["toDate"];
  const timeslot = this.inputRef.current.values["time"];


  const from = moment(moment(fromDate).format("YYYY/MM/DD"));
  const to = moment(moment(endDate).format("YYYY/MM/DD"));
  const days = to.diff(from, 'days', true);
  const requestedDateArray = [];
  for(let i = 0 ; i<= days; i++) {
    requestedDateArray.push(moment(from, 'YYYY/MM/DD').add(i, 'days'));
  }
  const itemArray = this.equipmentListMap[value];
  const key = `BlockedDate${timeslot}`;
  const equipment = itemArray.filter(item => { 
    console.log(item);
    const blockedDates = JSON.parse(item[key]) || [];
    console.log('blcoked', blockedDates);
    if(timeslot === 'WholeDay'){
      const amBlockedDates = JSON.parse(item[`BlockedDateAM`]) || [];
      const pmBlockedDates = JSON.parse(item[`BlockedDatePM`]) || [];
       // if it is already blocked for AM or PM then we cannot block for whole day
       // and it is not already blocked 
     
      if(!(isFirstNotIncluded(requestedDateArray, amBlockedDates) 
        && isFirstNotIncluded(requestedDateArray, pmBlockedDates)) 
      )
      {
        return false;
      }
    }

    if(timeslot === 'AM' ||  timeslot === 'PM') {
     const wholedaysBlockedDates = JSON.parse(item[`BlockedDateWholeDay`]) || [];
      if(!isFirstNotIncluded(requestedDateArray, wholedaysBlockedDates)) {
        return false;
      }
    }
    // if blockdates is empty or
    // if requested dates (from-to) are not present in blockdates, it means equipment is available.
    if(blockedDates.length === 0 || isFirstNotIncluded(requestedDateArray, blockedDates)) {
      return true;
    } else {
      return false;
    }

});
  const quantity = equipment.length;
  if(quantity === 0) {
    this.setState({
      equipmentError :`This equipment is not availble as ${itemArray.length} out of ${itemArray.length} in inventory is in use on the date and time selected.`
    });
    return;
  }
  const list = [];
  for (let i = 1; i <= quantity; i++) {
    list.push(i);
  }
  const assetList = equipment.map(item => item.AssetNumber);
  this.setState({
    assetList: assetList,
    quantityList: arrayToDropDownValues(list),
  });
  }
  public onEditClick = () => {
    this.setState({
      isEdit: true,
    });
  }
  public handleChipClick = (e, row) => {
    let f = `${this.props.siteUrl}/NewEquipmentRequestDocs/${this.state.guid}/${row}`;
    let link = document.createElement("a");
    link.href = f;
    link.download = f.substr(f.lastIndexOf("/") + 1);
    link.click();
  }

  public updateEquipmentReturnStatus = async (building,borrowedFrom) => {
    const currentAssetList =  this.state.equipmentData.reduce((prev, current) => {
      prev = [...current.assetNumber, ...prev];
      return prev;
    }, []);
    const equipmentData: any[] = await sp.web.lists
    .getByTitle("NewEquipment")
    .items.select(
      "Building",
      "BorrowedFrom/Department",
      "Equiupment",
      "AssetNumber",
      "ID",
      "BlockedDateAM",
      "BlockedDatePM",
      "BlockedDateWholeDay"
      ).expand("BorrowedFrom/FieldValuesAsText")
      .filter(`Building eq '${building}' and  BorrowedFrom/Department eq '${borrowedFrom}'`)
    .get();
   const releasedDate =  moment(this.inputRef.current.values["fromDate"]).format("YYYY/MM/DD");
   const timeslot = this.inputRef.current.values["time"];
   const key = `BlockedDate${timeslot}`;
   const filterEquipment = equipmentData.filter(item => currentAssetList.indexOf(item.AssetNumber) > -1);
  const blockedDates = JSON.parse(filterEquipment[0][key]) || [];
  const blockedDatesFilter = blockedDates.filter(item => item !== releasedDate);

   const tr = filterEquipment.map(item => {
      const data = {
        [key]: JSON.stringify(blockedDatesFilter)
      };
     return this.updateEquipmentItem(item.ID, data);
    });
  
   const result =  Promise.all(tr);
   result.then((data) => console.log(data));
  }
  
  public updateEquipmentItem = async (id, data) => {
      return await sp.web.lists.getByTitle('NewEquipment').items.getById(id).update({
      ...data
    });
  }

  public deleteEquipmentBlockedStatus = async (building, borrowedFrom) => {
    const currentAssetList =  this.state.equipmentData.reduce((prev, current) => {
      prev = [...current.assetNumber, ...prev];
      return prev;
    }, []);
    const equipmentData: any[] = await sp.web.lists
    .getByTitle("NewEquipment")
    .items.select(
      "Building",
      "BorrowedFrom/Department",
      "Equiupment",
      "AssetNumber",
      "ID",
      "BlockedDateAM",
      "BlockedDatePM",
      "BlockedDateWholeDay",
    ).expand("BorrowedFrom/FieldValuesAsText")
    .filter(`Building eq '${building}' and  BorrowedFrom/Department eq '${borrowedFrom}'`)
    .get();
    const requestDate =  moment(this.inputRef.current.values["fromDate"]).format("YYYY/MM/DD");
    const filterEquipment = equipmentData.filter(item => currentAssetList.indexOf(item.AssetNumber) > -1);
    const Time =  this.inputRef.current.values["time"];
    const key = `BlockedDate${Time}`;
    const blockedDates = JSON.parse(filterEquipment[0][key]);
    const blockedDatesFilter = blockedDates.filter(item => item !== requestDate);
    const requestPromise = filterEquipment.map(item => {
      const data = {
        [key]: JSON.stringify(blockedDatesFilter),
      };
     return this.updateEquipmentItem(item.ID, data);
    });
  
   const result =  Promise.all(requestPromise);
   result.then((data) => console.log(data));
  }

  public resetEquipmentData = () => {
    this.setState({
      equipmentData: [],
    });
 }

  public render(): React.ReactElement<IDisplayNewEquipmentRequestProps> {
    const {
      departmentList,
      buildingList,
      toggler,
      borrowedFromList,
      timeList,
      showEquipmentDialog,
      equipmentList,
      quantityList,
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
      assetList,
      failureMessage,
    } = this.state;
    return ( 
      <div className={styles.displayNewEquipmentRequest}>
      <div className={styles.container}>
          <Formik
            initialValues={{
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
              returnedBy: "",
              newstatus: "",
            }}
            validationSchema={validate}
            onSubmit={() => {
              this.handleConfirmDialog(true);
            }}
          >
            {(formik) => {
              this.inputRef.current = formik;
            return(  <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={4}>
              {saveDialog && (
                      <ModalPopup
                        title=""
                        hideCloseIcon={false}
                        open={saveDialog}
                        onClose={() => this.handleConfirmDialog(false)}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={12}>
                            <h3> { `Do you want to ${statusMapper[this.state.newStatus]}.`}</h3>
                          </Grid>
                          <Grid item xs={12}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "end",
                                alignItems: "center",
                              }}
                            >
                              <Button
                                color="secondary"
                                variant="contained"
                                onClick={() => this.handleConfirmDialog(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                color="primary"
                                variant="contained"
                                style={{
                                  marginLeft: "20px",
                                }}
                                onClick={() => this.handleSave(formik)}
                              >
                                Ok
                              </Button>
                            </div>
                          </Grid>
                        </Grid>
                      </ModalPopup>
                    )}
                {!isEdit && (
                  <>
                    <Grid item xs={12}>
                      <h2><b>Display Equipment Reservation</b></h2>
                    </Grid>
                   { (requestStatus === RELEASE || requestStatus === RETURN) &&  equipmentOwner.length >  0 &&
                     equipmentOwner.indexOf(currentUser) > -1 && 
                    ( <Grid item xs={12} sm={12}>
                      <Tooltip title="Edit">
                        <Fab
                          id="editFab"
                          size="medium"
                          color="primary"
                          onClick={this.onEditClick}
                        >
                          <EditIcon />
                        </Fab>
                      </Tooltip>
                    </Grid>)
                    }
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Reference Number</div>
                      <CustomInput name="referenceNumber" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Request Date</div>
                      <CustomInput name="requestDate" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Requested By</div>
                      <CustomInput name="requestedBy" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Department</div>
                      <CustomInput name="department" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Contact No</div>
                      <CustomInput name="contactNumber" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Building</div>
                      <CustomInput name="building" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Borrowed From</div>
                      <CustomInput name="borrowedFrom" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Time</div>
                      <CustomInput name="time" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Date of Use - From</div>
                      <CustomInput name="fromDate" disabled />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Date of Use - To</div>
                      <CustomInput name="toDate" disabled />
                    </Grid>
                    <Grid item xs={12}>
                      <div className={styles.label}>Reserve Equipment</div>
                      {equipmentData.length > 0 && (
                        <div className={styles.equipmentDetails}>
                          <table>
                            <thead>
                              <th>Equipment</th>
                              <th>Quantity</th>
                              <th>Asset Number</th>
                            </thead>
                            <tbody>
                              {equipmentData.map((item) => {
                                return (
                                  <tr>
                                    <td>{item.equipment}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.assetNumber.map((asset,number) => {
                                      return (<span key={asset}>
                                          {asset}{item.assetNumber.length > 0 && (number < item.assetNumber.length - 1) ? ',': ""}
                                      </span>);
                                    })}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Remarks</div>
                      <CustomInput name="remarks" disabled />
                    </Grid>
                    {(requestStatus === RETURN || requestStatus === COMPLETED) && (<>
                     <Grid item xs={6}>
                        <div className={styles.label}>Released By</div>
                        <CustomInput name="releasedBy" disabled/>
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Released To</div>
                        <CustomInput name="releasedTo" disabled/>
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Released Remarks</div>
                        <CustomInput name="releasedRemarks"  disabled/>
                      </Grid>
                      </>)
                    }
                      { requestStatus === COMPLETED && ( <>
                      <Grid item xs={6}>
                        <div className={styles.label}>Returned To</div>
                        <CustomInput name="returnedTo" disabled/>
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Returned By</div>
                        <CustomInput name="returnedBy" disabled/>
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Returned Remarks</div>
                        <CustomInput name="returnedRemarks" disabled/>
                      </Grid>
                      </>)
                    }
                    <Grid item xs={12} sm={6}>
                      <div className={styles.label}>Status</div>
                      <CustomInput name="status" disabled />
                    </Grid>
                    <Grid item xs={12} sm={12}>
                      <div className={styles.label}>Selected Files</div>
                      <div>
                        {Files &&
                          Files.map((value) => (
                            <Chip
                              key={value}
                              label={value}
                              icon={<AttachFileIcon />}
                              style={{ margin: "3px", height: "20px" }}
                              onClick={(e) => this.handleChipClick(e, value)}
                            />
                          ))}
                      </div>
                    </Grid>
                  </>
                )}
                {isEdit && (
                  <>
                    {showEquipmentDialog && (
                      <ModalPopup
                        title="Add Equipment"
                        hideCloseIcon={false}
                        open={showEquipmentDialog}
                        onClose={() => this.handleDialog(false)}
                      >
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Equipment</div>
                            <div className={styles.data}>
                              <Dropdown
                                items={equipmentList}
                                name="equipment"
                                onChange={(e) => this.handleEquipment(e)}
                              />
                            </div>
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Quantity</div>
                            <div className={styles.data}>
                              <Dropdown
                                items={quantityList}
                                name="quantity"
                                key={toggler}
                                onChange={(e) => this.handleQuantity(e)}
                              />
                            </div>
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Asset Number</div>
                            <div className={styles.data}>
                            <Dropdown
                              items={assetList}
                              name="assetNumber"
                              disabled
                              multiple
                              key={toggler}
                        />
                          </div>
                            </div>
                          </Grid>
                          <Grid item xs={6}>
                            {" "}
                          </Grid>
                          <Grid item xs={12}>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "end",
                                alignItems: "center",
                              }}
                            >
                              <Button
                                color="secondary"
                                variant="contained"
                                onClick={() => this.handleDialog(false)}
                              >
                                Cancel
                              </Button>
                              {formik.values.currentRecord >=0 && <Button
                                  color="secondary"
                                  variant="contained"
                                  style={{
                                    marginLeft: "20px",
                                  }}
                                  onClick={() => this.deleteRecord(formik)}
                                >
                                  Delete
                                </Button>}
                              <Button
                                color="primary"
                                variant="contained"
                                style={{
                                  marginLeft: "20px",
                                }}
                                disabled={
                                  !formik.values.equipment ||
                                  !formik.values.quantity
                                }
                                onClick={() => this.handleDialogSave(formik)}
                              >
                                Save
                              </Button>
                            </div>
                          </Grid>
                        </Grid>
                      </ModalPopup>
                    )}
                    
                    <Grid container spacing={4}>
                    <Grid item xs={6} sm={6}>
                      <div className={styles.label}>Reference Number</div>
                      <CustomInput name="referenceNumber" disabled />
                    </Grid>
                    <Grid item xs={6} sm={6}>
                      <div className={styles.label}>Request Date</div>
                      <CustomInput name="requestDate" disabled />
                    </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Requested By</div>
                        <CustomInput name="requestedBy" disabled />
                      </Grid>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Department</div>
                        <Dropdown items={departmentList} name="department"  disabled/>
                        </div>
                      </Grid>
                      <Grid item xs={6}>
                        <div className={styles.label}>Contact No.</div>
                        <CustomInput name="contactNumber" disabled />
                      </Grid>

                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Building</div>
                        <Dropdown
                          items={buildingList}
                          name="building"
                          handleChange={this.handleBuilding}
                          disabled
                        />
                        </div>
                      </Grid>

                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Borrowed From</div>
                        <Dropdown
                          items={borrowedFromList}
                          name="borrowedFrom"
                          handleChange={(e) =>
                            this.handleBorrowedFrom(e, formik)
                          }
                          disabled
                        />
                      </div>
                      </Grid>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Time</div>
                        <Dropdown items={timeList} name="time" disabled />
                        </div>
                      </Grid>

                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>
                          Date of use - From
                        </div>
                        <CustomDateTimePicker name="fromDate" disabled />
                        </div>
                      </Grid>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>
                          Date of use - To
                        </div>
                        <CustomDateTimePicker name="toDate" disabled/>
                        </div>
                      </Grid>

                      <Grid item xs={12}>
                      <div className={styles.width}>
                        <div className={styles.label}>Reserve Equipment</div>
                        <div className={styles.data}>
                          <Fab
                            color="primary"
                            aria-label="add"
                            size="small"
                            disabled={ requestStatus === RETURN  }
                            onClick={() => this.handleDialog(true)}
                          >
                            <AddIcon />
                          </Fab>
                        </div>
                        </div>
                        {equipmentData.length > 0 && (
                          <div className={styles.equipmentDetails}>
                            <table>
                              <thead>
                               <th>Action</th>
                                <th>Equipment</th>
                                <th>Quantity</th>
                                <th>Asset Number</th>
                              </thead>
                              <tbody>
                                {equipmentData.map((item, index) => {
                                  return (
                                    <tr>
                                       <td>
                                       <div onClick={() => this.handleDialog(true, index)}><VisibilityIcon /></div>
                                      </td>
                                      <td>{item.equipment}</td>
                                      <td>{item.quantity}</td>
                                      <td>{item.assetNumber.map((asset,number) => {
                                      return (<span key={asset}>
                                          {asset}{item.assetNumber.length > 0 && (number < item.assetNumber.length - 1) ? ',': ""}
                                      </span>);
                                    })}</td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Grid>

                      <Grid item xs={12}>
                      <div className={styles.width}>
                        <div className={styles.label}>Remarks</div>
                        <CustomInput name="remarks" disabled/>
                        </div>
                      </Grid>
                     { (requestStatus === RETURN || requestStatus === RELEASE) && <>
                     <Grid item xs={6}>
                     <div className={styles.width}>
                        <div className={styles.label}>Released By</div>
                        <CustomInput name="releasedBy" disabled/>
                        </div>
                      </Grid>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Released To</div>
                        <CustomInput name="releasedTo" disabled={requestStatus === RETURN}/>
                        </div>
                      </Grid>
                      <Grid item xs={12}>
                      <div className={styles.width}>
                        <div className={styles.label}>Released Remarks</div>
                        <CustomInput name="releasedRemarks" disabled={requestStatus === RETURN} />
                        </div>
                      </Grid>
                      </>
                      }
                      { requestStatus === RETURN && ( <>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Returned To</div>
                        <CustomInput name="returnedTo" disabled/>
                        </div>
                      </Grid>
                      <Grid item xs={6}>
                      <div className={styles.width}>
                        <div className={styles.label}>Returned By</div>
                        <CustomInput name="returnedBy" />
                        </div>
                      </Grid>
                      <Grid item xs={12}>
                      <div className={styles.width}>
                        <div className={styles.label}>Returned Remarks</div>
                        <CustomInput name="returnedRemarks" />
                        </div>
                      </Grid>
                      </>)}
                      <Grid item xs={12}>
                      <div className={styles.width}>
                        <div className={styles.label}>Status</div>
                        <CustomInput name="status" disabled />
                        </div>
                      </Grid>
                      <Grid item xs={6}>
                        <div
                          className={styles.label}
                          style={{ textAlign: "left" }}
                        >
                          {" "}
                          Attachment Here
                        </div>
                      </Grid>
                      <Grid item xs={6}></Grid>
                      <Grid item xs={12}>
                        <DropzoneArea
                          initialFiles={Files}
                          acceptedFiles={[
                            ".docx",
                            ".xlsx",
                            ".xls",
                            "doc",
                            ".mov",
                            "image/*",
                            "video/*",
                            " application/*",
                          ]}
                          showPreviews={true}
                          showFileNames={true}
                          maxFileSize={70000000}
                          filesLimit={10}
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
                          onChange={(files) => this.handleFileChange(files)}
                          dropzoneText="Attach general document here"
                        />
                      </Grid>
                    </Grid>
                  </>
                )}
                  <Grid item xs={12}>
                   <div className={styles.formHandle}>
                      { requestStatus === RELEASE && 
                      equipmentOwner.length >  0  &&
                      equipmentOwner.indexOf(currentUser) > -1 && 
                      isEdit
                            && (<>
                                        <Button
                                          type="submit"
                                          variant="contained"
                                          startIcon={<SaveIcon />}
                                          disabled={saveStart}
                                          color="primary"
                                          onClick={() => this.setState({ newStatus: RETURN })}
                                        >
                                          Release
                                        </Button>
                                </>)
                    }
                     { requestStatus === RETURN && 
                      equipmentOwner.length >  0 &&
                      equipmentOwner.indexOf(currentUser) > -1 
                      && isEdit
                            && (<>
                                        <Button
                                          type="submit"
                                          variant="contained"
                                          startIcon={<SaveIcon />}
                                          disabled={saveStart}
                                          color="primary"
                                          onClick={() => this.setState({ newStatus: COMPLETED })}
                                        >
                                          Return
                                        </Button>
                                </>)
                    }
                     
                  { (
                    (currentUser === requestor || 
                      equipmentOwner.indexOf(currentUser) > -1 
                    ) &&
                    requestStatus === RELEASE ) && 
                  (<Button
                                type="submit"
                                variant="contained"
                                startIcon={<CloseIcon />}
                                style={{
                                  color: "lightgrey",
                                  background: "grey",
                                }}
                                disabled={saveStart}
                                onClick={() => this.setState({ newStatus: CANCELLED })}
                              >
                                Cancel
                              </Button>)
                              }

                              <Button
                                type="button"
                                variant="outlined"
                                style={{
                                  color: "black",
                                }}
                                onClick={() => this.Redirect() }
                              >
                                Close
                              </Button>
                      </div>
                  </Grid>
              </Grid>
             <Snackbar open={isSavingDone} autoHideDuration={1000} >
                <Alert severity="success">
                   Request has been updated successfully.
                </Alert>
              </Snackbar>
              <Snackbar open={isSavingFailure} autoHideDuration={1000}  onClick={() => this.setState({isSavingFailure: false})}>
                <Alert severity="error" onClick={() => this.setState({isSavingFailure: false})}>
                  {failureMessage}
                </Alert>
              </Snackbar>
              </form>);
            }}
          </Formik>
          </div>
       </div>
    );
  }
}
