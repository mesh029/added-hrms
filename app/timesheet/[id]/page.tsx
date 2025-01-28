"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";
import rough from "roughjs";
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
interface Approver {
  name: string;
  role: string;
  title: string;
  status: string;
}
interface Timesheet {
  id: number;
  userId: number;
  month: number;
  year: number;
  status: string;
  name: string;
  role: string;
  approvers: Approver[]; 
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
          `/api/timesheet/${timesheetId}/entry`,
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
          `/api/timesheet/${timesheetId}`,
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
    
        // Log the entire response data to inspect its structure
        console.log(data);
    
        // Check if timesheet data exists and safely access approvers
     
    
        setTimesheet({
          id: data.id,
          userId: data.userId,
          month: data.month,
          year: data.year,
          status: data.status,
          name: data.user.name,
          role: data.user.role,
          approvers: data.approvers || [],  // Default to an empty array if approvers is missing
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
  
    // Timesheet Table
    const timesheetTableStartY = 20;
    const table = doc.autoTable({
      startY: timesheetTableStartY,
      head: [["Date", "Hours", "Type", "Description"]],
      body: timesheetEntries.map((entry) => [
        new Date(entry.date).toLocaleDateString(),
        entry.hours,
        entry.type,
        entry.description || "N/A",
      ]),
    });
  
    // Get the end of the table
    const rowHeight = 10; // Approximate height of each row
    const tableRowCount = timesheetEntries.length;
    const timesheetTableEndY = timesheetTableStartY + (tableRowCount * rowHeight) + 10;
  
    // Add Approvers Section below the table
    const approversY = timesheetTableEndY;
    doc.setFontSize(8); // Reduce font size for the approvers section
    doc.text('Approvers:', 10, approversY);
  
    let approversYPosition = approversY + 5;
  
    // Define column width for each approver
    const columnWidth = (doc.internal.pageSize.width - 20) / 4;
  
    // Temporary canvas for Rough.js signatures
    const canvas = document.createElement("canvas");
    canvas.width = 100;
    canvas.height = 30; // Reduced height for smaller signatures
  
    // Add approvers with simulated signatures
    timesheet.approvers.slice(0, 4).forEach((approver, index) => {
      const columnX = 10 + columnWidth * index;
  
      doc.text(`Approver ${index + 1}:`, columnX, approversYPosition);
      doc.text(`Name: ${approver.name}`, columnX, approversYPosition + 5);
      doc.text(`Role: ${approver.role}`, columnX, approversYPosition + 10);
      doc.text(`Title: ${approver.title}`, columnX, approversYPosition + 15);
  
      // Add "Signature" label
      doc.text("Signature:", columnX, approversYPosition + 20);
  
      // Use Rough.js to create the hand-drawn signature with the full name
      const rc = rough.canvas(canvas);
      rc.rectangle(0, 0, canvas.width, canvas.height, { roughness: 1 }); // Optional boundary
      const ctx = canvas.getContext("2d");
  
      if (ctx) {
        ctx.font = "18px cursive"; // Smaller font for the signature
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
        ctx.fillText(approver.name, 5, 20); // Render the full name with adjusted position
      }
  
      // Convert the canvas to a base64 image
      const signatureImage = canvas.toDataURL("image/png");
  
      // Add signature image to PDF
      doc.addImage(signatureImage, "PNG", columnX, approversYPosition + 25, 30, 10); // Reduced image size
    });
  
    // Save the PDF
    doc.save(`Timesheet-${timesheet.id}.pdf`);
  };
  

  return (
    <>
    <Header/>

    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Card style={{ flex: 1, padding: "20px" }}>
        <CardHeader>
          <CardTitle>Timesheet Details</CardTitle>
        </CardHeader>
        <CardContent>
          {loading || !timesheet ? (
            <p>Loading...</p>
          ) : (
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
                <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Hours</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Description</TableHead>
    </TableRow>
  </TableHeader>
                  <TableBody>
                    {timesheetEntries.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {entry.date
                            ? format(new Date(entry.date), "MM/dd/yyyy")
                            : "Invalid Date"}
                        </TableCell>
                        <TableCell>{entry.hours || "0"}</TableCell>
                        <TableCell>{entry.type || "N/A"}</TableCell>
                        <TableCell>{entry.description || "N/A"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6">
  <h3 className="text-xl font-semibold">Approvers</h3>
  {timesheet?.approvers && timesheet.approvers.length > 0 ? (
    <div className="flex flex-wrap justify-evenly gap-4">
      {timesheet.approvers.map((approver, index) => (
        <div key={index} className="flex flex-col p-4 border rounded-lg space-y-1 text-center">
          <p><strong>Name:</strong> {approver.name}</p>
          <p><strong>Role:</strong> {approver.role}</p>
          <p><strong>Title:</strong> {approver.title}</p>
        </div>
      ))}
    </div>
  ) : (
    <p>No approvers available.</p>
  )}
</div>

              <Button
                onClick={downloadAsPDF}
                className="bg-blue-500 text-white"
              >
                Download PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    <Footer/>
    </>

    
  );
};

export default TimesheetPage;
