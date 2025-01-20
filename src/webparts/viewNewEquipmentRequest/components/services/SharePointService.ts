import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
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
    const dateRange = `FromDate ge datetime'${dateConverter(from, 1)}' and ToDate le datetime'${dateConverter(to, 2)}'`;
    let query = departments.map(dept => `${filterColumn} eq '${dept}'`).join(' or ');
    const filterQuery = `${dateRange} and (${query})`;

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
