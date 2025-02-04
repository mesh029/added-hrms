"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@mui/material";
import { DataGrid, GridRowsProp, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

// Example options for select fields
const managers = ["Manager 1", "Manager 2", "Manager 3"];
const locations = ["Location 1", "Location 2", "Location 3"];
const departments = ["HR", "Finance", "IT", "Sales"];
const facilities = ["A", "B", "C", "D"];

type CustomGridColDef = GridColDef & {
  type?: "singleSelect" | "date";
  valueOptions?: string[];
  required?: boolean;
};

const roleFields: Record<string, CustomGridColDef[]> = {
  STAFF: [
    { field: "name", headerName: "Name", editable: true, width: 150, required: true },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200, required: true },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "location", headerName: "location", editable: true, width: 150, type: "singleSelect", valueOptions: locations },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments, required: true },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers, required: true },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: "date", required: true },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: "date" },
    { field: "address", headerName: "Address", editable: true, width: 150 },
    { field: "leaveDays", headerName: "Leave Days", editable: true, width: 150 },
  ],
  INCHARGE: [
    { field: "name", headerName: "Name", editable: true, width: 150, required: true },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200, required: true },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "location", headerName: "location", editable: true, width: 150, type: "singleSelect", valueOptions: locations },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments, required: true },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers, required: true },
  ],
  STAFF_PROJECT: [
    { field: "name", headerName: "Name", editable: true, width: 150, required: true },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200, required: true },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "location", headerName: "location", editable: true, width: 150, type: "singleSelect", valueOptions: locations },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments, required: true },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers, required: true },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: "date", required: true },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: "date" },
    { field: "address", headerName: "Address", editable: true, width: 150 },
  ],
  HR: [
    { field: "name", headerName: "Name", editable: true, width: 150, required: true },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200, required: true },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "location", headerName: "location", editable: true, width: 150, type: "singleSelect", valueOptions: locations },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments, required: true },
  ],
  PADM: [
    { field: "name", headerName: "Name", editable: true, width: 150, required: true },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200, required: true },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "location", headerName: "location", editable: true, width: 150, type: "singleSelect", valueOptions: locations },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments, required: true },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers, required: true },
  ],
};

//
// Update ErrorType to allow dynamic keys
//
type ErrorType = {
  email?: string;
  name?: string;
  department?: string;
  manager?: string;
  hireDate?: string;
  endDate?: string;
  [key: string]: string | undefined;
};

type Errors = {
  [key: string]: ErrorType;
};

