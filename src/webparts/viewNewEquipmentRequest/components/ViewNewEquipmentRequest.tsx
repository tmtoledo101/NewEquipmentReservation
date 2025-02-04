import * as React from 'react';
import styles from './ViewNewEquipmentRequest.module.scss';
import { IViewNewEquipmentRequestProps } from './IViewNewEquipmentRequestProps';
import { IViewNewEquipmentRequestState } from './IViewNewEquipmentRequestState';
import { Grid, Paper, AppBar, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, Snackbar } from "@material-ui/core";
import { Alert } from "@material-ui/lab";
import CloseIcon from "@material-ui/icons/Close";
import { SharePointService } from './services/SharePointService';
import { SearchForm } from './common/SearchForm';
import { EquipmentTable } from './common/EquipmentTable';
import { headerObj, STATUS } from './utils/helpers';
import { IEquipmentRequest } from './interfaces/IEquipmentRequest';
import * as moment from 'moment';
import { ApproverEquipmentForm } from './ApproverEquipmentForm';
import { IApproverFormValues } from './approverForm/interfaces/IApproverFormValues';

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

  private handleViewAction = async (event: any, rowData: IEquipmentRequest): Promise<void> => {
    const { tabValue } = this.state;
    
    if (tabValue === 2 || tabValue === 3) {
      try {
        const freshData = await SharePointService.getEquipmentRequestById(rowData.ID);
        
        this.setState({
          showViewModal: true,
          selectedRecord: freshData
        });
      } catch (error) {
        console.error('Error fetching equipment request details:', error);
        this.setState({
          notification: {
            show: true,
            message: "Failed to load equipment details. Please try again.",
            severity: "error"
          }
        });
      }
    } else {
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

  private handleUpdateRequest = async (values: IApproverFormValues): Promise<void> => {
    try {
      const formattedValues = {
        ...values,
        fromDate: values.fromDate ? moment(values.fromDate).format('YYYY-MM-DD') : '',
        toDate: values.toDate ? moment(values.toDate).format('YYYY-MM-DD') : '',
        // Replace values.equipmentData?.[0]?.equipment with a manual check:
        equipment:
          values.equipmentData &&
          values.equipmentData[0] &&
          values.equipmentData[0].equipment
            ? values.equipmentData[0].equipment
            : '',
        building: values.building || '',
        contactNumber: values.contactNumber || '',
        time: values.time || '',
        // Replace values.equipmentData?.map(...) with a manual check:
        equipmentData:
          values.equipmentData
            ? values.equipmentData.map(item => ({
                ...item,
                // Replace item.quantity?.toString():
                quantity: item.quantity && item.quantity.toString() 
                  ? item.quantity.toString() 
                  : '0'
              }))
            : []
      };
      

      await SharePointService.updateEquipmentRequest(formattedValues);
      this.setState({
        notification: {
          show: true,
          message: "Request updated successfully",
          severity: "success"
        }
      });
      
      const fromDate = new Date();
      fromDate.setMonth(fromDate.getMonth() - 1);
      const toDate = new Date();
      await this.getItems(fromDate, toDate);

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
              <ApproverEquipmentForm
                selectedRecord={selectedRecord}
                onSubmit={this.handleUpdateRequest}
                onCancel={this.handleCloseModal}
              />
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
