import { sp } from "@pnp/sp";
import "@pnp/sp/webs";
import "@pnp/sp/lists";
import "@pnp/sp/items";
import { dateFormat } from "../utils/helpers";
import { isDevelopmentMode } from "../../../../shared/utils/enivronmentHelper";
import { configService } from "../../../../shared/services/ConfigurationService";
export class SharePointService {
  public static async getLoggedinUser() {
     const user = await sp.web.currentUser.get();
    
        const currentUser = {
          Email: isDevelopmentMode()? user.Title : user.Email,
          Title: user.Title
        };
        return currentUser;
  }

  public static async getTime() {
    const timeData: any[] = await sp.web.lists
      .getByTitle("Time")
      .items.select("Time")
      .get();
    
    return timeData.map((item, index) => ({
      id: index,
      value: item.Time,
    }));
  }

  public static async getDepartments(email: string) {
    const departmentData: any[] = await sp.web.lists
      .getByTitle("EquipUsersPerDepartment")
      .items.select(
        "EmployeeName/EMail",
        "Department/Department",
      ).filter(isDevelopmentMode()? `EmployeeName/Title eq '${email}'` : `EmployeeName/EMail eq '${email}'`)
      .expand(
        "Department/FieldValuesAsText",
        isDevelopmentMode()?"EmployeeName/Title":"EmployeeName/EMail",
      )
      .get();
  
    const temp = departmentData.map(item => item.Department.Department);
    return temp.map((item, index) => ({
      id: index,
      value: item,
    }));
  }

  public static async getEquipmentsOwner(department: string) {
    const equipmentList: any[] = await sp.web.lists
      .getByTitle("EquipmentOwner")
      .items.select(
        "Department/Department",
        "EquipmentOwner/EMail"
      )
      .expand(
        "EquipmentOwner/EMail",
        "Department/FieldValuesAsText"
      ).filter(`Department/Department eq '${department}'`)
      .get();

    const equipmentOwnerList = {};
    equipmentList.forEach(item => {
      equipmentOwnerList[item.EquipmentOwner.EMail] = item.EquipmentOwner.EMail;
    });
    return Object.keys(equipmentOwnerList);
  }

  public static async getFiles(guid: string, siteRelativeUrl: string) {
    let docs = await sp.web
      .getFolderByServerRelativeUrl(
        siteRelativeUrl + "/NewEquipmentRequestDocs/" + guid
      )
      .files.select("*")
      .top(5000)
      .expand("ListItemAllFields")
      .get();

    return docs.map((row) => row.Name);
  }

  public static async getEquipments(building: string, borrowedFrom: string) {
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
      ).expand("BorrowedFrom/FieldValuesAsText")
      .get();

    const buildObj = {};
    const buildBorrowedMap = {};
    const buildEquipmentMap = {};
    
    equipmentData.forEach((item) => {
      if (item.Building) {
        buildObj[item.Building] = item.Building;
      }
      if(!buildBorrowedMap[item.Building]) {
        buildBorrowedMap[item.Building] = new Set();
      }
      if(!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`]){
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`] = {};
      }
      buildBorrowedMap[item.Building].add(item.BorrowedFrom.Department);
      if(!buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment]) {
        buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment] = [];
      }
      buildEquipmentMap[`${item.Building}-${item.BorrowedFrom.Department}`][item.Equiupment].push(item);
    });

    const buildingList = Object.keys(buildObj).map((item, index) => ({
      id: index,
      value: item,
    }));

    const equipmentData1 = buildEquipmentMap[`${building}-${borrowedFrom}`];

    return {
      buildingList,
      buildBorrowedMap,
      buildEquipmentMap,
      equipmentData: equipmentData1
    };
  }

  public static async updateEquipmentReturnStatus(
    currentAssetList: string[],
    building: string,
    borrowedFrom: string,
    releasedDate: string,
    timeslot: string
  ) {
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
        "BlockedDateWholeDay"
      ).expand("BorrowedFrom/FieldValuesAsText")
      .filter(`Building eq '${building}' and BorrowedFrom/Department eq '${borrowedFrom}'`)
      .get();

    const key = `BlockedDate${timeslot}`;
    const filterEquipment = equipmentData.filter(item => currentAssetList.indexOf(item.AssetNumber) > -1);
    const blockedDates = JSON.parse(filterEquipment[0][key]) || [];
    const blockedDatesFilter = blockedDates.filter(item => item !== releasedDate);

    const updatePromises = filterEquipment.map(item => {
      const data = {
        [key]: JSON.stringify(blockedDatesFilter)
      };
      return sp.web.lists.getByTitle('NewEquipment').items.getById(item.ID).update(data);
    });

    await Promise.all(updatePromises);
  }

  public static async updateRequest(id: number, data: any) {
    await sp.web.lists.getByTitle('NewEquipmentRequestList').items.getById(id).update(data);
  }

  public static async uploadFiles(guid: string, files: File[]) {
    const docLibrary = "NewEquipmentRequestDocs";
    const f = configService.isDevUser() ? "/sites/ResourceReservationDev" :"/sites/ResourceReservation" + "/" + docLibrary +"/" + guid;
    await sp.web.lists.getByTitle(docLibrary).rootFolder.folders.getByName(guid).delete();
    await sp.web.lists.getByTitle(docLibrary).rootFolder.folders.add(guid);

    const uploadPromises = files.map(file => {
      if (file.size <= 10485760) {
        return sp.web
          .getFolderByServerRelativeUrl(f)
          .files.add(file.name, file, true)
          .then(result => result.file.getItem())
          .then(item => item.update({ RequestId: guid }));
      } else {
        return sp.web
          .getFolderByServerRelativeUrl(f)
          .files.addChunked(file.name, file)
          .then(({ file: uploadedFile }) => uploadedFile.getItem())
          .then(item => item.update({ RequestId: guid }));
      }
    });
    
    await Promise.all(uploadPromises);
    
  }
}
