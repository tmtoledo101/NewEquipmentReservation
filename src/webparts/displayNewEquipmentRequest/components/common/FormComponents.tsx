import * as React from "react";
import { FormControl, TextField, Select, MenuItem, Checkbox, Box, Chip } from "@material-ui/core";
import { Field } from "formik";
import { DatePicker, MuiPickersUtilsProvider } from "@material-ui/pickers";
import DateFnsUtils from "@date-io/date-fns";
import styles from "../DisplayNewEquipmentRequest.module.scss";

interface IDropdownItem {
  id: string | number;
  value: string;
}

interface IDropdownProps {
  items: IDropdownItem[];
  name: string;
  handleChange?: (e: any) => void;
  multiple?: boolean;
  disabled?: boolean;
}

interface ICustomInputProps {
  name: string;
  disabled?: boolean;
}

interface ICustomDateTimePickerProps {
  name: string;
  handleChange?: (e: any, name: string) => void;
  disabled?: boolean;
}

export const CustomInput: React.FC<ICustomInputProps> = ({
  name,
  disabled = false,
}) => {
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <TextField
              value={field.value}
              variant="standard"
              onChange={(e) => {
                field.onChange(e);
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              name={name}
              disabled={disabled}
              className={styles.width}
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
            />
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const Dropdown: React.FC<IDropdownProps> = ({
  items,
  handleChange,
  name,
  multiple,
  disabled,
  ...props
}) => {
  return (
    <Field name={name}>
      {({ field, meta, form }) => {
        const { error, touched } = meta;
        return (
          <FormControl fullWidth>
            <Select
              name={field.name}
              multiple={multiple}
              onChange={(e) => {
                field.onChange(e);
                if (handleChange) {
                  handleChange(e);
                }
              }}
              onBlur={(e) => {
                form.setFieldTouched(name, true, false);
                field.onBlur(e);
              }}
              value={field.value}
              variant="standard"
              disabled={disabled}
              style={{
                border: form.errors[field.name] ? "1px solid red" : "none",
              }}
              renderValue={(selected: any) => {
                if (multiple) {
                  return (
                    <Box sx={{ display: "flex", flexWrap: "wrap" }}>
                      {selected &&
                        selected.map((value: string) => (
                          <Chip
                            key={value}
                            label={value}
                            style={{ margin: "3px", height: "20px" }}
                          />
                        ))}
                    </Box>
                  );
                } else {
                  return selected;
                }
              }}
              {...props}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {items.map((item) => (
                <MenuItem key={item.id} value={item.value}>
                  {multiple && (
                    <Checkbox checked={field.value.indexOf(item.value) > -1} />
                  )}
                  {item.value}
                </MenuItem>
              ))}
            </Select>
            {error && touched ? (
              <span className={styles.error}>{error}</span>
            ) : null}
          </FormControl>
        );
      }}
    </Field>
  );
};

export const CustomDateTimePicker: React.FC<ICustomDateTimePickerProps> = ({
  name,
  handleChange,
  disabled,
}) => {
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
                disabled={disabled}
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
