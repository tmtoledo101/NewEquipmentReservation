import * as React from 'react';
import { Grid, Button } from "@material-ui/core";
import { Formik } from "formik";
import { CustomDateTimePicker } from './CustomDateTimePicker';
import { searchFormValidationSchema } from '../utils/validation';
import styles from '../ViewNewEquipmentRequest.module.scss';

interface ISearchFormProps {
  onSearch: (fromDate: Date, toDate: Date) => void;
}

interface ISearchFormValues {
  fromDate: Date | null;
  toDate: Date | null;
}

export const SearchForm: React.FC<ISearchFormProps> = ({ onSearch }) => {
  const initialValues: ISearchFormValues = {
    fromDate: null,
    toDate: null
  };

  const handleSearch = (fromDate: Date | null, toDate: Date | null) => {
    if (fromDate && toDate) {
      onSearch(fromDate, toDate);
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={searchFormValidationSchema}
      onSubmit={(values) => {
        console.log(values);
      }}
    >
      {(formik) => (
        <div>
          <Grid container spacing={4}>
            <Grid item xs={4}>
              <div className={styles.width}>
                <div className={styles.label}>From</div>
                <CustomDateTimePicker name="fromDate" />
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className={styles.width}>
                <div className={styles.label}>To</div>
                <CustomDateTimePicker name="toDate" />
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className={styles.width}>
                <Button
                  type="button"
                  variant="contained"
                  onClick={() =>
                    handleSearch(
                      formik.values.fromDate,
                      formik.values.toDate
                    )
                  }
                  style={{
                    marginTop: "15px",
                  }}
                  color="primary"
                  disabled={!(formik.values.fromDate && formik.values.toDate)}
                >
                  Search
                </Button>
              </div>
            </Grid>
          </Grid>
        </div>
      )}
    </Formik>
  );
};
