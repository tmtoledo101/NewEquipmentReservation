import * as React from 'react';
import { Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import { FormControl } from "@material-ui/core";
import styles from '../ViewNewEquipmentRequest.module.scss';

interface ICustomDateTimePickerProps {
  name: string;
  handleChange?: (date: Date, name: string) => void;
}

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = ({ name, handleChange }) => {
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <MuiPickersUtilsProvider utils={DateFnsUtils}>
              <DatePicker
                clearable
                autoOk
                format="MM/dd/yyyy"
                value={field.value ? field.value : null}
                onChange={(e) => {
                  form.setFieldValue(name, e);
                  if (handleChange) {
                    handleChange(e, name);
                  }
                }}
                onBlur={(e) => {
                  form.setFieldTouched(name, true, false);
                  field.onBlur(e);
                }}
                className={styles.width}
              />
            </MuiPickersUtilsProvider>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};
