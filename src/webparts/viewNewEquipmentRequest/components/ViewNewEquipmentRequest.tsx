import * as React from 'react';
import styles from './ViewNewEquipmentRequest.module.scss';
import { IViewNewEquipmentRequestProps } from './IViewNewEquipmentRequestProps';
import { IViewNewEquipmentRequestState } from './IViewNewEquipmentRequestState';
import { Grid, Paper, AppBar, Tabs, Tab, Button } from "@material-ui/core";
import CloseIcon from "@material-ui/icons/Close";
import { SharePointService } from './services/SharePointService';
import { SearchForm } from './common/SearchForm';
import { EquipmentTable } from './common/EquipmentTable';
import { headerObj, STATUS } from './utils/helpers';
import { IEquipmentRequest } from './interfaces/IEquipmentRequest';
import { EquipmentReservationForm } from './common/EquipmentReservationForm';
import { de } from 'date-fns/locale';

export default class ViewNewEquipmentRequest extends React.Component<IViewNewEquipmentRequestProps, IViewNewEquipmentRequestState> {
  private selectedRequest: IEquipmentRequest | null = null;
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
      departmentSectorMap: {},
      showModal: false
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
    console.log('handlesearch');  
    await this.getItems(fromDate, toDate, filterColumn);
  }

  private handleViewAction = (event: any, rowData: IEquipmentRequest): void => {
    this.selectedRequest = rowData;
    this.setState({ showModal: true });
  }

  private handleRedirect = (): void => {
    window.open(`${this.props.siteUrl}/SitePages/Home.aspx`, "_self");
  }

  private async getItems(from: Date, to: Date, column: string = 'Department'): Promise<void> {
    let { department } = this.state;
    console.log(`GetItemdepartment:`,department, `departmentlenght`,department.length);
    if (department.length === 0) {
      const currentUser = await SharePointService.getCurrentUser();
      const { departments, departmentSectorMap } = await SharePointService.getDepartments(currentUser.Title);
      console.log(`Viewdepartments:`,departments);
      department = departments.map(dept => dept.value);
      this.setState({ department, departmentSectorMap });
    }

    const requests = await SharePointService.getEquipmentRequests(from, to, department, column);
    
    const referenceNumberList: IEquipmentRequest[] = [];
    const pastRequestList: IEquipmentRequest[] = [];
    const releaseRequestList: IEquipmentRequest[] = [];
    const returnRequestList: IEquipmentRequest[] = [];
    console.log(`requests:`,requests);
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
    const { tabValue, menuTabs, showModal } = this.state;

    return (
      <>
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
        </Grid>

        {showModal && (
          <EquipmentReservationForm
            isOpen={showModal}
            selectedRequest={this.selectedRequest}
            onClose={() => this.setState({ showModal: false })}
            onUpdateSuccess={async () => {
              const filterColumn = this.state.department.length > 0 ? "BorrowedFrom" : "Department";
              await this.getItems(new Date(), new Date(), filterColumn);
            }}
            siteUrl={this.props.siteUrl}
            tabValue={tabValue}
          />
        )}
      </>
    );
  }
}
