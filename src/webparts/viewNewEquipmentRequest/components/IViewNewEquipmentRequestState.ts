import { IEquipmentRequest } from "./interfaces/IEquipmentRequest";

export interface IViewNewEquipmentRequestState {
  tabValue: number;
  menuTabs: string[];
  referenceNumberList: IEquipmentRequest[];
  pastRequestList: IEquipmentRequest[];
  releaseRequestList: IEquipmentRequest[];
  returnRequestList: IEquipmentRequest[];
  department: string[];
}
