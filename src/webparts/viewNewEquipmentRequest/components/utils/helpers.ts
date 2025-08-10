import * as React from 'react';
import * as moment from "moment";

export interface IDropdownItem {
  id: string;
  value: string;
}

export interface IEquipmentData {
  equipment: string;
  quantity: string;
  assetNumber: string[];
}

export interface INotification {
  show: boolean;
  message: string;
  severity: "success" | "error";
}

export interface IBuildEquipmentMap {
  [key: string]: {
    [id: number]: {
      equipment: string;
      borrowed: string;
      assetNumber: string;
      blockedDateAM: string | null;
      blockedDatePM: string | null;
      blockedDateWholeDay: string | null;
    }
  };
}

export interface IEquipmentItem {
  equipment: string;
  borrowed: string;
  assetNumber: string;
  blockedDateAM: string | null;
  blockedDatePM: string | null;
  blockedDateWholeDay: string | null;
}

export const getAvailableEquipment = (
  equipment: IEquipmentItem[],
  fromDate: Date,
  toDate: Date,
  timeslot: string
): IEquipmentItem[] => {
  return equipment.filter(item => {
    const startDate = moment(fromDate);
    const endDate = moment(toDate);
    let isAvailable = true;
    
    // Check each day in the range
    for (let date = startDate; date.isSameOrBefore(endDate); date.add(1, 'days')) {
      const currentDate = date.format('YYYY/MM/DD');
      
      // Modified checks to use traditional null checks
      if (timeslot === 'AM' && item.blockedDateAM && item.blockedDateAM.includes(currentDate)) {
        isAvailable = false;
        break;
      }
      if (timeslot === 'PM' && item.blockedDatePM && item.blockedDatePM.includes(currentDate)) {
        isAvailable = false;
        break;
      }
      if (timeslot === 'Whole Day' && 
         ((item.blockedDateWholeDay && item.blockedDateWholeDay.includes(currentDate)) || 
          (item.blockedDateAM && item.blockedDateAM.includes(currentDate)) || 
          (item.blockedDatePM && item.blockedDatePM.includes(currentDate)))) {
        isAvailable = false;
        break;
      }
      if ((timeslot === 'AM' || timeslot === 'PM') && 
          item.blockedDateWholeDay && item.blockedDateWholeDay.includes(currentDate)) {
        isAvailable = false;
        break;
      }
    }
    console.log('isAvailable:', isAvailable);
    return isAvailable;
  });
};

export const handleEquipmentSelection = (
  value: string,
  currentEquipments: string[],
  fromDate: Date | null,
  toDate: Date | null,
  timeslot: string,
  building: string,
  borrowedFrom: string,
  buildEquipmentMap: IBuildEquipmentMap
): { 
  isValid: boolean;
  message?: string;
  quantities?: IDropdownItem[];
  assetNumbers?: string[];
} => {
  if (currentEquipments.includes(value)) {
    return {
      isValid: false,
      message: "This equipment is already selected, you cannot re-select again."
    };
  }

  if (!fromDate || !toDate || !timeslot) {
    return {
      isValid: false,
      message: "Please select date and time first"
    };
  }

  const key = `${building}-${borrowedFrom}`;
  const equipmentMap = buildEquipmentMap[key];
  
  if (equipmentMap) {
    const equipment = Object.values(equipmentMap).filter(item => item.equipment === value);
    const availableEquipment = getAvailableEquipment(equipment, fromDate, toDate, timeslot);

    if (availableEquipment.length === 0) {
      return {
        isValid: false,
        message: `This equipment is not available as ${equipment.length} out of ${equipment.length} in inventory is in use on the date and time selected.`
      };
    }

    const quantities = Array.from(
      { length: availableEquipment.length },
      (_, i) => ({ id: (i + 1).toString(), value: (i + 1).toString() })
    );

    const assetNumbers = availableEquipment.map(item => item.assetNumber);

    return {
      isValid: true,
      quantities,
      assetNumbers
    };
  }

  return {
    isValid: false,
    message: "Failed to load equipment options"
  };
};

export const dateConverter = (date: Date, type: number): string => {
  if (type === 1) {
    return moment(date).subtract(1, 'day').toISOString();
  } else if (type === 2) {
    return moment(date).add(1, 'day').toISOString();
  }
  return moment(date).toISOString();
};

export const validateDateTime = (startDateTime: Date, endDateTime: Date): boolean => {
  return startDateTime &&
    moment(startDateTime).isValid() &&
    endDateTime && 
    moment(endDateTime).isValid() &&
    moment(endDateTime).isSameOrAfter(startDateTime);
};

export const formatDate = (date: Date): string => {
  return date ? moment(date).format("MM/DD/YYYY") : null;
};

interface IEquipmentListItem {
  equipment: string;
  quantity: number;
  assetNumber: string[];
}

export const formatEquipmentData = (equipmentData: string): React.ReactNode => {
  try {
    const data: IEquipmentListItem[] = JSON.parse(equipmentData || '[]');
    return data.map((item, index) => 
      React.createElement('pre', 
        { 
          key: index, 
          style: { whiteSpace: 'break-spaces' } 
        },
        `${item.equipment} ${item.quantity} ${item.assetNumber.join(', ')}`
      )
    );
  } catch (error) {
    console.error('Error parsing equipment data:', error);
    return null;
  }
};

export const headerObj = {
  "0": "By Reference No",
  "1": "Past Request",
  "2": "Release Request",
  "3": "Return Request",
};

export const STATUS = {
  APPROVED: "Completed",
  CLOSED: "Cancelled",
  RETURN: "For Return",
  RELEASE: "For Release"
};

export const arrayToDropDownValues = (array: string[]): { id: string; value: string }[] => {
  return array.map(item => ({
    id: item,
    value: item
  }));
};

export const cleanSiteUrl = (url: string): string => {
  try {
    // Method 1: Using URL object
    const urlObj = new URL(url);
    return urlObj.pathname;
  } catch {
    // Method 2: Fallback to string manipulation
    return url.replace(/^https?:\/\/[^\/]+/, '');
    }
};