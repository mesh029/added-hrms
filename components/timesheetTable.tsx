import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Circle, Hourglass, XCircle } from "lucide-react";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { Card, CardContent, CardHeader, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { CardTitle } from "./ui/card";

import { useToast } from '../app/context/ToastContext'


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
  isBulk: boolean;
}


const TimesheetTable: React.FC<TimesheetTableProps> = ({ title, timesheets, userId, userRole, isBulk }) => {
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null); // Track the expanded row
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
    const [openBulkApproveModal, setOpenBulkApproveModal] = useState(false);


    const { showToast } = useToast();
    
    
      const handleSuccessToast = () => {
        // Trigger success toast
        showToast("Success! leave Request wass Approved.", "success");
      };
    
      const handleRejectToast = () => {
        // Trigger success toast
        showToast("Leave Request wass Rejected.", "warning");
      };
    
    
      const handleErrorToast = () => {
        // Trigger error toast
        showToast("Error! Something went wrong.", "error");
      };
    
    
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

  const handleBulkApproveClick= (leaves: {}) => {
    setOpenBulkApproveModal(true);
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

  const handleApproveBulk = async () => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }
  
      // Loop through each selected timesheet and approve it
      const approvalRequests = timesheets.map(async (timesheet) => {
        const response = await fetch(
          `/api/timesheet/${timesheet.id}/approve?approverId=${userId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to approve timesheet ${timesheet.id}: ${errorData.message || "Unknown error"}`);
        }
      });
  
      // Execute all the approval requests concurrently
      await Promise.all(approvalRequests);
  
      // Notify user of success
      setOpenBulkApproveModal(false);
      handleSuccessToast(); // Show success toast
      console.log("All timesheets approved successfully!");
  
      window.location.reload();
    } catch (error) {
      console.error("Error approving timesheets:", error);
      handleErrorToast(); // Show error toast (if you have one)
    }
  
    // Close modal or reset state
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
                 {isBulk && (userRole === "HR" || userRole === "INCHARGE")  && timesheets.length > 1 &&(
                                                                            <>
                                                                                <Button onClick={() =>  handleBulkApproveClick(timesheets)}>Bulk Approve</Button>
                                                                            </>
                                                                        )}
                      
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

            <Dialog
        open={openBulkApproveModal}
        onClose={() => setOpenBulkApproveModal(false)}
        maxWidth="md" // Makes the dialog wider
        fullWidth
      >
        <DialogTitle
          style={{
            fontWeight: 'bold',
            fontSize: '1.5rem',
            textAlign: 'center',
            color: '#003366', // You can change this to any color you want for the title
          }}
        >
          Bulk Leave Approval
        </DialogTitle>
      
        <DialogContent style={{ padding: '2rem' }}>
          <h1
            style={{
              color: '#8B1F25', // Red color for emphasis
              fontWeight: 'bold',
              fontSize: '1.25rem',
              marginBottom: '1rem',
            }}
          >
            You sure you wan't to approve all these leave requests??
          </h1>
      
          {/* Displaying leave requests */}
          {timesheets.map((timesheet) => {
            return (
              <div key={timesheet.id} style={{ marginBottom: '1rem' }}>
                <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
                  <span style={{ color: '#003366' }}>{timesheet.user.name}</span>
                </p>
                <p>{timesheet.month}</p>
                {/* Add more details as necessary */}
              </div>
            );
          })}
        </DialogContent>
      
        <DialogActions style={{ justifyContent: 'space-between' }}>
          <Button onClick={() => setOpenBulkApproveModal(false)} color="default" variant="default">
            Cancel
          </Button>
      
          <Button onClick={handleApproveBulk} color="default" variant="destructive" >
            Approve
          </Button>
      
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TimesheetTable;
