import * as yup from "yup";
import * as moment from "moment";
import { validateDateTime } from "./helpers";

export const equipmentRequestValidationSchema = yup.object().shape({
  requestedBy: yup.string().required(),
  department: yup.string().required("Department is required"),
  building: yup.string().required("Building is required"),
  contactNumber: yup.number().required("Contact number is required"),
  borrowedFrom: yup.mixed().test(
    "building", 
    "Building selection is required",
    function() {
      const { parent } = this;
      return !!parent.building;
    }
  ).required("Borrowed From is required"),
  status: yup.string(),
  newstatus: yup.string(),
  releasedTo: yup.mixed().test(
    "newstatus", 
    "Released to is required",
    function() {
      const { parent } = this;
      return !(parent.status === 'For Release' && parent.newstatus === 'For Return' && !parent.releasedTo);
    }
  ).nullable(),
  returnedBy: yup.mixed().test(
    "newstatus", 
    "Returned By is required",
    function() {
      const { parent } = this;
      return !(parent.status === 'For Return' && parent.newstatus === 'Completed' && !parent.returnedBy);
    }
  ).nullable(),
  time: yup.string().required("Time is required"),
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
  referenceNumber: yup.string(),
  requestDate: yup.string(),
  equipment: yup.string(),
  quantity: yup.string(),
  remarks: yup.string(),
  releasedBy: yup.string().nullable(),
  releasedRemarks: yup.string().nullable(),
  returnedTo: yup.string().nullable(),
  returnedRemarks: yup.string().nullable(),
  assetNumber: yup.array().of(yup.string()),
});
