export interface IDisplayNewEquipmentRequestProps {
  description: string;
  siteUrl: string;
  siteRelativeUrl: string;
}

export interface IDropdownItem {
  id: string | number;
  value: string;
}

export interface IEquipmentData {
  equipment: string;
  quantity: string;
  assetNumber: string[];
}

export interface IDisplayNewEquipmentRequestState {
  departmentList: IDropdownItem[];
  buildingList: IDropdownItem[];
  toggler: boolean;
  timeList: IDropdownItem[];
  borrowedFromList: IDropdownItem[];
  showEquipmentDialog: boolean;
  equipmentList: IDropdownItem[];
  quantityList: IDropdownItem[];
  assetList: string[];
  equipmentData: IEquipmentData[];
  saveDialog: boolean;
  files: File[];
  isSavingDone: boolean;
  isSavingFailure: boolean;
  isEdit: boolean;
  requestStatus: string;
  requestor: string;
  guid: string;
  Files: string[];
  equipmentOwner: string[];
  currentUser: string;
  newStatus: string;
  saveStart: boolean;
  equipmentError: string;
  failureMessage: string;
}
