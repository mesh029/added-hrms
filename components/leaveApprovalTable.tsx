import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { ChevronDown, ChevronUp, Circle, Hourglass, XCircle } from "lucide-react";
import LeaveApprovalFlowComponent from "./leaveApprovalFlow";
import { useToast } from '../app/context/ToastContext'

interface LeaveRequest {
    id: number;
    userId: number;
    user: {
        id: number;
        name: string;
    };
    startDate: string;
    endDate: string;
    status: "Pending" | "Approved" | "Rejected";
    reason: string;
    approvers: string[];
}

interface LeaveApprovalProps {
    userId: number;
    userRole: string;
    leaveRequests: LeaveRequest[];
    title: string;
    isBulk: boolean;

    setLeaveRequestAD: React.Dispatch<React.SetStateAction<boolean>>;}

const LeaveTable: React.FC<LeaveApprovalProps> = ({ userId, userRole, title, leaveRequests, setLeaveRequestAD, isBulk }) => {
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [expandedLeave, setExpandedLeave] = useState<number | null>(null);
    const [openApproveModal, setOpenApproveModal] = useState(false);
    const [openBulkApproveModal, setOpenBulkApproveModal] = useState(false);

    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);

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



  const toggleExpand = (id: number) => {
    setExpandedLeave((prev) => (prev === id ? null : id));
  };

    const getStatusIndicator = (status: string) => {
        if (status === "Fully Approved") return <Circle className="text-green-500 w-5 h-5" />;
        if (status.startsWith("Rejected") || status.startsWith("Denied")) {
            return <XCircle className="text-red-500 w-5 h-5" />;
          }        return <Hourglass className="text-yellow-500 w-5 h-5" />;
    };

    // Group leave requests by month
    const groupedByMonth = leaveRequests.reduce((acc, leaveRequest) => {
        const month = new Date(leaveRequest.startDate).toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!acc[month]) acc[month] = [];
        acc[month].push(leaveRequest);
        return acc;
    }, {} as Record<string, LeaveRequest[]>);

    const toggleMonthExpand = (month: string) => {
        setExpandedMonth((prev) => (prev === month ? null : month));
    };


    const handleRejectClick = (id: number) => {
        setSelectedLeaveId(id);
        setOpenRejectModal(true);
      };
    
      const handleApproveClick= (id: number) => {
        setSelectedLeaveId(id);
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
            `/api/leave/${selectedLeaveId}/approve?approverId=${userId}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );
          if (response.ok) {
            handleSuccessToast()
            setLeaveRequestAD(true)
            
    
            console.log("Leave Request approved successfully!");
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
      
          // Loop through each leave request and approve it
          const approvalRequests = leaveRequests.map(async (leaveRequest) => {
            const response = await fetch(
              `/api/leave/${leaveRequest.id}/approve?approverId=${userId}`,
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
              throw new Error(`Failed to approve leave ${leaveRequest.id}: ${errorData}`);
            }
          });
      
          // Execute all the approval requests concurrently
          await Promise.all(approvalRequests);
      
          // Notify user of success
          setOpenBulkApproveModal(false);

          handleSuccessToast();
          setLeaveRequestAD(true);
          console.log("All leave requests approved successfully!");
        } catch (error) {
          console.error("Error approving leave requests:", error);
        }
      
        // Close modal or reset state
        setOpenApproveModal(false);
      };
      
      
    
      const handleReject = async () => {
        if (!selectedLeaveId || !rejectReason) {
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
            `/api/leave/${selectedLeaveId}/reject?approverId=${userId}`,
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
            handleRejectToast()
            setLeaveRequestAD(true)
            
            // Optionally, update the state to reflect the rejection
            // setTimesheets(...) to remove or update the timesheet from the list
          } else {
            // Try to parse JSON if possible, otherwise handle raw response
            try {
              const data = JSON.parse(rawResponse);
              console.error("Failed to reject leave:", data.error || "Unknown error");
              alert(`Failed to reject timesheet: ${data.error || "Unknown error"}`);
              handleErrorToast()
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
      

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                {isBulk && (userRole === "HR" || userRole === "INCHARGE")  && leaveRequests.length > 0 &&(
                                                            <>
                                                                <Button onClick={() =>  handleBulkApproveClick(leaveRequests)}>Bulk Approve</Button>
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
                                        <TableHead></TableHead>

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
                                        {monthRequests.map((leaveRequest) => (
                                            <React.Fragment key={leaveRequest.id}>
                                                <TableRow>
                                                <TableCell>{getStatusIndicator(leaveRequest.status)}</TableCell>

                                                    <TableCell>{leaveRequest.user.name}</TableCell>
                                                    <TableCell>{new Date(leaveRequest.startDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>{new Date(leaveRequest.endDate).toLocaleDateString()}</TableCell>
                                                    <TableCell>{leaveRequest.reason}</TableCell>
                                                    <TableCell>{leaveRequest.status}</TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" onClick={() => toggleExpand(leaveRequest.id)}>
                                                            {expandedLeave === leaveRequest.id ? <ChevronUp /> : <ChevronDown />}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        {userRole !== "STAFF" && title === "For Your Action" && (
                                                            <>
                                                                <Button onClick={() => handleApproveClick(leaveRequest.id)}>Approve</Button>
                                                                <Button variant="destructive" onClick={() => handleRejectClick(leaveRequest.id)}>Reject</Button>
                                                            </>
                                                        )}
                                                    </TableCell>
                                                </TableRow>

                                                {/* Expanded Leave Approval Flow Section */}
                                                {expandedLeave === leaveRequest.id && (
                                                    <TableRow>
                                                        <TableCell colSpan={7}>
                                                            <div className="p-4 bg-gray-100 rounded">
                                                                <LeaveApprovalFlowComponent leaveId={leaveRequest.id} />
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

      <Dialog open={openRejectModal} onClose={() => setOpenRejectModal(false)}>
        <DialogTitle>Reject Leave Request</DialogTitle>
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
        <DialogTitle>Confirm Approve Leave Request</DialogTitle>
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
    {leaveRequests.map((leaveRequest) => {
      return (
        <div key={leaveRequest.id} style={{ marginBottom: '1rem' }}>
          <p style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            <span style={{ color: '#003366' }}>{leaveRequest.user.name}</span>
          </p>
          <p>{leaveRequest.reason}</p>
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
        </Card>
    );
};

export default LeaveTable;
