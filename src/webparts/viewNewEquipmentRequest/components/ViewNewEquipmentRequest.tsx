import * as React from 'react';
import styles from './ViewNewEquipmentRequest.module.scss';
import { IViewNewEquipmentRequestProps } from './IViewNewEquipmentRequestProps';
import { IViewNewEquipmentRequestState } from './IViewNewEquipmentRequestState';
import { Grid, Paper, AppBar, Tabs, Tab, Button, FormControl} from "@material-ui/core";
import MaterialTable from "material-table";
import VisibilityIcon from "@material-ui/icons/Visibility";
import CloseIcon from "@material-ui/icons/Close";
import { Formik, Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import * as yup from "yup";

import * as moment from "moment";

import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";

const APPROVED = "Completed";
const CLOSED = "Cancelled";
const RETURN = "For Return";
const RELEASE = "For Release";

const CustomDateTimePicker = (props) => {
  const { name, handleChange } = props;
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
                format="MM/dd/yyyy "
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

const validateDateTime = (startDateTime, endDateTime) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime && moment(endDateTime).isValid() &&
  moment(endDateTime).isSameOrAfter(startDateTime);

const validate = yup.object().shape({
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

const headerObj = {
  "0": "By Reference No",
  "1": "Past Request",
  "2": "Release Request",
  "3": "Return Request",
};
export default class ViewNewEquipmentRequest extends React.Component<IViewNewEquipmentRequestProps, IViewNewEquipmentRequestState> {
    public inputRef: any;

    constructor(props: IViewNewEquipmentRequestProps) {
      super(props);
  
      this.state = {
        items: [],
        menuTabs: ["By Reference No", "Past Request"],
        tabValue: 0,
        referenceNumberList: [],
        pastRequestList: [],
        releaseRequestList: [],
        returnRequestList: [],
        department: "",
      };
      this.inputRef = React.createRef<HTMLInputElement>();
    }
    protected handletabChange = (event, tabValue: Number) => {
      this.setState({
        tabValue,
      });
    }
  
    protected getData = () => {
      const { referenceNumberList, pastRequestList, releaseRequestList,tabValue, returnRequestList } =
        this.state;
      let array = null;
      switch(tabValue) {
        case 0: array = referenceNumberList;break;
        case 1: array = pastRequestList;break;
        case 2: array = releaseRequestList;break;
        case 3: array = returnRequestList;break;
      }
      return array;
    }
   
    public getColumn = () => {
      const { tabValue} = this.state;
      let columns = [
        {
          title: "Date of use - From",
          field: "fromDate",
          cellStyle: {
            minWidth: 150,
          },
          render: (value) =>
            value.fromDate
              ? moment(value.fromDate).format("MM/DD/YYYY")
              : null,
        },
        {
          title: "Date of use - To",
          field: "toDate",
          cellStyle: {
            minWidth: 150,
          },
          render: (value) =>
            value.toDate
              ? moment(value.toDate).format("MM/DD/YYYY")
              : null,
         
        },
        {
          title: "Time",
          field: "time",
        },
      
        {
          title: "Reference No.",
          field: "referenceNumber",
        },
       
        {
          title: "Requested By",
          field: "requestedBy",
        },
        {
          title: "Department",
          field: "department",
        },
        {
          title: "Building",
          field: "building",
        },
        {
          title: "Contact No.",
          field: "contactNumber",
        },
        {
          title: "Status",
          field: "status",
        },
        {
          title: "Equipment",
          field: "equipment",
          render: (value) =>  {
            const data = JSON.parse(value.equipment || []);
            const t = [];
            data.forEach(item => {
              t.push(<pre style={{ whiteSpace: 'break-spaces'}}>{item.equipment} {item.quantity} {item.assetNumber.join(', ')}</pre>);
            });
            return t;
          }
        },
       ];
        if(tabValue === 2) {
          const extraFields = [
            {
            title: "Borrowed From",
            field: "borrowedFrom"
           },
          {
            title: "Released To",
            field: "releasedTo",
          },
          {
            title: "Released By",
            field: "releasedBy",
          },
          {
            title: "Released Date",
            field: "releasedDate",
          },
        ];
         let newColumns = [...columns, ...extraFields];
         columns = newColumns;
        }
        if(tabValue == 3) {
         
        const extraFields = [
          {
          title: "Borrowed From",
          field: "borrowedFrom"
         },
        {
          title: "Returned By",
          field: "returnedBy",
         },
         {
          title: "Returned To",
          field: "returnedTo",
         },
         
         {
          title: "Returned Remarks",
          field: "returnedDate",
         }];
        let newColumns = [...columns, ...extraFields];
        columns = newColumns;
        }
      return columns;
    }
    public ViewAction = (event, rowData) => {
      window.open(
        this.props.siteUrl +
          "/SitePages/DisplayEquipmentReservation_appge.aspx?pid=" +
          rowData["ID"],
        "_self"
      );
    }

    public handleSearch = (fromDate, toDate) => {
      const filter = this.state.department.length > 0 ? "BorrowedFrom" : "Department";
      this.getItems(fromDate, toDate, filter);
    }

    public render(): React.ReactElement<IViewNewEquipmentRequestProps> {

      const { tabValue, menuTabs } = this.state;
      return (
        <Formik
        initialValues={{
          fromDate: "",
          toDate: ""
        }}
        validationSchema={validate}
        onSubmit={(values) => {
          console.log(values);
        }}
      >
        {(formik) => {
          this.inputRef.current = formik;
          return (
            <form onSubmit={formik.handleSubmit}>
        <Grid container spacing={4}>
        <Grid item xs={12}>
              <h2><b>View Equipment Reservation Request</b></h2>
          </Grid>
          <Grid item xs={12}>
            <Paper square className={styles.paper}>
              <AppBar position="static" color="default">
                <Tabs
                  value={tabValue}
                  indicatorColor="primary"
                  textColor="primary"
                  onChange={this.handletabChange}
                  aria-label="tabs example"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  {menuTabs.map((item: any) => (
                    <Tab label={item} className={styles.tabbar} />
                  ))}
                </Tabs>
              </AppBar>
            </Paper>
          </Grid>
          <Grid item xs={4}>
                  <div className={styles.width}>
                    <div className={styles.label}>From</div>
                    <CustomDateTimePicker name="fromDate" />
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <div className={styles.width}>
                    <div className={styles.label}>To</div>
                    <CustomDateTimePicker name="toDate" />
                  </div>
                </Grid>
                <Grid item xs={4}>
                  <div className={styles.width}>
                    <Button
                      type="button"
                      variant="contained"
                      onClick={() =>
                        this.handleSearch(
                          formik.values.fromDate,
                          formik.values.toDate
                        )
                      }
                      style={{
                        marginTop:"15px", 
                      }}
                      color="primary"
                      disabled={!(formik.values.fromDate && formik.values.toDate)}
                    >
                      Search
                    </Button>
                  </div>
                </Grid>
             
          <Grid item xs={12}>
            <Paper variant="outlined" className={styles.paper}>
              <div>
                <MaterialTable
                  title={headerObj[`${tabValue}`]}
                  columns={this.getColumn() || []}
                  data={this.getData()}
                  options={{
                    filtering: true,
                    pageSize: 5,
                    pageSizeOptions: [5, 10, this.getData().length],
                    search: false,
                    grouping: true,
                    selection: false,
                    columnsButton: false,
                    exportButton: true,
                  }}
                  actions={[
                    {
                      icon: () => <VisibilityIcon />,
                      tooltip: "View Record",
                      onClick: (event, rowData) => {
                        this.ViewAction("view", rowData);
                      },
                    },
                  ]}
                />
              </div>
            </Paper>
          </Grid>
          
          <Grid item xs={12} >
            <Button
              type="button"
              variant="contained"
              startIcon={<CloseIcon />}
              onClick={() => this.Redirect()}
              style={{
                color: "lightgrey",
                background: "grey",
                float: "right",
              }}
            >
              Close
            </Button>
          </Grid>
        </Grid>
          </form>
          );
        }}
      </Formik>
      );
  }

  public Redirect = () => {
    window.open(this.props.siteUrl + "/SitePages/Home.aspx", "_self");
  }
  public componentDidMount() {
    this.getUser();
  }

  public dateConverter = (date, type) =>   {
    let result = null;
   if(type === 1) {
   result = `${moment(date).subtract(1, 'day').toISOString()}`;
   }  else if (type === 2) {
    result = `${moment(date).add(1, 'day') .toISOString()}`;
   } 
  return result;
  }
  public getItems = async (from, to, column='Department') => {
    let  { department } =  this.state;
    const dateRange = `FromDate ge datetime'${this.dateConverter(from, 1)}'and ToDate le datetime'${this.dateConverter(to, 2)}'`;
    let filterQuery = null;
    if(department.length === 0) {
      department = await this.getDepartments();
    }
   
    let query = "";
     department.forEach((item, index) => {
        query += `${column} eq '${item}'`; // match with borrowedFrom 
        if((department.length - 1) != index){
          query+= ' or ';
        }
      });
      filterQuery = `${dateRange} and ${query}`;
 
    const requestItem = await sp.web.lists
      .getByTitle("NewEquipmentRequestList")
      .items.select("*")
      .filter(`${filterQuery}`)
      .orderBy("Id", false)
      .top(5000)
      .get();
    
    const itemArray = [];
    const itemArray2 = [];
    const itemArray3 = [];
    const itemArray4 = [];

    requestItem.forEach((item) => {
      const tempObj = {
        building: item.Building,
        fromDate: item.FromDate,
        toDate: item.ToDate,
        referenceNumber: item.ReferenceNumber,
        requestedBy: item.RequestedBy,
        department: item.Department,
        contactNumber: item.ContactNumber,
        status: item.Status,
        time: item.Time,
        equipment: item.EquipmentData,
        ID: item.Id,
        returnedBy: item["Returned By"],
        returnedTo: item["Returned To"],
        returnedDate: item["Returned Date"],
        releasedTo: item["Released To"],
        releasedBy: item["Released By"],
        releasedDate: item["Released Date"],
        borrowedFrom: item.BorrowedFrom
      };

      if (item.Status === APPROVED || item.Status === CLOSED) {
        itemArray2.push(tempObj);
      }
      if (item.Status === RELEASE) {
        itemArray.push(tempObj);
        itemArray3.push(tempObj);
      }
      if (item.Status === RETURN) {
        itemArray.push(tempObj);
        itemArray4.push(tempObj);
      }
    
    });
    this.setState({
      referenceNumberList: [...itemArray],
      pastRequestList: [...itemArray2],
      releaseRequestList: [...itemArray3],
      returnRequestList: [...itemArray4],
    });
  }

  public getDepartments = async () => {
    const currentUserData =  await sp.web.currentUser.get();
    // get department as per current user only.
    const email =  currentUserData.Email;
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
  
    const department = deparmentData.map(item => item.Department.Department);
    return department;
  }

  public getUser = async () => {
    const equipmentList: any[] = await sp.web.lists
    .getByTitle("EquipmentOwner")
    .items.select(
      "Department/Department",
     "EquipmentOwner/EMail"
    ).expand(
      "EquipmentOwner/EMail",
      "Department/FieldValuesAsText"
    )
    .get();
  const equipmentOwnerList = [];
  equipmentList.forEach(item => {
    equipmentOwnerList.push(item.EquipmentOwner.EMail);
  });

  const currentUser = await sp.web.currentUser.get();
  const useremail = currentUser.Email;
    if (equipmentOwnerList.indexOf(useremail) > -1) {
      const departmentList = equipmentList.filter(item => item.EquipmentOwner.EMail === useremail).map(item => item.Department.Department);
      const uniqueDepartment = new Set(departmentList);
      const list = [];
      uniqueDepartment.forEach(item =>  list.push(item));
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Release", "For Return"],
        department: list,
      });
    }
 }
}
