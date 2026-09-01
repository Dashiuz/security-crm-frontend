import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
} from "@mui/material";

export interface DetailField {
  label: string;
  value: React.ReactNode;
}

interface DetailDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  fields: DetailField[];
  headerContent?: React.ReactNode;
}

export default function DetailDialog({
  open,
  onClose,
  title,
  fields,
  headerContent,
}: DetailDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: { xs: 2, sm: 2.5 }, m: { xs: 1.5, sm: 3 } } }}
    >
      <DialogTitle sx={{ fontWeight: "bold", fontSize: { xs: "1.1rem", sm: "1.25rem" }, pb: 1 }}>
        {title}
      </DialogTitle>
      <DialogContent dividers sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        {headerContent}
        <Grid container spacing={2}>
          {fields.map((field, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: "medium", fontSize: "0.72rem" }}
                >
                  {field.label}
                </Typography>
                <Typography
                  component="div"
                  variant="body1"
                  sx={{ fontWeight: "regular", wordBreak: "break-word", fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  {field.value ?? "N/A"}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: { xs: 1.5, sm: 2 } }}>
        <Button onClick={onClose} variant="contained" sx={{ width: { xs: "100%", sm: "auto" } }}>
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
