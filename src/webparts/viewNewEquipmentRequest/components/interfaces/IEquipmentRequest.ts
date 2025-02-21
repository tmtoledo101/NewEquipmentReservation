export interface IEquipmentRequest {
  ID: number;
  referenceNumber: string;
  requestedBy: string;
  department: string;
  contactNumber: string;
  building: string;
  borrowedFrom: string;
  time: string;
  fromDate: string;
  toDate: string;
  status: string;
  remarks?: string;
  equipment: string;
  quantity?: string;
  assetNumber?: string[];
  returnedBy?: string;
  returnedTo?: string;
  returnedDate?: string;
  releasedTo?: string;
  releasedBy?: string;
  releasedDate?: string;
}
