// components/Toast.tsx
import { Snackbar, Alert, AlertColor } from "@mui/material";

interface ToastProps {
  open: boolean;
  onClose: () => void;
  message: string;
  severity?: AlertColor;  // "success" | "info" | "warning" | "error"
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ open, onClose, message, severity = "success", duration = 3000 }) => {
  return (
    <Snackbar
      open={open}
      autoHideDuration={duration}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
