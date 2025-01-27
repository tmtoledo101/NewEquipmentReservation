import { IFormValues } from "./IFormValues";

export interface IEquipmentData {
  equipment: string;
  quantity: string;
  assetNumber: string[];
}

export interface IExtendedFormValues extends IFormValues {
  equipmentData: IEquipmentData[];
  files: File[];
}
