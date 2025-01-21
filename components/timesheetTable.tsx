import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Circle, Hourglass, XCircle } from "lucide-react";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { CardTitle } from "./ui/card";




// Define Timesheet and Props types
interface Timesheet {
  id: number;
  userId: number;
  user: {
    name: string;
  };
  month: number;
  year: number;
  status: string;
}

interface TimesheetTableProps {
  title: string;
  timesheets: Timesheet[];
  userId: number;
  userRole: string;
}


const TimesheetTable: React.FC<TimesheetTableProps> = ({ title, timesheets, userId, userRole }) => {
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null); // Track the expanded row
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);

  // Function to determine the indicator based on status
  const getStatusIndicator = (status: string) => {
    if (status === "Fully Approved") {
      return <Circle className="text-green-500 w-5 h-5" />;
    } else if (status.startsWith("Rejected")) {
      return <XCircle className="text-red-500 w-5 h-5" />;
    } else {
      return <Hourglass className="text-yellow-500 w-5 h-5" />;
    }
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

// Group timesheets by month
const groupedByMonth = timesheets.reduce((acc, timesheet) => {
    // Ensure `month` is treated as a number
    const month: number = timesheet.month; // 1, 2, 3, ..., 12
    const year: number = timesheet.year;  // Year for the timesheet (e.g., 2025)
  
    // Create the label in the format "Month Year"
    const label = `${monthNames[month - 1]} ${year}`;
  
    // Initialize the array for the label if it doesn't exist
    if (!acc[label]) acc[label] = [];
  
    // Push the timesheet into the appropriate month-year group
    acc[label].push(timesheet);
  
    return acc;
  }, {} as Record<string, Timesheet[]>);
  const handleRejectClick = (id: number) => {
    setSelectedTimesheetId(id);
    setOpenRejectModal(true);
  };

  const handleApproveClick= (id: number) => {
    setSelectedTimesheetId(id);
    setOpenApproveModal(true);
  };

  const handleApprove = async () => {
  
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }

      const response = await fetch(
        `/api/timesheet/${selectedTimesheetId}/approve?approverId=${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        alert("Timesheet Approved successfully");
        const updatedTimesheet = await response.json();
        window.location.reload()

        console.log("Timesheet approved successfully!");
      } else {
        const errorData = await response.json();
        console.error("Failed to approve timesheet.", errorData);
      }
    } catch (error) {
      console.error("Error approving timesheet:", error);
    }
    setOpenApproveModal(false);

  };

  const handleReject = async () => {
    if (!selectedTimesheetId || !rejectReason) {
      alert("Please enter a reason for rejection");
      return;
    }
  
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }
  
      const response = await fetch(
        `/api/timesheet/${selectedTimesheetId}/reject?approverId=${userId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: rejectReason }), // Send rejection reason
        }
      );
  
      // Log the raw response text for debugging
      const rawResponse = await response.text(); // Use text() to capture the raw response
      console.log("Raw response:", rawResponse);
  
      if (response.ok) {
        alert("Timesheet rejected successfully");
        // Optionally, update the state to reflect the rejection
        // setTimesheets(...) to remove or update the timesheet from the list
      } else {
        // Try to parse JSON if possible, otherwise handle raw response
        try {
          const data = JSON.parse(rawResponse);
          console.error("Failed to reject timesheet:", data.error || "Unknown error");
          alert(`Failed to reject timesheet: ${data.error || "Unknown error"}`);
        } catch (error) {
          console.error("Error parsing response:", error);
          alert("Failed to reject timesheet. Server returned invalid response.");
        }
      }
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
      alert("An error occurred while rejecting the timesheet.");
    }
  
    // Close modal and reset states
    setOpenRejectModal(false);
    setRejectReason('');
  };
  
  

  const toggleMonthExpand = (month: string) => {
    setExpandedMonth((prev) => (prev === month ? null : month));
};

  const toggleExpand = (id: number) => {
    setExpandedTimesheet((prev) => (prev === id ? null : id));
  };


  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto mb-6 max-h-72">

      <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {Object.entries(groupedByMonth)
                    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                    .map(([month, monthRequests]) => (
                        <div key={month} className="mb-6">
                            {/* Month Header with Expand Button */}
                            <div 
                                className="flex justify-between items-center cursor-pointer bg-gray-200 p-3 rounded"
                                onClick={() => toggleMonthExpand(month)}
                            >
                                <h2 className="font-semibold">{month}</h2>
                                {expandedMonth === month ? <ChevronUp /> : <ChevronDown />}
                            </div>

                            {/* Table for Expanded Month */}
                            {expandedMonth === month && (
                                <Table className="mt-4">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User</TableHead>
                                            <TableHead>Start Date</TableHead>
                                            <TableHead>End Date</TableHead>
                                            <TableHead>Reason</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Expand</TableHead>
                                            {userRole !== "STAFF" && title === "Pending" && (
                                                <TableHead>Actions</TableHead>
                                            )}
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {monthRequests.map((timesheet) => (
                                            <React.Fragment key={timesheet.id}>
                                               <TableRow>
      <TableCell>{getStatusIndicator(title)}</TableCell>
        <TableCell>{timesheet.id}</TableCell>
        <TableCell>{timesheet.user.name}</TableCell>
        <TableCell>{timesheet.month}</TableCell>
        <TableCell>{timesheet.year}</TableCell>
        <TableCell>{timesheet.status}</TableCell>
        <TableCell>
          {/* Use Link with passHref */}
          <Link href={`/timesheet/${timesheet.id}`} passHref>
            <Button >View Timesheet</Button>
          </Link>
        </TableCell>

        <TableCell>
                    <Button
                      variant="ghost"
                      onClick={() => toggleExpand(timesheet.id)}
                    >
                      {expandedTimesheet === timesheet.id ? <ChevronUp /> : <ChevronDown />}
                    </Button>
                  </TableCell>
        <TableCell>

  {/* Only show buttons if the user is not STAFF and the title is "Pending" */}
  {(userRole !== "STAFF" && (title === "Pending Timesheets" || title === "For Your Action")) && (    <>
      <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
      <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
    </>
  )}
</TableCell>


      </TableRow>

      {/* Approval Flow */}
      {expandedTimesheet === timesheet.id && (
        <TableRow>
          <TableCell colSpan={6}>
            <div className="p-4 bg-gray-100 rounded">
              <ApprovalFlowComponent timesheetId={timesheet.id} />
            </div>
          </TableCell>
        </TableRow>
      )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    ))}
            </CardContent>
            </Card>

      </div>
      <Dialog open={openRejectModal} onClose={() => setOpenRejectModal(false)}>
        <DialogTitle>Reject Timesheet</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for rejection"
            multiline
            rows={4}
            fullWidth
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleReject} color="primary">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openApproveModal} onClose={() => setOpenApproveModal(false)}>
        <DialogTitle>Confirm Approve Time Sheet</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenApproveModal(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleApprove} color="primary">
            Approve
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TimesheetTable;
