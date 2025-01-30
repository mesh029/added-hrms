"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TextField } from "@mui/material";
import { DataGrid, GridRowsProp, GridColDef, GridPaginationModel } from "@mui/x-data-grid";

const managers = ["Manager 1", "Manager 2", "Manager 3"];
const locations = ["Location 1", "Location 2", "Location 3"];
const departments = ["HR", "Finance", "IT", "Sales"];
const facilities = ["A", "B", "C", "D"];

type CustomGridColDef = GridColDef & {
  type?: "singleSelect" | "date";
  valueOptions?: string[];
};

const roleFields: Record<string, CustomGridColDef[]> = {
  STAFF: [
    { field: "name", headerName: "Name", editable: true, width: 150 },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200 },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers },
    { field: "hireDate", headerName: "Hire Date", editable: true, width: 150, type: "date" },
    { field: "endDate", headerName: "End Date", editable: true, width: 150, type: "date" },
    { field: "address", headerName: "Address", editable: true, width: 150 },


  ],
  INCHARGE: [
    { field: "name", headerName: "Name", editable: true, width: 150 },
    { field: "role", headerName: "Role", editable: true, width: 150 },
    { field: "email", headerName: "Email", editable: true, width: 200 },
    { field: "title", headerName: "Title", editable: true, width: 200 },
    { field: "facility", headerName: "Facility", editable: true, width: 150, type: "singleSelect", valueOptions: facilities },
    { field: "department", headerName: "Department", editable: true, width: 150, type: "singleSelect", valueOptions: departments },
    { field: "manager", headerName: "Manager", editable: true, width: 150, type: "singleSelect", valueOptions: managers },

  ],
};

export default function EmployeeManagement() {
  const [role, setRole] = useState<keyof typeof roleFields>("STAFF");
  const [rows, setRows] = useState<GridRowsProp>(() => []);
  const [errors, setErrors] = useState<any>({});

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 5,
  });

  const columns = useMemo<CustomGridColDef[]>(() => roleFields[role], [role]);

  useEffect(() => {
    console.log("Rows updated:", rows);
  }, [rows]);

  const handleAddRow = () => {
    setRows((prevRows) => {
      const newRow = {
        id: Date.now(),
        ...Object.fromEntries(columns.map((col) => [col.field, ""])), // Keep existing fields
      };
      return [...prevRows, newRow]; // Append new row while keeping existing ones
    });
  };

  const handleRowChange = (updatedRow: any) => {
    // Ensure the role value is updated correctly when the row is changed
    updatedRow.role = role;
  
    setRows((prevRows) =>
      prevRows.map((row) => (row.id === updatedRow.id ? updatedRow : row))
    );
  };

  

  const handleClearRows = () => {
    setRows([]);
  };
  const handleSubmit = async () => {
    try {
      const response = await fetch('/api/users/bulkupload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: rows })
      });
  
      if (!response.ok) {
        throw new Error("Failed to upload data");
      }
  
      // Assuming the response contains a success message
      const data = await response.json();
  
      // Success alert
      alert("Data successfully uploaded! 🎉");
  
      // You can optionally log the response or handle it further
      console.log(data);
  
    } catch (error) {
      // Error alert
      alert(`Oops! Something went wrong: \nPlease try again later. 😞`);
      
      // Log the error for debugging
      console.error(error);
    }
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
                rows={rows}
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
              />
            </div>
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
