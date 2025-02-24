import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import * as moment from "moment";
import { IEquipmentRequest } from "../interfaces/IEquipmentRequest";
import { dateConverter, arrayToDropDownValues } from "../utils/helpers";
import  {isDevelopmentMode } from "../../../../shared/utils/enivronmentHelper";
import { configService } from "../../../../shared/services/ConfigurationService";
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
      let allItems: any[] = [];
    
    // Initial page request
    let page = await sp.web.lists
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
      .top(100)  // Process 100 items at a time
      .getPaged();

    // Add first page results
    allItems = [...allItems, ...page.results];

    // Get subsequent pages if they exist
    while (page.hasNext) {
      page = await page.getNext();
      allItems = [...allItems, ...page.results];
    }

    console.log('Total items retrieved:', allItems.length);


      // Initialize data structures with proper typing
      const buildingList: { id: string; value: string }[] = [];
      const buildBorrowedMap: { [key: string]: Array<{ borrowed: string; exclusiveTo: string }> } = {};
      const buildEquipmentMap: { [key: string]: { [id: number]: IEquipmentMapItem } } = {};

      // Process each item using a more structured approach
      allItems.forEach(item => {
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
        totalItems: allItems.length
      });

      return {
        buildingList,
        buildBorrowedMap,
        buildEquipmentMap,
        originalEquipmentList: allItems
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
    try {
      const currentUser = await this.getCurrentUser();
      // Get the equipment items to update their blocked dates if status is Returned
      if (values.status === 'Returned') {
        const parsedEquipment = JSON.parse(JSON.stringify(equipmentData));
        if (Array.isArray(parsedEquipment)) {
          for (const equipment of parsedEquipment) {
            // Get the equipment item from NewEquipment list
            const equipmentItems = await sp.web.lists
              .getByTitle("NewEquipment")
              .items.filter(`Equiupment eq '${equipment.equipment}' and AssetNumber eq '${equipment.assetNumber}'`)
              .get();

            if (equipmentItems.length > 0) {
              const equipmentItem = equipmentItems[0];
              // Clear blocked dates based on time slot
              const updateFields: any = {};
              if (values.time === 'AM') {
                updateFields.BlockedDateAM = '[]';
              } else if (values.time === 'PM') {
                updateFields.BlockedDatePM = '[]';
              } else if (values.time === 'WholeDay') {
                updateFields.BlockedDateWholeDay = '[]';
              }

              // Update the equipment item
              await sp.web.lists
                .getByTitle("NewEquipment")
                .items.getById(equipmentItem.ID)
                .update(updateFields);
            }
          }
        }
      }
      //const requestDate = moment().format('YYYY/MM/DD');
      // Update SharePoint list item
      const updateData = {
        Status: values.status,
        Department: values.department,
        ContactNumber: values.contactNumber,
        Building: values.building,
        BorrowedFrom: values.borrowedFrom,
        Time: values.time,
        FromDate: values.fromDate,
        ToDate: values.toDate,
        Remarks: values.remarks,
        EquipmentData: JSON.stringify(equipmentData),
        ...(values.status === 'For Return' ? {
          ReleasedBy: values.releasedBy || currentUser.Title,
          ReleasedTo: values.releasedTo,
          ReleaseRemarks: values.releaseRemarks,
          //ReleasedDate: moment().format('YYYY/MM/DD')
        } : values.status === 'Completed' ? {
          ReturnedBy: values.returnedBy,
          ReturnedTo: values.returnedTo || values.borrowedFrom,
          ReturnedRemarks: values.returnRemarks,
          DateCompleted: moment().format('YYYY/MM/DD')
        } : {})
      };

      await sp.web.lists
        .getByTitle("NewEquipmentRequestList")
        .items.getById(id)
        .update(updateData);

      // Handle file attachments if any
      if (files && files.length > 0) {
        // Get the request's GUID
        const request = await sp.web.lists
          .getByTitle("NewEquipmentRequestList")
          .items.getById(id)
          .select("GUID")
          .get();

        // Upload files to document library
        const docLibrary = "NewEquipmentRequestDocs";
        const environment = configService.isDevUser() ? "/sites/ResourceReservationDev" : "/sites/ResourceReservation";
        const folderPath = environment + "/" + docLibrary + "/" + request.GUID;

        // Create folder if it doesn't exist
        await sp.web.lists.getByTitle(docLibrary).rootFolder.folders.add(request.GUID);

        // Upload each file
        await Promise.all(files.map(file => {
          if (file.size <= 10485760) {
            // Regular file upload
            return sp.web.getFolderByServerRelativeUrl(folderPath).files.add(file.name, file, true)
              .then(fileResult => {
                return fileResult.file.getItem()
                  .then(fileItem => {
                    return fileItem.update({
                      RequestId: id
                    });
                  });
              });
          } else {
            // Chunked upload for large files
            return sp.web.getFolderByServerRelativeUrl(folderPath).files.addChunked(file.name, file, d1 => {
              console.log({ data: d1 });
            }, true)
              .then(({ file: fileData }) => fileData.getItem())
              .then(fileItem => {
                return fileItem.update({
                  RequestId: id
                });
              });
          }
        }));
      }
    } catch (error) {
      console.error('Error in updateRequest:', error);
      throw new Error(`Failed to update request: ${error.message}`);
    }
  }

  public static async getCurrentUser() {
    const user = await sp.web.currentUser.get();
    
    const currentUserProp = {
      Email: isDevelopmentMode()? user.Title : user.Email,
      Title: user.Title
    };
    console.log("currentUserprop",currentUserProp.Email);
    return currentUserProp;
  }

  public static async getDepartments(email: string): Promise<{
    departments: { id: string; value: string }[];
    departmentSectorMap: { [key: string]: string };
  }> {
    let allDepartmentData: any[] = [];
    
    // Initial page request
    const  employeeTitleEmail = isDevelopmentMode()? "EmployeeName/Title":"EmployeeName/EMail";
    console.log("employeeTitleEmail:", employeeTitleEmail,
      "Email:" ,email
    );
    let page = await sp.web.lists
      .getByTitle("EquipUsersPerDepartment")
      .items.select(
        employeeTitleEmail,
        "Department/Department",
        "Department/Sector"
      )
      .filter(`${employeeTitleEmail} eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        employeeTitleEmail
      )
      .top(100)  // Process 100 items at a time
      .getPaged();

    // Add first page results
    allDepartmentData = [...allDepartmentData, ...page.results];

    // Get subsequent pages if they exist
    while (page.hasNext) {
      page = await page.getNext();
      console.log(`Total departments retrieved(page):`, allDepartmentData.length);
      allDepartmentData = [...allDepartmentData, ...page.results];
    }

    console.log(`Total departments retrieved:`, allDepartmentData.length);

    const departmentSectorMap = {};
    allDepartmentData.forEach(item => {
      departmentSectorMap[item.Department.Department] = item.Department.Sector;
    });

    return {
      departments: allDepartmentData.map(item => ({
        id: item.Department.Department,
        value: item.Department.Department
      })),
      departmentSectorMap
    };
  }

  public static async getEquipmentOwners(): Promise<{
    ownerEmails: string[], 
    departmentsByOwner: {[key: string]: string[]}
  }> {
    try {
      let allEquipmentList: any[] = [];
      
      const equipmentTitleEmail = isDevelopmentMode()? "EquipmentOwner/Title" : "EquipmentOwner/EMail";
      // Initial page request
      let page = await sp.web.lists
        .getByTitle("EquipmentOwner")
        .items.select(
          "Department/Department",
          equipmentTitleEmail
        )
        .expand(
          equipmentTitleEmail,
          "Department/FieldValuesAsText"
        )
        .top(1000)  // Process 100 items at a time
        .getPaged();
  
      // Add first page results
      allEquipmentList = [...allEquipmentList, ...page.results];
  
      // Get subsequent pages if they exist
      while (page.hasNext) {
        page = await page.getNext();
        allEquipmentList = [...allEquipmentList, ...page.results];
      }
  
      console.log(`Total equipment owners retrieved:`, allEquipmentList.length);
      const ownerEmails = allEquipmentList.map(item => isDevelopmentMode()? item.EquipmentOwner.Title: item.EquipmentOwner.EMail);
      const departmentsByOwner = {};
      
      allEquipmentList.forEach(item => {
        if (!departmentsByOwner[isDevelopmentMode()? item.EquipmentOwner.Title: item.EquipmentOwner.EMail]) {
          departmentsByOwner[isDevelopmentMode()? item.EquipmentOwner.Title: item.EquipmentOwner.EMail] = [];
        }
        departmentsByOwner[isDevelopmentMode()? item.EquipmentOwner.Title: item.EquipmentOwner.EMail].push(item.Department.Department);
      });
  
      return {
        ownerEmails: [...new Set(ownerEmails)],
        departmentsByOwner
      };
    } catch (error) {
      console.error('Error in getEquipmentOwners:', error);
      throw new Error(`Failed to fetch equipment owners: ${error.message}`);
    }
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

  public static async getRequestAttachments(requestId: number): Promise<string[]> {
    try {
      // First get the request's GUID
      const request = await sp.web.lists
        .getByTitle("NewEquipmentRequestList")
        .items.getById(requestId)
        .select("GUID")
        .get();

      // Get files from the GUID folder in the document library
      const docLibrary = "NewEquipmentRequestDocs";
      const environment = configService.isDevUser() ? "/sites/ResourceReservationDev" : "/sites/ResourceReservation";
      const folderPath = environment + "/" + docLibrary + "/" + request.GUID;

      const folder = sp.web.getFolderByServerRelativeUrl(folderPath);
      const files = await folder.files.get();

      return files.map(file => file.Name);
    } catch (error) {
      console.error('Error getting attachments:', error);
      return [];
    }
  }

  public static async getEquipmentRequests(from: Date, to: Date, departments: string[], filterColumn: string = 'Department'): Promise<IEquipmentRequest[]> {
   // const fromDateStr = moment(from).startOf('day').utc().format("YYYY-MM-DD[T]00:00:00[Z]");
    //const toDateStr =   moment(to).endOf('day').utc().format("YYYY-MM-DD[T]23:59:59[Z]");
    
    const dateRange = `(FromDate ge datetime'${moment(from).startOf('day').toISOString()}' and ToDate le datetime'${moment(to).endOf('day').toISOString()}')`;
    console.log(`departments:`,departments);
    let filterQuery = dateRange;
    if (departments && departments.length > 0) {
      const deptQuery = departments
        .map(dept => `${filterColumn} eq '${dept.replace(/'/g, "''")}'`)
        .join(' or ');
      filterQuery += ` and (${deptQuery})`;
    }
    console.log(`filterQuery:`,filterQuery);
    let allRequestItems: any[] = [];
    
    // Initial page request
    let page = await sp.web.lists
      .getByTitle("NewEquipmentRequestList")
      .items.select("*")
      .filter(filterQuery)
      .orderBy("Id", false)
      .top(100)  // Process 100 items at a time
      .getPaged();

    // Add first page results
    allRequestItems = [...allRequestItems, ...page.results];

    // Get subsequent pages if they exist
    while (page.hasNext) {
      page = await page.getNext();
      allRequestItems = [...allRequestItems, ...page.results];
    }

      console.log(`requestItems:`,allRequestItems);
    return allRequestItems.map(item => ({
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
      borrowedFrom: item.BorrowedFrom,
      remarks: item.Remarks,
      GUID: item.GUID
    }));
  }
}
