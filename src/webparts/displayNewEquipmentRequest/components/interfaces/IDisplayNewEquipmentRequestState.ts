export interface IDisplayNewEquipmentRequestState {
  departmentList: Array<{ id: string | number; value: string }>;
  buildingList: Array<{ id: string | number; value: string }>;
  toggler: boolean;
  timeList: Array<{ id: string | number; value: string }>;
  borrowedFromList: Array<{ id: string | number; value: string }>;
  showEquipmentDialog: boolean;
  equipmentList: Array<{ id: string | number; value: string }>;
  quantityList: Array<{ id: string | number; value: string }>;
  assetList: string[];
  equipmentData: Array<{
    equipment: string;
    quantity: string;
    assetNumber: string[];
  }>;
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
