"use client"
import React, { createContext, useContext, useState } from "react";
import { Snackbar, Alert } from "@mui/material";

// Define the shape of the context value without color handling
interface ToastContextType {
  showToast: (message: string, severity: "success" | "error" | "warning" | "info") => void;
}

// Create the context with the correct type
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error" | "warning" | "info">("success");

  // Function to parse the message (if needed for dynamic content)
  const parseMessage = (message: string): string => {
    // Example: Replace placeholders with actual values
    return message.replace("{username}", "John Doe");
  };

  // showToast without color argument, severity will control the color
  const showToast = (message: string, severity: "success" | "error" | "warning" | "info") => {
    const parsedMessage = parseMessage(message); // Parse the message if needed
    setToastMessage(parsedMessage);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  const closeToast = () => {
    setToastOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar 
        open={toastOpen} 
        autoHideDuration={2000} 
        onClose={closeToast} 
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert 
          onClose={closeToast} 
          severity={toastSeverity}  // severity controls the color automatically
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
};
