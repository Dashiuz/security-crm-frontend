import {
  Button,
  Grid,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import ResponsiveDetailWrapper from "./ResponsiveDetailWrapper";

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
    <ResponsiveDetailWrapper
      open={open}
      onClose={onClose}
      title={title}
      actions={
        <Box display="flex" justifyContent="flex-end">
          <Button onClick={onClose} variant="outlined" sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cerrar
          </Button>
        </Box>
      }
    >
      <Box>
        {headerContent && (
          <Box sx={{ bgcolor: 'background.default', p: 3, borderRadius: 2, mb: 3 }}>
            {headerContent}
          </Box>
        )}

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper elevation={0} sx={{ bgcolor: 'background.default', borderRadius: 2, p: 3, height: '100%' }}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2, fontWeight: 600, fontSize: '0.75rem' }}>
                Detalles del Registro
              </Typography>
              <Grid container spacing={2}>
                {fields.map((field, index) => (
                  <Grid key={index} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: 600 }}
                      >
                        {field.label}
                      </Typography>
                      <Typography
                        component="div"
                        variant="body2"
                        sx={{ wordBreak: "break-word" }}
                      >
                        {field.value ?? "N/A"}
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </ResponsiveDetailWrapper>
  );
}
