import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import * as moment from "moment";
import { IEquipmentRequest } from "../interfaces/IEquipmentRequest";
import { dateConverter, arrayToDropDownValues } from "../utils/helpers";

export interface IFacilityMapItem {
  Quantity: number;
  AssetNumber?: string;
}

export interface IEquipmentMapItem {
  equipment: string;
  borrowed: string;
  assetNumber: string;
  blockedDateAM: string | null;
  blockedDatePM: string | null;
  blockedDateWholeDay: string | null;
}

export class SharePointService {
  public static async getEquipments(): Promise<{
    buildingList: { id: string; value: string }[];
    buildBorrowedMap: { [key: string]: any };
    buildEquipmentMap: { [key: string]: { [id: number]: IEquipmentMapItem } };
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
          "ExclusiveTo"
        )
        .expand("BorrowedFrom/FieldValuesAsText")
        .top(5000)
        .get();

      // Initialize data structures with proper typing
      const buildingList: { id: string; value: string }[] = [];
      const buildBorrowedMap: { [key: string]: Array<{ borrowed: string; exclusiveTo: string }> } = {};
      const buildEquipmentMap: { [key: string]: { [id: number]: IEquipmentMapItem } } = {};

      // Process each item using a more structured approach
      items.forEach(item => {
        if (!item.Building) return;

        // Process building list - using Set for uniqueness
        if (!buildingList.some(b => b.id === item.Building)) {
          buildingList.push({
            id: item.Building,
            value: item.Building
          });
        }

        // Process borrowed map with proper typing and validation
        const borrowedDepartment = item.BorrowedFrom && item.BorrowedFrom.Department;        
        if (borrowedDepartment) {
          if (!buildBorrowedMap[item.Building]) {
            buildBorrowedMap[item.Building] = [];
          }

          const borrowedItem = {
            borrowed: borrowedDepartment,
            exclusiveTo: item.ExclusiveTo || '',
            //equipment: item.Equiupment || '',
          };

          // Ensure no duplicates using proper type checking
          if (!buildBorrowedMap[item.Building].some(b => b.borrowed === borrowedDepartment)) {
            buildBorrowedMap[item.Building].push(borrowedItem);
          }
        }

        // Process equipment map with proper validation
        if (borrowedDepartment) {
          const key = `${item.Building}-${borrowedDepartment}`;
          if (!buildEquipmentMap[key]) {
            buildEquipmentMap[key] = {} as { [id: number]: IEquipmentMapItem };
          }

          // Set all required properties with proper type handling
          buildEquipmentMap[key][item.ID] = {
            equipment: item.Equiupment || '',
            borrowed: borrowedDepartment,
            assetNumber: item.AssetNumber || '',
            blockedDateAM: item.BlockedDateAM || '',
            blockedDatePM: item.BlockedDatePM || '',
            blockedDateWholeDay: item.BlockedDateWholeDay || ''
          };
        }
      });

      // Log processed data for debugging
      console.log('Processed equipment data:', {
        buildingCount: buildingList.length,
        borrowedMapKeys: Object.keys(buildBorrowedMap).length,
        equipmentMapKeys: Object.keys(buildEquipmentMap).length,
        totalItems: items.length
      });

      return {
        buildingList,
        buildBorrowedMap,
        buildEquipmentMap,
        originalEquipmentList: items
      };
    } catch (error) {
      console.error('Error in getEquipments:', error);
      throw new Error(`Failed to fetch equipment data: ${error.message}`);
    }
  }

  public static async getTime(): Promise<{ id: string; value: string }[]> {
    try {
      const timeData: any[] = await sp.web.lists
        .getByTitle("Time")
        .items.select("Time")
        .get();

      return arrayToDropDownValues(timeData.map(item => item.Time));
    } catch (error) {
      console.error('Error in getTime:', error);
      throw new Error(`Failed to fetch time data: ${error.message}`);
    }
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
    console.log(`deparmentData:`,deparmentData);
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
      .top(5000)
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

  private static safeParseBlockedDates(value: any): string[] {
    if (!value) return [];
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.warn('Error parsing blocked dates:', error);
      return [];
    }
  }

  private static isFirstNotIncluded(firstArray: string[], secondArray: string[]): boolean {
    const data = firstArray.filter(item => secondArray.includes(item));
    return data.length === 0;
  }

  public static getAvailableEquipment(
    equipment: any[],
    fromDate: Date,
    toDate: Date,
    timeslot: string
  ) {
    const from = moment(moment(fromDate).format("YYYY/MM/DD"));
    const to = moment(moment(toDate).format("YYYY/MM/DD"));
    const days = to.diff(from, 'days', true);
    const requestedDateArray = [];
    
    for (let i = 0; i <= days; i++) {
      requestedDateArray.push(moment(from).add(i, 'days').format("YYYY/MM/DD"));
    }

    return equipment.filter(item => {
      const key = `BlockedDate${timeslot}`;
      const blockedDates = this.safeParseBlockedDates(item[key]);

      if (timeslot === 'WholeDay') {
        const amBlockedDates = this.safeParseBlockedDates(item['BlockedDateAM']);
        const pmBlockedDates = this.safeParseBlockedDates(item['BlockedDatePM']);
        
        // if it is already blocked for AM or PM then we cannot block for whole day
        if (!this.isFirstNotIncluded(requestedDateArray, amBlockedDates) || 
            !this.isFirstNotIncluded(requestedDateArray, pmBlockedDates)) {
          return false;
        }
      }

      if (timeslot === 'AM' || timeslot === 'PM') {
        const wholedaysBlockedDates = this.safeParseBlockedDates(item['BlockedDateWholeDay']);
        if (!this.isFirstNotIncluded(requestedDateArray, wholedaysBlockedDates)) {
          return false;
        }
      }

      // if blockdates is empty or requested dates are not present in blockdates,
      // it means equipment is available
      return blockedDates.length === 0 || 
             this.isFirstNotIncluded(requestedDateArray, blockedDates);
    });
  }

  public static async getEquipmentRequests(from: Date, to: Date, departments: string[], filterColumn: string = 'Department'): Promise<IEquipmentRequest[]> {
    const fromDateStr = moment(from).startOf('day').utc().format("YYYY-MM-DD[T]00:00:00[Z]");
    const toDateStr = moment(to).endOf('day').utc().format("YYYY-MM-DD[T]23:59:59[Z]");
    
    const dateRange = `(FromDate le datetime'${toDateStr}' and ToDate ge datetime'${fromDateStr}')`;
    console.log(`departments:`,departments);
    let filterQuery = dateRange;
    if (departments && departments.length > 0) {
      const deptQuery = departments
        .map(dept => `${filterColumn} eq '${dept.replace(/'/g, "''")}'`)
        .join(' or ');
      filterQuery += ` and (${deptQuery})`;
    }
    console.log(`filterQuery:`,filterQuery);
    const requestItems = await sp.web.lists
      .getByTitle("NewEquipmentRequestList")
      .items.select("*")
      .filter(filterQuery)
      .orderBy("Id", false)
      .top(5000)
      .get();

      console.log(`requestItems:`,requestItems);
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
