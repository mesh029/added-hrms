import React, { useState } from "react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';


// Define Timesheet and Props types
interface Timesheet {
  id: number;
  userId: number;
  user: {
    name: string;
  };
  month: string;
  year: number;
  status: string;
}

interface TimesheetTableProps {
  title: string;
  timesheets: Timesheet[];
  userId: number;
}


const TimesheetTable: React.FC<TimesheetTableProps> = ({ title, timesheets, userId }) => {
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null); // Track the expanded row
  const [rejectReason, setRejectReason] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);

  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);


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
        `http://localhost:3030/api/timesheets/${selectedTimesheetId}/approve?approverId=${userId}`,
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
        `http://localhost:3030/api/timesheets/${selectedTimesheetId}/reject?approverId=${userId}`,
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
  
  


  const toggleExpand = (id: number) => {
    setExpandedTimesheet((prev) => (prev === id ? null : id));
  };


  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      <div className="overflow-x-auto mb-6 max-h-72">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Month</TableHead>
              <TableHead>Year</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>View</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
  {timesheets.map((timesheet) => (
    <React.Fragment key={timesheet.id}>
      <TableRow>
        <TableCell>{timesheet.id}</TableCell>
        <TableCell>{timesheet.user.name}</TableCell>
        <TableCell>{timesheet.month}</TableCell>
        <TableCell>{timesheet.year}</TableCell>
        <TableCell>{timesheet.status}</TableCell>
        <TableCell>
          {/* Use Link with passHref */}
          <Link href={`/timesheet/${timesheet.id}`} passHref>
            <Button as="a">View Timesheet</Button>
          </Link>
        </TableCell>

        <TableCell>

        <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
        <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
        </TableCell>
        <TableCell>
          <Button onClick={() => toggleExpand(timesheet.id)}>
            {expandedTimesheet === timesheet.id ? <ChevronUp /> : <ChevronDown />}
          </Button>
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
