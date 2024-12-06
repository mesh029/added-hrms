"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Header from "@/components/header";
import Footer from "@/components/footer";

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
  name: string;
  role: string;
}

const TimesheetPage: React.FC = () => {
  const params = useParams();
  const timesheetId = params?.id; // Extract `id` from URL parameters
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([]);
  const [timesheet, setTimesheet] = useState<Timesheet | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!timesheetId) return; // Prevent fetch calls if `id` is missing

    const fetchTimesheetEntries = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("Token is missing. Please log in.");

        const response = await fetch(
          `http://localhost:3030/api/timesheets/${timesheetId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch timesheet entries.");

        const data = await response.json();
        setTimesheetEntries(data.timesheetEntries || []);
      } catch (error) {
        console.error("Error fetching timesheet entries:", error);
      }
    };

    const fetchTimesheet = async () => {
      try {
        const token = localStorage.getItem("jwtToken");
        if (!token) throw new Error("Token is missing. Please log in.");

        const response = await fetch(
          `http://localhost:3030/api/timesheet/${timesheetId}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) throw new Error("Failed to fetch timesheet.");

        const data = await response.json();
        setTimesheet({
          id: data.timeSheet.id,
          userId: data.timeSheet.userId,
          month: data.timeSheet.month,
          year: data.timeSheet.year,
          status: data.timeSheet.status,
          name: data.timeSheet.user.name,
          role: data.timeSheet.user.role,
        });
      } catch (error) {
        console.error("Error fetching timesheet:", error);
      }
    };

    const fetchData = async () => {
      await Promise.all([fetchTimesheetEntries(), fetchTimesheet()]);
      setLoading(false);
    };

    fetchData();
  }, [timesheetId]);

  const downloadAsPDF = () => {
    if (!timesheet || !timesheetEntries.length) return;

    const doc = new jsPDF();
    const title = `Timesheet Report - ID: ${timesheet.id} for ${timesheet.name}`;
    doc.text(title, 10, 10);

    doc.autoTable({
      startY: 20,
      head: [["Date", "Hours", "Type", "Description"]],
      body: timesheetEntries.map((entry) => [
        new Date(entry.date).toLocaleDateString(),
        entry.hours,
        entry.type,
        entry.description || "N/A",
      ]),
    });

    doc.save(`Timesheet-${timesheet.id}.pdf`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header/>
    <Card style={{ flex: 1, padding: "20px" }}>
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
          <Footer/>

    </div>
  );
};

export default TimesheetPage;
