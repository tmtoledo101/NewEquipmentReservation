import * as React from "react";
import { Grid, Chip } from "@material-ui/core";
import { DropzoneArea } from "material-ui-dropzone";
import AttachFileIcon from "@material-ui/icons/AttachFile";
import styles from "./EquipmentReservationForm.module.scss";

interface IFileListProps {
  files: File[];
  existingFiles: string[];
  onFileChange: (files: File[]) => void;
  onFileDownload: (fileName: string) => void;
  disabled?: boolean;
}

export const FileList: React.FC<IFileListProps> = ({
  files,
  existingFiles,
  onFileChange,
  onFileDownload,
  disabled = false,
}) => {
  return (
    <>
      <Grid item xs={6}>
        <div className={styles.label} style={{ textAlign: "left" }}>
          Attachment Here
        </div>
      </Grid>
      <Grid item xs={6}></Grid>
      <Grid item xs={12}>
        {!disabled ? (
          <DropzoneArea
            initialFiles={existingFiles}
            acceptedFiles={[
              ".docx",
              ".xlsx",
              ".xls",
              "doc",
              ".mov",
              "image/*",
              "video/*",
              "application/*",
            ]}
            showPreviews={true}
            showFileNames={true}
            maxFileSize={70000000}
            filesLimit={10}
            showPreviewsInDropzone={false}
            useChipsForPreview
            dropzoneClass={styles.dropZone}
            previewGridProps={{
              container: { spacing: 1, direction: "row" },
            }}
            previewChipProps={{
              classes: { root: styles.previewChip },
            }}
            previewText="Selected files"
            onChange={onFileChange}
            dropzoneText="Attach general document here"
          />
        ) : (
          <div>
            {existingFiles &&
              existingFiles.map((value) => (
                <Chip
                  key={value}
                  label={value}
                  icon={<AttachFileIcon />}
                  style={{ margin: "3px", height: "20px" }}
                  onClick={() => onFileDownload(value)}
                />
              ))}
          </div>
        )}
      </Grid>
    </>
  );
};
