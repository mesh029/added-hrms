import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface Timesheet {
  id: number;
  userId: number;
  month: number;
  year: number;
  status: "Draft" | "Ready" | "Approved(HR)" | "Approved by: INCHARGE"| "Approved(PO)"| "Approved(PADM)";
  entries: Array<{ day: string; hoursWorked: number }>; // Example format for timesheet entries
}

interface TimesheetApprovalProps {
  userId: number;
  userRole: string; // Role of the logged-in user (e.g., "admin", "incharge", "hr")
  name: string;
  title: string;
}

const TimesheetApprovalComponent: React.FC<TimesheetApprovalProps> = ({ userId, userRole, name, title }) => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null);

  useEffect(() => {
    const fetchTimesheets = async () => {
      const token = localStorage.getItem("jwtToken");
  
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }
  
      try {
        const response = await fetch(`http://localhost:3030/api/timesheets/approve?userId=${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
  
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            setTimesheets(data); // Correctly assign the timesheets array
            setLoading(false)
          } else {
            console.log(data)
            console.error("Unexpected response structure:", data);
          }
        } else {
          console.error("Failed to fetch timesheets.");
        }
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      }
    };
  
    fetchTimesheets();
  }, []);
  

  const handleApprove = async (
    timesheetId: number,
    approverId: number,
  ) => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }
  
      const response = await fetch(
        `http://localhost:3030/api/timesheets/${timesheetId}/approve?approverId=${approverId}`,  // Send approverId in query params
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const updatedTimesheet = await response.json();
  
        // Update the local state with the new status
        setTimesheets((prev) =>
          prev.map((timesheet) =>
            timesheet.id === timesheetId
              ? { ...timesheet, status: updatedTimesheet.status }
              : timesheet
          )
        );
  
        console.log("Timesheet approved successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to approve timesheet.", approverId);
      }
    } catch (error) {
      console.error("Error approving timesheet:", error);
    }
  };
  
  
  
  // Function to get the status based on the role
  const getStatusForRole = (role: "incharge" | "hr" | "po" | "padm") => {
    switch (role) {
      case "incharge":
        return "Approved(FI)";
      case "hr":
        return "Approved(HR)";
      case "po":
        return "Approved(PO)";
      case "padm":
        return "Approved(PADM)";
      default:
        return "Ready"; // Default status
    }
  };
  
  // Function to get the title of the approver based on role
  const getRoleTitle = (role: "incharge" | "hr" | "po" | "padm") => {
    switch (role) {
      case "incharge":
        return "Incharge";
      case "hr":
        return "HR";
      case "po":
        return "Purchase Officer";
      case "padm":
        return "Admin";
      default:
        return "";
    }
  };
  
  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("jwtToken");

      const response = await fetch(`http://localhost:3030/api/timesheets/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTimesheets((prev) => prev.filter((timesheet) => timesheet.id !== id));
      } else {
        console.error("Failed to reject timesheet.");
      }
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedTimesheet((prev) => (prev === id ? null : id));
  };

  const groupedTimesheets = {
    Ready: timesheets.filter((t) => t.status === "Ready"),
    ApprovedIncharge: timesheets.filter((t) => t.status === "Approved by: INCHARGE"),
    ApprovedHR: timesheets.filter((t) => t.status === "Approved(HR)"),
    ApprovedPO: timesheets.filter((t) => t.status === "Approved(PO)"),
    ApprovedPADM: timesheets.filter((t) => t.status === "Approved(PADM)"),
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timesheet Approval</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {Object.entries(groupedTimesheets).map(([status, group]) => (
              <div key={status}>
                <h2 className="text-xl font-bold mb-4">{status} Timesheets</h2>
                <div className="overflow-x-auto mb-6 max-h-72">
                  <Table className="min-w-full">
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Month</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>View</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
                          <TableRow>
                            <TableCell>{timesheet.id}</TableCell>
                            <TableCell>{timesheet.userId}</TableCell>
                            <TableCell>{timesheet.month}</TableCell>
                            <TableCell>{timesheet.year}</TableCell>
                            <TableCell>
              {/* Use Link to navigate to the timesheet page with the timesheetId */}
               <Button>

               <Link href={`/timesheet/${timesheet.id}`}>
View Timeesheet

               </Link>

               </Button>
         
            </TableCell>
                            <TableCell>
                              {status === "Ready" && (
                                <>
                                  <Button
                                    onClick={() => handleApprove(timesheet.id,userId)}
                                  >
                                    Approve
                                  </Button>
                                  <Button variant="destructive" onClick={() => handleReject(timesheet.id)}>
                                    Reject
                                  </Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedTimesheet === timesheet.id && (
                            <TableRow>
                              <TableCell colSpan={6}>
                                <div className="p-4 bg-gray-100 rounded">
                                  <p><strong>Entries:</strong></p>
                                  <ul>
                                    {timesheet.entries.map((entry, index) => (
                                      <li key={index}>
                                        Day: {entry.day}, Hours Worked: {entry.hoursWorked}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TimesheetApprovalComponent;