export default function EmployeeManagement() {
  // Store all rows (from all roles) in state.
  const [rows, setRows] = useState<GridRowsProp>(() => []);
  const [errors, setErrors] = useState<Errors>({});
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });
  const [role, setRole] = useState<keyof typeof roleFields>("STAFF");

  // Instead of filtering the rows state (which would remove them), derive filteredRows here.
  const filteredRows = useMemo(() => {
    return rows.filter((row: any) => row.role === role);
  }, [rows, role]);

  // Generate columns based on the selected role.
  const columns = useMemo<CustomGridColDef[]>(() => {
    return roleFields[role].map((col) => ({
      ...col,
      renderCell: (params: any) => {
        let cellValue = params.value;
        if (cellValue instanceof Date) {
          cellValue = cellValue.toLocaleDateString();
        } else if (cellValue === undefined || cellValue === null) {
          cellValue = "";
        }
        const rowErrors = errors[params.row.id] as ErrorType | undefined;
        const hasError = rowErrors && rowErrors[params.field as keyof ErrorType];
        const requiredNotFilled = col.required && (!cellValue || cellValue === "");
        const inlineStyle =
          hasError || requiredNotFilled ? { backgroundColor: "#ffe6e6" } : {};
        return <div style={inlineStyle}>{cellValue}</div>;
      },
    }));
  }, [role, errors]);

  useEffect(() => {
    console.log("All rows updated:", rows);
  }, [rows]);



  const handleAddRow = () => {
    setRows((prevRows) => {
      const newRow = {
        id: Date.now(),
        ...Object.fromEntries(columns.map((col) => [col.field, ""])),
        role, // Automatically assign the current role to the new row.
      };
      return [...prevRows, newRow];
    });
  };
  const handleRowChange = (updatedRow: any) => {
    updatedRow.role = role; // ensure row role remains current
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
    const newRowErrors = validateRow(updatedRow);
    setErrors((prevErrors) => {
      const updatedErrors = { ...prevErrors };
      if (Object.keys(newRowErrors).length === 0) {
        delete updatedErrors[updatedRow.id];
      } else {
        updatedErrors[updatedRow.id] = newRowErrors;
      }
      return updatedErrors;
    });
  };

  const handleClearRows = () => {
    setRows([]);
    setErrors({});
  };

  const validateRow = (row: any) => {
    const errorObj: Partial<ErrorType> = {};
    const currentFields = roleFields[role];
    currentFields.forEach((col) => {
      if (col.required && (!row[col.field] || row[col.field] === "")) {
        errorObj[col.field] = `${col.headerName} is required`;
      }
    });
    if (row.name && row.name.length < 3) {
      errorObj.name = "Name should be at least 3 characters long";
    }
    if (row.email) {
      if (!/\S+@\S+\.\S+/.test(row.email)) {
        errorObj.email = "Please enter a valid email address";
      }
      if (rows.some((r) => r.email === row.email && r.id !== row.id)) {
        errorObj.email = "Email must be unique";
      }
    }
    if (row.hireDate === "") {
      errorObj.hireDate = "Hire date is required";
    }
    if (row.hireDate && row.endDate && new Date(row.endDate) < new Date(row.hireDate)) {
      errorObj.endDate = "End date cannot be earlier than hire date";
    }
    return errorObj;
  };

  const handleSubmit = async () => {
    const allErrors: Errors = {};
    rows.forEach((row) => {
      const rowErrors = validateRow(row);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[row.id] = rowErrors;
      }
    });
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      alert("Errors found! Please check the highlighted fields.");
      console.log("Errors found", allErrors);
      return;
    }
    try {
      const response = await fetch("/api/users/bulkupload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ users: rows }),
      });
      if (!response.ok) {
        throw new Error("Failed to upload data");
      }
      const data = await response.json();
      alert("Data successfully uploaded! 🎉");
      console.log(data);
    } catch (error) {
      alert("Oops! Something went wrong: \nPlease try again later. 😞");
      console.error(error);
    }
  };

  const getRowClassName = (params: any) => {
    const rowErrors = errors[params.id];
    return rowErrors ? "error-row" : "";
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex flex-col items-center justify-center flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4">Employee Management</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
          Add or edit employee data based on their role.
        </p>
        <TextField
          select
          label="Select Role"
          value={role}
          onChange={(e) => setRole(e.target.value as keyof typeof roleFields)}
          SelectProps={{ native: true }}
          variant="outlined"
          className="w-60 mb-4"
        >
          {Object.keys(roleFields).map((roleOption) => (
            <option key={roleOption} value={roleOption}>
              {roleOption}
            </option>
          ))}
        </TextField>
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96" tabIndex={0} style={{ outline: "none" }}>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5]}
                processRowUpdate={(newRow) => {
                  handleRowChange(newRow);
                  return newRow;
                }}
                getRowClassName={getRowClassName}
              />
            </div>
            {Object.entries(errors).map(([rowId, errorObj]) => {
              const rowNumber = filteredRows.findIndex((row: any) => row.id.toString() === rowId) + 1;
              return (
                <div key={rowId} style={{ marginTop: "1rem", padding: "0.5rem", border: "1px solid red" }}>
                  <strong>Row {rowNumber}</strong>
                  <ul>
                    {Object.entries(errorObj).map(([field, errorMsg]) => (
                      <li key={field}>
                        <strong>{field}:</strong> {errorMsg}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </CardContent>
        </Card>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleAddRow}>Add Row</Button>
          <Button onClick={handleSubmit} disabled={rows.length === 0}>
            Submit Data
          </Button>
          <Button onClick={handleClearRows} variant="destructive">
            Clear Table
          </Button>
        </div>
      </main>
    </div>
  );
}
