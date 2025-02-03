import * as React from 'react';
import styles from './ViewNewEquipmentRequest.module.scss';
import { IViewNewEquipmentRequestProps } from './IViewNewEquipmentRequestProps';
import { IViewNewEquipmentRequestState } from './IViewNewEquipmentRequestState';
import { Grid, Paper, AppBar, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import CloseIcon from "@material-ui/icons/Close";
import { SharePointService } from './services/SharePointService';
import { SearchForm } from './common/SearchForm';
import { EquipmentTable } from './common/EquipmentTable';
import { headerObj, STATUS } from './utils/helpers';
import { IEquipmentRequest } from './interfaces/IEquipmentRequest';
import { Formik } from "formik";
import { CustomDateTimePicker } from './common/FormComponents';
import * as moment from 'moment';
import { equipmentRequestValidationSchema } from './utils/validation';

export default class ViewNewEquipmentRequest extends React.Component<IViewNewEquipmentRequestProps, IViewNewEquipmentRequestState> {
  constructor(props: IViewNewEquipmentRequestProps) {
    super(props);

    this.state = {
      tabValue: 0,
      menuTabs: ["By Reference No", "Past Request"],
      referenceNumberList: [],
      pastRequestList: [],
      releaseRequestList: [],
      returnRequestList: [],
      department: [],
      showViewModal: false,
      selectedRecord: null,
      notification: {
        show: false,
        message: "",
        severity: "success" as "success" | "error"
      }
    };
  }

  private handleTabChange = (event: React.ChangeEvent<{}>, tabValue: number): void => {
    this.setState({ tabValue });
  }

  private getData = (): IEquipmentRequest[] => {
    const { referenceNumberList, pastRequestList, releaseRequestList, tabValue, returnRequestList } = this.state;
    switch(tabValue) {
      case 0: return referenceNumberList;
      case 1: return pastRequestList;
      case 2: return releaseRequestList;
      case 3: return returnRequestList;
      default: return [];
    }
  }

  private handleSearch = async (fromDate: Date, toDate: Date): Promise<void> => {
    const filterColumn = this.state.department.length > 0 ? "BorrowedFrom" : "Department";
    await this.getItems(fromDate, toDate, filterColumn);
  }

  private handleViewAction = (event: any, rowData: IEquipmentRequest): void => {
    const { tabValue } = this.state;
    
    // Show modal only for "FOR RELEASE" (2) and "For Return" (3) tabs
    if (tabValue === 2 || tabValue === 3) {
      this.setState({
        showViewModal: true,
        selectedRecord: rowData
      });
    } else {
      // Original redirect behavior for other tabs
      window.open(
        `${this.props.siteUrl}/SitePages/DisplayEquipmentReservation_appge.aspx?pid=${rowData.ID}`,
        "_blank"
      );
    }
  }

  private handleCloseModal = (): void => {
    this.setState({
      showViewModal: false,
      selectedRecord: null,
      notification: {
        show: false,
        message: "",
        severity: "success"
      }
    });
  }

  private handleUpdateRequest = async (values: any): Promise<void> => {
    try {
      const formattedValues = {
        ...values,
        fromDate: values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : null,
        toDate: values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : null
      };

      await SharePointService.updateEquipmentRequest(formattedValues);
      this.setState({
        notification: {
          show: true,
          message: "Request updated successfully",
          severity: "success"
        }
      });
      
      // Refresh data after update
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
      const toDate = new Date();
      await this.getItems(fromDate, toDate);

      // Close modal after short delay
      setTimeout(() => {
        this.handleCloseModal();
      }, 1500);
    } catch (error) {
      this.setState({
        notification: {
          show: true,
          message: "Failed to update request. Please try again.",
          severity: "error"
        }
      });
    }
  }

  private handleRedirect = (): void => {
    window.open(`${this.props.siteUrl}/SitePages/Home.aspx`, "_self");
  }

  private async getItems(from: Date, to: Date, column: string = 'Department'): Promise<void> {
    let { department } = this.state;
    
    if (department.length === 0) {
      const currentUser = await SharePointService.getCurrentUser();
      console.log(`CurrentUser:`,currentUser.Title);
      department = await SharePointService.getDepartments(currentUser.Title);
    }

    const requests = await SharePointService.getEquipmentRequests(from, to, department, column);
    
    const referenceNumberList: IEquipmentRequest[] = [];
    const pastRequestList: IEquipmentRequest[] = [];
    const releaseRequestList: IEquipmentRequest[] = [];
    const returnRequestList: IEquipmentRequest[] = [];

    requests.forEach((item) => {
      if (item.status === STATUS.APPROVED || item.status === STATUS.CLOSED) {
        pastRequestList.push(item);
      }
      if (item.status === STATUS.RELEASE) {
        referenceNumberList.push(item);
        releaseRequestList.push(item);
      }
      if (item.status === STATUS.RETURN) {
        referenceNumberList.push(item);
        returnRequestList.push(item);
      }
    });

    this.setState({
      referenceNumberList,
      pastRequestList,
      releaseRequestList,
      returnRequestList,
    });
  }

  public async componentDidMount(): Promise<void> {
    const currentUser = await SharePointService.getCurrentUser();
    const { ownerEmails, departmentsByOwner } = await SharePointService.getEquipmentOwners();
    console.log(`OwnerEmails:`,ownerEmails);
    console.log(`currentUserEmail:`,currentUser.Title);
    if (ownerEmails.includes(currentUser.Title)) {
      const departments = departmentsByOwner[currentUser.Title];
      this.setState({
        menuTabs: ["By Reference No", "Past Request", "For Release", "For Return"],
        department: departments,
      });
    }
  }

  public render(): React.ReactElement<IViewNewEquipmentRequestProps> {
    const { tabValue, menuTabs, showViewModal, selectedRecord, notification } = this.state;

    return (
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
                onChange={this.handleTabChange}
                aria-label="tabs example"
                variant="scrollable"
                scrollButtons="auto"
              >
                {menuTabs.map((item: string, index: number) => (
                  <Tab key={index} label={item} className={styles.tabbar} />
                ))}
              </Tabs>
            </AppBar>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <SearchForm onSearch={this.handleSearch} />
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" className={styles.paper}>
            <EquipmentTable
              title={headerObj[tabValue.toString()]}
              data={this.getData()}
              tabValue={tabValue}
              onViewClick={this.handleViewAction}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Button
            type="button"
            variant="contained"
            startIcon={<CloseIcon />}
            onClick={this.handleRedirect}
            style={{
              color: "lightgrey",
              background: "grey",
              float: "right",
            }}
          >
            Close
          </Button>
        </Grid>

        <Dialog 
          open={showViewModal}
          onClose={this.handleCloseModal}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            style: {
              minHeight: '80vh'
            }
          }}
        >
          <DialogTitle style={{ backgroundColor: '#f5f5f5', padding: '16px 24px' }}>
            <div style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
              Equipment Reservation Details
            </div>
          </DialogTitle>
          <DialogContent>
            {selectedRecord && (
              <Formik
                initialValues={{
                  ...selectedRecord,
                  fromDate: selectedRecord.fromDate ? moment(selectedRecord.fromDate).toDate() : null,
                  toDate: selectedRecord.toDate ? moment(selectedRecord.toDate).toDate() : null
                }}
                validationSchema={equipmentRequestValidationSchema}
                onSubmit={this.handleUpdateRequest}
              >
                {({ values, errors, touched, handleChange, handleBlur, handleSubmit, isSubmitting }) => (
                  <form onSubmit={handleSubmit}>
                    <div className={styles.container}>
                      <Grid container spacing={4}>
                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Reference Number</div>
                            <div>{values.referenceNumber}</div>
                          </div>
                        </Grid>
                        <Grid item xs={6}>
                          <FormControl fullWidth error={touched.status && !!errors.status}>
                            <InputLabel>Status</InputLabel>
                            <Select
                              name="status"
                              value={values.status}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            >
                              {Object.values(STATUS).map((status) => (
                                <MenuItem key={status} value={status}>
                                  {status}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>

                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Requested By</div>
                            <div>{values.requestedBy}</div>
                          </div>
                        </Grid>
                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Department</div>
                            <div>{values.department}</div>
                          </div>
                        </Grid>

                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Contact Number</div>
                            <TextField
                              fullWidth
                              name="contactNumber"
                              value={values.contactNumber}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={touched.contactNumber && !!errors.contactNumber}
                              helperText={touched.contactNumber && errors.contactNumber}
                            />
                          </div>
                        </Grid>
                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Building</div>
                            <TextField
                              fullWidth
                              name="building"
                              value={values.building}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={touched.building && !!errors.building}
                              helperText={touched.building && errors.building}
                            />
                          </div>
                        </Grid>

                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Borrowed From</div>
                            <TextField
                              fullWidth
                              name="borrowedFrom"
                              value={values.borrowedFrom}
                              onChange={handleChange}
                              onBlur={handleBlur}
                            />
                          </div>
                        </Grid>
                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>Time</div>
                            <TextField
                              fullWidth
                              name="time"
                              value={values.time}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              error={touched.time && !!errors.time}
                              helperText={touched.time && errors.time}
                            />
                          </div>
                        </Grid>

                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>From Date</div>
                            <CustomDateTimePicker
                              name="fromDate"
                            />
                          </div>
                        </Grid>
                        <Grid item xs={6}>
                          <div className={styles.width}>
                            <div className={styles.label}>To Date</div>
                            <CustomDateTimePicker
                              name="toDate"
                            />
                          </div>
                        </Grid>

                        <Grid item xs={12}>
                          <div className={styles.width}>
                            <div className={styles.label}>Equipment List</div>
                            {(values.equipmentData || []).length > 0 && (
                              <div className={styles.equipmentDetails}>
                                <table>
                                  <thead>
                                    <tr>
                                      <th>Equipment</th>
                                      <th>Quantity</th>
                                      <th>Asset Number</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {(values.equipmentData || []).map((item: any, index: number) => (
                                      <tr key={index}>
                                        <td>{item.equipment}</td>
                                        <td>{item.quantity}</td>
                                        <td>
                                          {item.assetNumber && item.assetNumber.map((asset: string, number: number) => (
                                            <span key={asset}>
                                              {asset}
                                              {item.assetNumber.length > 0 &&
                                                (number < item.assetNumber.length - 1) ? ', ' : ''}
                                            </span>
                                          ))}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </Grid>

                        <Grid item xs={12}>
                          <div className={styles.width}>
                            <div className={styles.label}>Remarks</div>
                            <TextField
                              fullWidth
                              name="remarks"
                              value={values.remarks}
                              onChange={handleChange}
                              onBlur={handleBlur}
                              multiline
                              rows={4}
                            />
                          </div>
                        </Grid>
                      </Grid>

                      <DialogActions style={{ padding: "16px", marginTop: "20px" }}>
                        <Button
                          type="button"
                          variant="contained"
                          onClick={this.handleCloseModal}
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
                )}
              </Formik>
            )}
          </DialogContent>
        </Dialog>

        <Snackbar 
          open={notification.show} 
          autoHideDuration={6000} 
          onClose={() => this.setState({ notification: { ...notification, show: false } })}
        >
          <Alert 
            onClose={() => this.setState({ notification: { ...notification, show: false } })} 
            severity={notification.severity}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      </Grid>
    );
  }
}
