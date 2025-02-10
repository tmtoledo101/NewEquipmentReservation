import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import * as moment from "moment";
import { IEquipmentRequest } from "../interfaces/IEquipmentRequest";
import { dateConverter } from "../utils/helpers";

export interface IFacilityMapItem {
  Quantity: number;
  AssetNumber?: string;
}

export interface IEquipmentMapItem {
  [key: string]: any;
}

export class SharePointService {
  public static async getEquipments(): Promise<{
    buildingList: { id: string; value: string }[];
    buildBorrowedMap: { [key: string]: any };
    buildEquipmentMap: { [key: string]: IEquipmentMapItem };
    originalEquipmentList: any[];
  }> {
    try {
      const items: any[] = await sp.web.lists
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
        "ExclusiveTo",
      )
      .expand("BorrowedFrom/FieldValuesAsText")
      .top(5000)
      .get();

      const buildingList: { id: string; value: string }[] = [];
      const buildBorrowedMap: { [key: string]: any[] } = {};
      const buildEquipmentMap: { [key: string]: IEquipmentMapItem } = {};

      items.forEach(item => {
        // Build building list
        if (item.Building && !buildingList.find(b => b.id === item.Building)) {
          buildingList.push({
            id: item.Building,
            value: item.Building
          });
        }

        // Build borrowed map
        if (item.Building) {
          if (!buildBorrowedMap[item.Building]) {
            buildBorrowedMap[item.Building] = [];
          }
          if (item.Borrowed) {
            // Only add if not already in the array
            const borrowedItem = {
              borrowed: item.Borrowed,
              exclusiveTo: item.ExclusiveTo || ''
            };
            if (!buildBorrowedMap[item.Building].find(b => b.borrowed === item.Borrowed)) {
              buildBorrowedMap[item.Building].push(borrowedItem);
            }
          }
        }

        // Build equipment map
        if (item.Building && item.Borrowed) {
          const key = `${item.Building}-${item.Borrowed}`;
          if (!buildEquipmentMap[key]) {
            buildEquipmentMap[key] = {};
          }
          buildEquipmentMap[key][item.ID] = {
            title: item.Title,
            description: item.Description,
            status: item.Status,
            category: item.Category,
            borrowed: item.Borrowed
          };
        }
      });

      console.log('Equipment data:', {
        buildingList,
        buildBorrowedMap,
        buildEquipmentMap,
        items
      });

      return {
        buildingList,
        buildBorrowedMap,
        buildEquipmentMap,
        originalEquipmentList: items
      };
    } catch (error) {
      console.error('Error in getEquipments:', error);
      throw error;
    }
  }

  public static async getTime(): Promise<{ id: string; value: string }[]> {
    // Implementation here
    return [];
  }

  public static async updateRequest(
    id: number,
    values: any,
    equipmentData: any[],
    files: File[]
  ): Promise<void> {
    // Implementation here
  }

  public static async getCurrentUser() {
    return await sp.web.currentUser.get();
  }

  public static async getDepartments(email: string): Promise<{
    departments: { id: string; value: string }[];
    departmentSectorMap: { [key: string]: string };
  }> {
    const deparmentData: any[] = await sp.web.lists
      .getByTitle("EquipUsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
        "Department/Sector"
      ).filter(`EmployeeName/Title eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        "EmployeeName/EMail"
      )
      .top(5000) 
      .get();
    
    const departmentSectorMap = {};
    deparmentData.forEach(item => {
      departmentSectorMap[item.Department.Department] = item.Department.Sector;
    });

    return {
      departments: deparmentData.map(item => ({
        id: item.Department.Department,
        value: item.Department.Department
      })),
      departmentSectorMap
    };
  }

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
    const fromDateStr = moment(from).startOf('day').utc().format("YYYY-MM-DD[T]00:00:00[Z]");
    const toDateStr = moment(to).endOf('day').utc().format("YYYY-MM-DD[T]23:59:59[Z]");
    
    const dateRange = `(FromDate le datetime'${toDateStr}' and ToDate ge datetime'${fromDateStr}')`;
    
    let filterQuery = dateRange;
    if (departments && departments.length > 0) {
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
