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
}

export default function DetailDialog({
  open,
  onClose,
  title,
  fields,
}: DetailDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: "bold" }}>{title}</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          {fields.map((field, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ mb: 1 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", fontWeight: "medium" }}
                >
                  {field.label}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{ fontWeight: "regular", wordBreak: "break-word" }}
                >
                  {field.value ?? "N/A"}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
