import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import LeaveTable from "./leaveApprovalTable";

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
}

interface LeaveApprovalProps {
  userId: number;
  userRole: string; // Role of the logged-in user (e.g., "admin", "incharge", "hr", "po")
  name: string;
  title: string;
}

const LeaveApprovalComponent: React.FC<LeaveApprovalProps> = ({ userId, userRole, name, title }) => {
  const [leaveRequests, setLeaveRequests] = useState({
    roleBased: [],
    pending: [],
    approved: [],
    rejected: [],
    nextApprover:[],
  });

  const [loading, setLoading] = useState(true);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedLeaveRequestId, setSelectedLeaveRequestId] = useState<number | null>(null);
  const [leaveRequestAD, setLeaveRequestAD] = useState(false); // State lifted up from SubComponent
  const handleRejectClick = (id: number) => {
    setSelectedLeaveRequestId(id);
    setOpenRejectModal(true);
  };

  const handleApproveClick = (id: number) => {
    setSelectedLeaveRequestId(id);
    setOpenApproveModal(true);
  };

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      const token = localStorage.getItem("jwtToken");

      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }

      try {
        const response = await fetch(`/api/leave?userId=${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Response Data:', data); // Check the structure

          if (data && typeof data === 'object') {
            const {
              roleBasedLeaveRequests,
              pendingLeaveRequests,
              fullyApprovedLeaveRequests,
              rejectedLeaveRequests,
              awaitingNextApprover,
            } = data;

            setLeaveRequests({
              roleBased: roleBasedLeaveRequests || [],
              pending: pendingLeaveRequests || [],
              approved: fullyApprovedLeaveRequests || [],
              rejected: rejectedLeaveRequests || [],
              nextApprover: awaitingNextApprover || [],
            });
            setLoading(false);
          } else {
            console.error("Unexpected response structure:", data);
          }
        } else {
          const errorData = await response.json();
          console.error("Failed to fetch leave requests:", errorData);
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };
    if (leaveRequestAD) {
      fetchLeaveRequests();
      setLeaveRequestAD(false); // Reset state after fetching leave requests
    }

    fetchLeaveRequests();
  }, [userId, leaveRequestAD]);



  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaves</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>



<LeaveTable
  title={userRole !== "STAFF" ? "For Your Action" : "Pending..."}
  leaveRequests={leaveRequests.pending}
  userId={userId}
  userRole={userRole}
  setLeaveRequestAD={setLeaveRequestAD}

/>
{userRole !== "STAFF" && (
  <LeaveTable
                title="Awaiting Next Approver"
                leaveRequests={leaveRequests.nextApprover}
                userId={userId}
                userRole={userRole}
                setLeaveRequestAD={setLeaveRequestAD}

              />

)}

              <LeaveTable
                title="Approved Leave Requests"
                leaveRequests={leaveRequests.approved}
                userId={userId}
                userRole={userRole}
                setLeaveRequestAD={setLeaveRequestAD}

              />
              <LeaveTable
                title="Rejected Leave Requests"
                leaveRequests={leaveRequests.rejected}
                userId={userId}
                userRole={userRole}
                setLeaveRequestAD={setLeaveRequestAD}

              />
            </>
          )}
        </div>
      </CardContent>

      {/* Reject Modal */}
      <Dialog open={openRejectModal} onClose={() => setOpenRejectModal(false)}>
        <DialogTitle>Reject Leave Request</DialogTitle>
        <DialogContent>
          <TextField
            label="Reason for Rejection"
            multiline
            fullWidth
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRejectModal(false)} color="secondary">
            Cancel
          </Button>

        </DialogActions>
      </Dialog>

      {/* Approve Modal */}
      <Dialog open={openApproveModal} onClose={() => setOpenApproveModal(false)}>
        <DialogTitle>Approve Leave Request</DialogTitle>
        <DialogActions>
          <Button onClick={() => setOpenApproveModal(false)} color="secondary">
            Cancel
          </Button>

        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default LeaveApprovalComponent;
