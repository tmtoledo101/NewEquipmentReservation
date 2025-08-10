import * as yup from "yup";
import * as moment from "moment";
import { validateDateTime } from "./helpers";

export const equipmentReservationSchema = yup.object().shape({
  requestedBy: yup.string().required('Requested By Required'),
  department: yup.string().required('Department is Required'),
  contactNumber: yup.string().required('Contact Number is Required'),
  building: yup.string().required('Building is Required'),
  borrowedFrom: yup.string().required('Borrowed From is Required'),
  time: yup.string().required('Time is Required'),
  status: yup.string()
    .required('Status is Required')
    .oneOf(['For Return', 'Completed', 'Cancelled'], 'Invalid status value'),
  fromDate: yup.date().required('From Date is Required').nullable(),
  toDate: yup.date()
    .required('To Date is Required')
    .nullable()
    .min(yup.ref('fromDate'), 'End date must be after start date'),
  remarks: yup.string(),
  // Release fields
  releasedTo: yup.string().when('status', {
    is: 'For Return',
    then: yup.string().required('Released To is Required'),
    otherwise: yup.string()
  }),
  releasedBy: yup.string().when('status', {
    is: 'For Return',
    then: yup.string().required('Released By is Required'),
    otherwise: yup.string()
  }),
  releaseRemarks: yup.string().when('status', {
    is: 'For Return',
    then: yup.string(),
    otherwise: yup.string()
  }),
  // Return fields
  returnedTo: yup.string().when('status', {
    is: 'Completed',
    then: yup.string().required('Returned To is Required'),
    otherwise: yup.string()
  }),
  returnedBy: yup.string().when('status', {
    is: 'Completed',
    then: yup.string().required('Returned By is Required'),
    otherwise: yup.string()
  }),
  returnRemarks: yup.string().when('status', {
    is: 'Completed',
    then: yup.string(),
    otherwise: yup.string()
  })
});

export const searchFormValidationSchema = yup.object().shape({
  fromDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .required("From date is required");
    }
    return yup.string().required("From date is required");
  }),
  toDate: yup.lazy((data) => {
    if (data) {
      return yup
        .mixed()
        .test(
          "Is date valid",
          "Enter valid date",
          (val) => val && moment(val).isValid()
        )
        .when("fromDate", (fromDate, schema) => {
          return schema.test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range, fromDate < toDate",
          });
        })
        .required("toDate is required");
    }
    return yup.mixed().when("fromDate", (fromDate, schema) => {
      if (fromDate) {
        return schema
          .test({
            test: (toDate) => validateDateTime(fromDate, toDate),
            message: "Invalid date range",
          })
          .required("toDate is required");
      }
      return yup.mixed().required("toDate is required");
    });
  }),
});
