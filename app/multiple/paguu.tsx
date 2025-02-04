"use client"
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@mui/material";
import { DataGrid, GridRowsProp, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

// Predefined data for managers, locations, and departments
const managers = ["Manager 1", "Manager 2", "Manager 3"];
const locations = ["Location 1", "Location 2", "Location 3"];
const departments = ["HR", "Finance", "IT", "Sales"];
const facilities = ["A", "B", "C", "D"];

// Define a custom type for the columns
type CustomGridColDef = GridColDef & {
  type?: 'singleSelect' | 'date';
  valueOptions?: string[];
};

const roleFields: Record<string, CustomGridColDef[]> = {
  STAFF: [
    { field: "name", headerName: "Name", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200 },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: 'singleSelect', valueOptions: facilities },
    { field: "department", headerName: "Department", editable: true, width: 150, type: 'singleSelect', valueOptions: departments },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: 'singleSelect', valueOptions: managers },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: 'date' },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: 'date' },
  ],
  INCHARGE: [
    { field: "name", headerName: "Name", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200 },
    { field: "reportsTo", headerName: "Reports To", editable: true, width: 150, type: 'singleSelect', valueOptions: managers },
    { field: "facility", headerName: "Facility", editable: true, width: 150 },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: 'date' },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: 'date' },
  ],
  EMPLOYEE: [
    { field: "name", headerName: "Name", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200 },
    { field: "department", headerName: "Department", editable: true, width: 150, type: 'singleSelect', valueOptions: departments },
    { field: "location", headerName: "Location", editable: true, width: 150, type: 'singleSelect', valueOptions: locations },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: 'date' },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: 'date' },
  ],
};

export default function EmployeeManagement() {
  const [role, setRole] = useState<keyof typeof roleFields>("STAFF");
  const [rows, setRows] = useState<GridRowsProp>([]);
  const [errors, setErrors] = useState<any>({}); // For form validation errors
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const columns = useMemo<CustomGridColDef[]>(() => roleFields[role], [role]);

  const validateRow = (row: any) => {
    const errors: any = {};
    if (!row.name || row.name.length < 3) {
      errors.name = "Name should be at least 3 characters long";
    }
    if (!row.email || !/\S+@\S+\.\S+/.test(row.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (rows.some((r) => r.email === row.email && r.id !== row.id)) {
      errors.email = "Email must be unique";
    }
    if (!row.department) {
      errors.department = "Department is required";
    }
    if (!row.manager) {
      errors.manager = "Manager is required";
    }
    if (!row.hireDate) {
      errors.hireDate = "Hire date is required";
    }
    if (row.endDate && new Date(row.endDate) < new Date(row.hireDate)) {
      errors.endDate = "End date cannot be earlier than hire date";
    }
    return errors;
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    event.preventDefault();
    const pastedData = event.clipboardData.getData("text/plain");
    const rowsArray = pastedData
      .split("\n")
      .filter((row) => row.trim() !== "")
      .map((row, index) => {
        const values = row.split("\t");
        const rowObject: any = {};
        columns.forEach((col, colIndex) => {
          rowObject[col.field] = values[colIndex] || "";
        });
        return { id: Date.now() + index, ...rowObject }; // Use unique IDs
      });
    setRows((prevRows: any) => [...prevRows, ...rowsArray]);
  };


const handleAddRow = () => {
  setRows((prevRows) => [
    ...prevRows, // Preserve existing rows and their values
    {
      id: Date.now(), // Ensure a unique ID
      ...Object.fromEntries(columns.map((col) => [col.field, ""])), // Create an empty row based on column fields
    },
  ]);
};


  const handleClearRows = () => {
    setRows([]);
  };

  const handleSubmit = async () => {
    const allErrors: any = {};

    rows.forEach((row, index) => {
      const rowErrors = validateRow(row);
      if (Object.keys(rowErrors).length > 0) {
        allErrors[index] = rowErrors;
      }
    });

    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      return;
    }

    try {
      const formattedRows = rows.map((row) => ({
        name: row.name,
        email: row.email,
        role: role,
        department: row.department,
        address: row.address || '',
        hireDate: row.hireDate || null,
        endDate: row.endDate || null,
        reportsTo: row.reportsTo || '',
        manager: row.manager || '',
        weight: row.weight || '',
        height: row.height || '',
        leaveDays: row.leaveDays || '',
        phone: row.phone ? row.phone.toString().replace(/\D/g, '') : null,
        pay: row.pay || '',
        location: row.location || ''
      }));

      const response = await fetch('/api/employee/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ users: formattedRows }),
      });

      const result = await response.json();
      if (response.ok) {
        alert("Data submitted successfully!");
        console.log(result);
      } else {
        alert("Failed to submit data: " + result.error);
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("An error occurred while submitting the data.");
    }
  };

  const getRowClassName = (params: any) => {
    const rowErrors = errors[params.id];
    if (rowErrors) {
      return 'error-row';
    }
    return '';
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex flex-col items-center justify-center flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4">Employee Management</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
          Add or edit employee data based on their role. Paste data, edit directly, or submit all at once.
        </p>
        <div className="mb-6">
          <TextField
            select
            label="Select Role"
            value={role}
            onChange={(e) => setRole(e.target.value as keyof typeof roleFields)}
            SelectProps={{ native: true }}
            variant="outlined"
            className="w-60"
          >
            {Object.keys(roleFields).map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {roleOption}
              </option>
            ))}
          </TextField>
        </div>
        <Card className="w-full max-w-5xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Employee Table</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="h-96"
              onPaste={handlePaste}
              tabIndex={0}
              style={{ outline: "none" }}
            >
              <DataGrid
                rows={rows}
                columns={columns}
                checkboxSelection
                disableRowSelectionOnClick
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[5]}
                getRowClassName={getRowClassName}
              />
            </div>
          </CardContent>
        </Card>
        <div className="mt-4 flex gap-4">
          <Button onClick={handleAddRow}>Add Row</Button>
          <Button onClick={handleClearRows} variant="destructive">
            Clear Table
          </Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </div>
      </main>
    </div>
  );
}