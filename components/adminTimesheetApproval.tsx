import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface TimesheetEntry {
  id: number;
  timesheetId: number;
  date: string;
  hours: number;
  type: string;
  description: string;

}

interface Timesheet {
  id: number;
  userId: number;
  month: number;
  year: number;
  status: string;
  name: String, 
  role: String
}

interface TimesheetProps {
  timesheetId: number; // ID of the timesheet to display
}

declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

const AdminTimesheetApprovalComponent: React.FC<TimesheetProps> = ({ timesheetId }) => {
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimesheetEntries = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      try {
        // First fetch timesheet entries
        const response = await fetch(`http://localhost:3030/api/timesheets/${timesheetId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTimesheetEntries(data.timesheetEntries); // Set timesheet entries
          console.log("Fetched timesheet entries:", data.timesheetEntries);
        } else {
          console.error("Failed to fetch timesheet entries.");
        }
      } catch (error) {
        console.error("Error fetching timesheet entries:", error);
      }
    };

    const fetchTimesheet = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      try {
        // Fetch the timesheet using the timesheetId
        const response = await fetch(`http://localhost:3030/api/timesheet/${timesheetId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          // Access the timesheet data correctly
  setTimesheet({
    id: data.timeSheet.id,
    userId: data.timeSheet.userId,
    month: data.timeSheet.month,
    year: data.timeSheet.year,
    status: data.timeSheet.status,
    name: data.timeSheet.user.name,
    role: data.timeSheet.user.role
  });

  console.log("Fetched timesheet data:", data.timeSheet); // Log the correct t
        } else {
          console.error("Failed to fetch timesheet.");
        }
      } catch (error) {
        console.error("Error fetching timesheet:", error);
      }
    };

    // Fetch both timesheet entries and the associated timesheet info
    fetchTimesheetEntries();
    fetchTimesheet();
    setLoading(false);
  }, [timesheetId]);

  const downloadAsPDF = () => {
    if (!timesheet || !timesheetEntries) return;

    const doc = new jsPDF();
    const title = `Timesheet Report - ID: ${timesheet.id} for ${timesheet.name}` ;
    doc.text(title, 10, 10);

    // Generate the table using the `timesheetEntries` array
    doc.autoTable({
      startY: 20,
      head: [["Date", "Hours", "Type", "Description"]],
      body: timesheetEntries.map((entry) => [
        new Date(entry.date).toLocaleDateString(), // Format date
        entry.hours,
        entry.type,
        entry.description || "N/A",
      ]),
    });

    // Save the PDF
    doc.save(`Timesheet-${timesheet.id}.pdf`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timesheet Details</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : timesheet ? (
          <div>
            <div className="mb-4">
              <h2 className="text-2xl font-bold">Timesheet ID: {timesheet.id}</h2>
              <p className="text-gray-600">User Name: {timesheet.name}</p>
              <p className="text-gray-600">User ID: {timesheet.userId}</p>
              <p className="text-gray-600">User Role: {timesheet.role}</p>
              <p className="text-gray-600">
                Month: {timesheet.month}, Year: {timesheet.year}
              </p>
              <p className="text-gray-600">Status: {timesheet.status}</p>
            </div>
            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Hours</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {timesheetEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString()}</TableCell>
                      <TableCell>{entry.hours}</TableCell>
                      <TableCell>{entry.type}</TableCell>
                      <TableCell>{entry.description || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <Button onClick={downloadAsPDF} className="bg-blue-500 text-white">
              Download PDF
            </Button>
          </div>
        ) : (
          <p>No timesheet found.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminTimesheetApprovalComponent;
