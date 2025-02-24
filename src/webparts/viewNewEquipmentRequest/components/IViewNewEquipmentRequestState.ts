import { IEquipmentRequest } from "./interfaces/IEquipmentRequest";

export interface IViewNewEquipmentRequestState {
  showModal: boolean;
  tabValue: number;
  menuTabs: string[];
  referenceNumberList: IEquipmentRequest[];
  pastRequestList: IEquipmentRequest[];
  releaseRequestList: IEquipmentRequest[];
  returnRequestList: IEquipmentRequest[];
  department: string[];
  departmentSectorMap: { [key: string]: string };
  isLoading: boolean;
}
