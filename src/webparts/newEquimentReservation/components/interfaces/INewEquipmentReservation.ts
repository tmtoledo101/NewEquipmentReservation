export interface IEquipmentData {
  equipment: string;
  quantity: string;
  assetNumber: string[];
}

export interface IDropdownItem {
  id: string | number;
  value: string;
}

export interface IEquipmentMap {
  [key: string]: any[];
}

export interface IBuildBorrowedMap {
  [key: string]: Set<{
    borrowed: string;
    exclusiveTo: string;
  }>;
}

export interface IBuildEquipmentMap {
  [key: string]: {
    [key: string]: any[];
  };
}

export interface IDepartmentSectorMap {
  [key: string]: string;
}

export interface IFile {
  name: string;
  size: number;
}

export interface IEquipmentFormValues {
  requestedBy: string;
  department: string;
  building: string;
  contactNumber: string;
  borrowedFrom: string;
  time: string;
  fromDate: Date | null;
  toDate: Date | null;
  equipment: string;
  quantity: string;
  remarks: string;
  currentRecord: number;
  assetNumber: string[];
}
