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

  //TERENCE change this to Title property to Email !!!! 
// "EquipmentOwner/Title" to  "EquipmentOwner/EMail"
  public static async getEquipmentOwners(): Promise<{ownerEmails: string[], departmentsByOwner: {[key: string]: string[]}}> {
    const equipmentList: any[] = await sp.web.lists
      .getByTitle("EquipmentOwner")
      .items.select(
        "Department/Department",
        "EquipmentOwner/Title",
      ).expand(
        "EquipmentOwner/Title",
        "Department/FieldValuesAsText"
      )
      .get();
//TERENCE change this to Title property to Email !!!! 
    console.log(`equipmentList:`,equipmentList);
    const ownerEmails = equipmentList.map(item => item.EquipmentOwner.Title);
    const departmentsByOwner = {};
    
    equipmentList.forEach(item => {
      console.log(`EquipmentOwnerTitle:`,item.EquipmentOwner.Title);
      if (!departmentsByOwner[item.EquipmentOwner.Title]) {
        departmentsByOwner[item.EquipmentOwner.Title] = [];
      }
      departmentsByOwner[item.EquipmentOwner.Title].push(item.Department.Department);
    });

    return {
      ownerEmails: [...new Set(ownerEmails)],
      departmentsByOwner
    };
  }

  public static async getEquipmentRequests(from: Date, to: Date, departments: string[], filterColumn: string = 'Department'): Promise<IEquipmentRequest[]> {
   
    // Format dates as UTC midnight to ensure consistent date comparison
    const fromDateStr = moment(from).startOf('day').utc().format("YYYY-MM-DD[T]00:00:00[Z]");
    const toDateStr = moment(to).endOf('day').utc().format("YYYY-MM-DD[T]23:59:59[Z]");
    
    const dateRange = `(FromDate le datetime'${toDateStr}' and ToDate ge datetime'${fromDateStr}')`;
    
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
