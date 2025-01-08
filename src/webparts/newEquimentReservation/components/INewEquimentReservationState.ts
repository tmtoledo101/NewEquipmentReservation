import { IDropdownItem, IEquipmentData } from './interfaces/INewEquipmentReservation';

export interface INewEquimentReservationState {
  departmentList: IDropdownItem[];
  buildingList: IDropdownItem[];
  toggler: boolean;
  timeList: IDropdownItem[];
  borrowedFromList: IDropdownItem[];
  showEquipmentDialog: boolean;
  equipmentList: IDropdownItem[];
  quantityList: IDropdownItem[];
  equipmentData: IEquipmentData[];
  saveDialog: boolean;
  files: File[];
  isSavingDone: boolean;
  isSavingFailure: boolean;
  failureMessage: string;
  requestorEmail: string;
  assetList: string[];
  equipmentError: string;
  savingStart: boolean;
  isFssManaged: boolean;
}
