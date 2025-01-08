import * as yup from 'yup';
import * as moment from 'moment';

export const validateDateTime = (startDateTime: Date | string | null, endDateTime: Date | string | null): boolean =>
  startDateTime !== null &&
  moment(startDateTime).isValid() &&
  endDateTime !== null &&
  moment(endDateTime).isValid() &&
  moment(endDateTime).isSameOrAfter(startDateTime);

export const equipmentReservationSchema = yup.object().shape({
  requestedBy: yup.string().required(),
  department: yup.string().required("Department is required"),
  building: yup.string().required("Building is required"),
  contactNumber: yup.number().required("Contact number is required"),
  borrowedFrom: yup.mixed()
    .test(
      "building",
      "Building selection is required",
      function() {
        const { parent } = this;
        return !!parent.building;
      }
    )
    .required("Borrowed From is required"),
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
});
