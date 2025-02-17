import * as moment from "moment";

export const RETURN = 'For Return';
export const COMPLETED = 'Completed';
export const CANCELLED = 'Cancelled';
export const RELEASE = 'For Release';

export const statusMapper = {
  'For Return': "Release the equipment",
  'Completed': "Return the equipment",
  'Cancelled': "Cancel the equipment reservation request",
};

export const isFirstNotIncluded = (firstArray: string[], secondArray: string[]) => {
  const data = firstArray.filter(item => secondArray.includes(item));
  return data.length === 0;
};

export const validateDateTime = (startDateTime: string, endDateTime: string) =>
  startDateTime &&
  moment(startDateTime).isValid() &&
  endDateTime &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isSameOrAfter(startDateTime);

export const dateFormat = (date: string | Date) => {
  return moment(date).format("MM/DD/yyyy");
};

export const arrayToDropDownValues = (array: string[]) =>
  array.map((item, index) => ({ id: index, value: item }));

export const mapArrayToObject = (obj: { [key: string]: any }) =>
  Object.keys(obj).map((item) => {
    return { id: item, value: item };
  });
