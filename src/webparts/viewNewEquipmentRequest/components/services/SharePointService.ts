import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import * as moment from "moment";
import { IEquipmentRequest } from "../interfaces/IEquipmentRequest";
import { dateConverter } from "../utils/helpers";

export class SharePointService {
  public static async getCurrentUser() {
    return await sp.web.currentUser.get();
  }

  public static async getDepartments(email: string): Promise<string[]> {
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
  
    return deparmentData.map(item => item.Department.Department);
  }

  public static async getEquipmentOwners(): Promise<{ownerEmails: string[], departmentsByOwner: {[key: string]: string[]}}> {
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

    const ownerEmails = equipmentList.map(item => item.EquipmentOwner.EMail);
    const departmentsByOwner = {};
    
    equipmentList.forEach(item => {
      if (!departmentsByOwner[item.EquipmentOwner.EMail]) {
        departmentsByOwner[item.EquipmentOwner.EMail] = [];
      }
      departmentsByOwner[item.EquipmentOwner.EMail].push(item.Department.Department);
    });

    return {
      ownerEmails: [...new Set(ownerEmails)],
      departmentsByOwner
    };
  }

  public static async getEquipmentRequests(from: Date, to: Date, departments: string[], filterColumn: string = 'Department'): Promise<IEquipmentRequest[]> {
    // Format dates properly for SharePoint
    //const fromDateStr = moment(from).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    //const toDateStr = moment(to).format("YYYY-MM-DD[T]HH:mm:ss[Z]");
    
   // const fromDateStr = moment(from).format("YYYY-MM-DD");
    //const toDateStr = moment(to).format("YYYY-MM-DD");
    
    // Build date range filter
    //const dateRange = `FromDate ge datetime'${fromDateStr}' and ToDate le datetime'${toDateStr}'`;
    //const dateRange = `FromDate ge date'${fromDateStr}' and ToDate le date'${toDateStr}'`;
    /*
    const dateRange = `(FromDate le datetime'${to.toISOString()}' and ToDate ge datetime'${from.toISOString()}') or
          (FromDate ge datetime'${from.toISOString()}' and FromDate le datetime'${to.toISOString()}')`;
    */
    const dateRange = `(FromDate ge datetime'${from.toISOString()}' and ToDate le datetime'${to.toISOString()}')`;
    
    // Build department filter only if departments array is not empty
    let filterQuery = dateRange;
    if (departments && departments.length > 0) {
      // Escape any single quotes in department names and build OR conditions
      const deptQuery = departments
        .map(dept => `${filterColumn} eq '${dept.replace(/'/g, "''")}'`)
        .join(' or ');
      filterQuery += ` and (${deptQuery})`;
    }

    const requestItems = await sp.web.lists
      .getByTitle("NewEquipmentRequestList")
      .items.select("*")
      .filter(filterQuery)
      .orderBy("Id", false)
      .top(5000)
      .get();

    return requestItems.map(item => ({
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
    }));
  }
}
