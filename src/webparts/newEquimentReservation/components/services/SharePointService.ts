import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import "@pnp/sp/sputilities";
import "@pnp/sp/site-groups";
import * as moment from 'moment';
import { arrayToDropDownValues, getCount, formatDate, generateBlockedDates } from '../utils/helpers';
import { IEquipmentData, IDropdownItem } from '../interfaces/INewEquipmentReservation';

export class SharePointService {
  public static async getCurrentUser() {
    return await sp.web.currentUser.get();
  }

  public static async getDepartments(email: string) {
    const deparmentData: any[] = await sp.web.lists
      .getByTitle("EquipUsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
        "Department/Sector"
      )
      .filter(`EmployeeName/Title eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        "EmployeeName/EMail",
      )
      .get();

    if (deparmentData.length === 0) {
      throw new Error('User details is not present in department list, kindly contact admin.');
    }

    const departments = deparmentData.map(item => item.Department.Department);
    const departmentSectorMap = {};
    
    deparmentData.forEach(item => {
      if (!departmentSectorMap[item.Department.Department]) {
        departmentSectorMap[item.Department.Department] = item.Department.Sector;
      }
    });

    return {
      departments: arrayToDropDownValues(departments),
      departmentSectorMap
    };
  }

  public static async getEquipments() {
    const equipmentData: any[] = await sp.web.lists
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
      .get();

    const buildObj = {};
    const buildBorrowedMap = {};
    const buildEquipmentMap = {};

    equipmentData.forEach((item) => {
      if (item.Building) {
        buildObj[item.Building] = item.Building;
      }
      
      if (!buildBorrowedMap[item.Building]) {
        buildBorrowedMap[item.Building] = new Set();
      }
      
      if (!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`]) {
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`] = {};
      }
      
      buildBorrowedMap[item.Building].add({
        borrowed: item.BorrowedFrom.Department,
        exclusiveTo: item.ExclusiveTo
      });
      
      if (!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment]) {
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment] = [];
      }
      
      buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment].push(item);
    });

    return {
      buildingList: arrayToDropDownValues(Object.keys(buildObj)),
      buildBorrowedMap,
      buildEquipmentMap,
      originalEquipmentList: equipmentData
    };
  }

  public static async getTime() {
    const timeData: any[] = await sp.web.lists
      .getByTitle("Time")
      .items.select("Time")
      .get();

    return arrayToDropDownValues(timeData.map(item => item.Time));
  }

  public static async updateEquipmentItem(id: number, data: any) {
    return await sp.web.lists
      .getByTitle('NewEquipment')
      .items.getById(id)
      .update(data);
  }

  public static async createRequest(formData: any, equipmentData: IEquipmentData[], files: File[], requestorEmail: string) {
    const itemLength: any = await sp.web.lists
      .getByTitle('NewEquipmentRequestList')
      .items
      .select("referCount")
      .top(1)
      .orderBy("Id", false)
      .get();

    const count = itemLength.length ? Number(itemLength[0].referCount) : 0;
    const referenceNumber = `OPRS-${moment().year()}${getCount(moment().month())}-${getCount(count, 4)}`;
    const from = moment(formatDate(formData.fromDate));
    const days = moment(formatDate(formData.toDate)).diff(from, 'days', true);

    await this.updateEquipmentStatus(equipmentData, days, from, formData.time);

    for (let i = 0; i <= days; i++) {
      const requestDate = moment(from).add(i, 'days').format('YYYY/MM/DD');
      
      const iar = await sp.web.lists.getByTitle('NewEquipmentRequestList').items.add({
        Title: formData.requestedBy,
        RequestedBy: formData.requestedBy,
        Department: formData.department,
        Building: formData.building,
        ContactNumber: formData.contactNumber,
        Remarks: formData.remarks,
        FromDate: requestDate,
        ToDate: requestDate,
        Time: formData.time,
        EquipmentData: JSON.stringify(equipmentData),
        Status: "For Release",
        BorrowedFrom: formData.borrowedFrom,
        RequestorEmail: requestorEmail,
        referCount: `${count + 1}`,
        ReferenceNumber: referenceNumber,
      });

      if (files.length > 0) {
        const folderPath = "/sites/ResourceReservation/NewEquipmentRequestDocs/" + iar.data.GUID;
        await sp.web.lists.getByTitle("NewEquipmentRequestDocs").rootFolder.folders.add(iar.data.GUID);

        await Promise.all(files.map(file => {
          if (file.size <= 10485760) {
            return sp.web.getFolderByServerRelativeUrl(folderPath)
              .files.add(file.name, file, true)
              .then(result => {
                return result.file.getItem().then(item => {
                  return item.update({ RequestId: iar.data.ID });
                });
              });
          } else {
            return sp.web.getFolderByServerRelativeUrl(folderPath)
              .files.addChunked(file.name, file, data => {
                console.log({ data });
              }, true)
              .then(({ file: fileData }) => fileData.getItem())
              .then(item => {
                return item.update({ RequestId: iar.data.ID });
              });
          }
        }));
      }
    }
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
      const blockedDates = JSON.parse(item[key]) || [];

      if (timeslot === 'WholeDay') {
        const amBlockedDates = JSON.parse(item['BlockedDateAM']) || [];
        const pmBlockedDates = JSON.parse(item['BlockedDatePM']) || [];
        
        // if it is already blocked for AM or PM then we cannot block for whole day
        if (!this.isFirstNotIncluded(requestedDateArray, amBlockedDates) || 
            !this.isFirstNotIncluded(requestedDateArray, pmBlockedDates)) {
          return false;
        }
      }

      if (timeslot === 'AM' || timeslot === 'PM') {
        const wholedaysBlockedDates = JSON.parse(item['BlockedDateWholeDay']) || [];
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

  private static isFirstNotIncluded(firstArray: string[], secondArray: string[]): boolean {
    const data = firstArray.filter(item => secondArray.includes(item));
    return data.length === 0;
  }

  private static async updateEquipmentStatus(equipmentData: IEquipmentData[], days: number, start: moment.Moment, time: string) {
    const currentAssetList = equipmentData.reduce((prev, current) => {
      return [...current.assetNumber, ...prev];
    }, []);

    const blockedDates = generateBlockedDates(start.toDate(), days);
    const key = `BlockedDate${time}`;

    const updatePromises = currentAssetList.map(async (assetNumber) => {
      const equipment = await sp.web.lists
        .getByTitle('NewEquipment')
        .items
        .filter(`AssetNumber eq '${assetNumber}'`)
        .get();

      if (equipment.length > 0) {
        const item = equipment[0];
        const existingDates = item[key] ? JSON.parse(item[key]) : [];
        const newDates = blockedDates.filter(date => !existingDates.includes(date));

        return this.updateEquipmentItem(item.ID, {
          [key]: JSON.stringify([...existingDates, ...newDates])
        });
      }
    });

    await Promise.all(updatePromises);
  }
}
