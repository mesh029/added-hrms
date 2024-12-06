import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

interface LeaveManagementComponentProps {
  isApprover: boolean; // Determines if the user is an approver or requestor
  userId: number;
}

const LeaveManagementComponent: React.FC<LeaveManagementComponentProps> = ({ userId, isApprover }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]); // For approver view
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]); // For requestor view
  
  const [newLeave, setNewLeave] = useState<{ startDate: string; endDate: string; reason: string }>({
    startDate: '',
    endDate: '',
    reason: '',
  });


  // Fetch leave requests on component load
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(`http://localhost:3030/api/leaves/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setMyLeaveRequests(data); // Set leave requests for the current user
        } else {
          console.error("Failed to fetch leave requests.");
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };

    fetchLeaveRequests();
  }, [userId]);

  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        console.log("Fetching leave requests...");
  
        const response = await fetch(`http://localhost:3030/api/leaves`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
  
        // Log the status of the response
        console.log("Response status:", response.status);
  
        if (response.ok) {
          // Parse the response JSON
          const data = await response.json();
  
          // Log the fetched leave requests
          console.log("Fetched leave requests:", data);
  
          // Assuming data.leaveRequests is an array, set it in state
          setLeaveRequests(data.leaveRequests);
        } else {
          console.error("Failed to fetch leave requests.");
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };
  
    fetchLeaveRequests();
  }, []);

  // Handle new leave request submission
  const handleRequestNewLeave = async () => {
    try {
      const response = await fetch("http://localhost:3030/api/leaves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          startDate: newLeave.startDate,
          endDate: newLeave.endDate,
          reason: newLeave.reason,
          userId, // Use the user ID here
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setMyLeaveRequests((prev) => [...prev, newRequest]); // Add the new request to the list
        setNewLeave({ startDate: '', endDate: '', reason: '' }); // Reset form
        alert("Leave Request Submitted for Approval!")
      } else {
        console.error("Failed to submit leave request.");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
  {myLeaveRequests.map((request, index) => (
    <TableRow key={request.id || `leave-${index}`}>
      <TableCell>{request.startDate}</TableCell>
      <TableCell>{request.endDate}</TableCell>
      <TableCell>{request.reason}</TableCell>
      <TableCell>{request.status}</TableCell>
    </TableRow>
  ))}

</TableBody>
<TableBody>

  </TableBody>

          </Table>
        </CardContent>
      </Card>

      {/* Form for submitting new leave requests */}
      {!isApprover && (
        <Card>
          <CardHeader>
            <CardTitle>Request New Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">Start Date</label>
                <input
                  type="date"
                  value={newLeave.startDate}
                  onChange={(e) => setNewLeave({ ...newLeave, startDate: e.target.value })}
                  className="border p-3 rounded w-full"
                />
              </div>
              <div>
                <label className="block mb-1">End Date</label>
                <input
                  type="date"
                  value={newLeave.endDate}
                  onChange={(e) => setNewLeave({ ...newLeave, endDate: e.target.value })}
                  className="border p-3 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <label className="block mb-1">Reason</label>
                <input
                  type="text"
                  value={newLeave.reason}
                  onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                  className="border p-3 rounded w-full"
                />
              </div>
              <div className="col-span-2">
                <Button onClick={handleRequestNewLeave} disabled={!newLeave.startDate || !newLeave.endDate || !newLeave.reason} className="w-full">
                  Submit Leave Request
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveManagementComponent;
