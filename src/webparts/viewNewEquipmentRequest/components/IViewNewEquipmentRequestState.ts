import { IEquipmentRequest } from "./interfaces/IEquipmentRequest";

interface INotification {
  show: boolean;
  message: string;
  severity: "success" | "error";
}

export interface IViewNewEquipmentRequestState {
  tabValue: number;
  menuTabs: string[];
  referenceNumberList: IEquipmentRequest[];
  pastRequestList: IEquipmentRequest[];
  releaseRequestList: IEquipmentRequest[];
  returnRequestList: IEquipmentRequest[];
  department: string[];
  showViewModal: boolean;
  selectedRecord: IEquipmentRequest | null;
  notification: INotification;
}
