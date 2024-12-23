import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FaCheckCircle, FaTimesCircle, FaHourglass } from "react-icons/fa"; // Import icons for status

interface LeaveRequest {
  id: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Denied';
}

interface LeaveManagementComponentProps {
  isApprover: boolean;
  userId: number;
}
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  const year = date.getFullYear();
  const month = date.getMonth() + 1; 
  const day = date.getDate();
  return `${new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date)}, ${new Intl.DateTimeFormat('en-US', { month: 'short' }).format(date)} ${day}, ${year}`;
};

const LeaveManagementComponent: React.FC<LeaveManagementComponentProps> = ({ userId, isApprover }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]); 
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]); 
  const [newLeave, setNewLeave] = useState<{ startDate: string; endDate: string; reason: string }>({
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [additionalReason, setAdditionalReason] = useState<string>(''); 
  const [leaveDuration, setLeaveDuration] = useState<number>(0); 
  const [expandedLeave, setExpandedLeave] = useState<number | null>(null);
    


  const toggleExpand = (id: number) => {
    setExpandedLeave((prev) => (prev === id ? null : id));
  };


  useEffect(() => {
    if (newLeave.startDate && newLeave.endDate) {
      const start = new Date(newLeave.startDate);
      const end = new Date(newLeave.endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 3600 * 24)) + 1;
      setLeaveDuration(diffDays);
    }
  }, [newLeave.startDate, newLeave.endDate]);

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
          setMyLeaveRequests(data); 
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
        const response = await fetch(`http://localhost:3030/api/leaves`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
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

  const handleRequestNewLeave = async () => {
    const leaveReason = newLeave.reason === "Other" ? additionalReason : newLeave.reason;

    const startDate = new Date(newLeave.startDate);
    const endDate = new Date(newLeave.endDate);
    if (endDate < startDate) {
      alert("End date must be after start date.");
      return;
    }

    const isConfirmed = window.confirm(
      `Are you sure you want to submit a leave request from ${newLeave.startDate} to ${newLeave.endDate} for the reason: ${leaveReason}?`
    );

    if (!isConfirmed) {
      return;
    }

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
          reason: leaveReason,
          userId,
        }),
      });

      if (response.ok) {
        const newRequest = await response.json();
        setMyLeaveRequests((prev) => [...prev, newRequest]);
        setNewLeave({ startDate: '', endDate: '', reason: '' });
        setAdditionalReason('');
        alert("Leave Request Submitted for Approval!");
      } else {
        console.error("Failed to submit leave request.");
      }
    } catch (error) {
      console.error("Error submitting leave request:", error);
    }
  };

  // Icon mapping for status
  const statusIcon = (status: 'Pending' | 'Approved' | 'Denied') => {
    switch (status) {
      case 'Approved':
        return <FaCheckCircle className="text-green-500" />;
      case 'Denied':
        return <FaTimesCircle className="text-red-500" />;
      case 'Pending':
        return <FaHourglass className="text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {myLeaveRequests.some((request) => request.status === 'Pending') && (
  <div className="text-red-500 text-sm mt-2">
    You have a pending leave request. Please wait for approval before submitting another request.
  </div>
)}
      <Card>
        <CardHeader>
          <CardTitle>My Leave Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expand</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myLeaveRequests.map((request, index) => (
                                    <React.Fragment key={request.id}>
                
               <TableRow key={request.id || `leave-${index}`}>
               <TableCell className="w-8">
                 {statusIcon(request.status)}
               </TableCell>
               <TableCell>{formatDate(request.startDate)}</TableCell>
               <TableCell>{formatDate(request.endDate)}</TableCell>
               <TableCell>{request.reason}</TableCell>
               <TableCell>{request.status}</TableCell> {/* Status word */}
               <TableCell>
                                         <button onClick={() => toggleExpand(request.id)}>
                                           {expandedLeave === request.id ? "⬇️" : "➡️"}
                                         </button>
                                       </TableCell>
             </TableRow>
              {expandedLeave === request.id && (
                                     <TableRow>
                                       <TableCell colSpan={6}>
                                         <div className="p-4 bg-gray-100 rounded">
                                           <p><strong>Reason:</strong> {request.reason}</p>
                                         </div>
                                       </TableCell>
                                     </TableRow>
                                   )}

                                 </React.Fragment>
             
             
              ))}
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

              {/* Display leave duration */}
              {newLeave.startDate && newLeave.endDate && (
                <div className="col-span-2 mt-2 text-sm text-gray-600">
                  <strong>Leave Duration: </strong>{leaveDuration} day{leaveDuration > 1 ? 's' : ''}
                </div>
              )}

              <div className="col-span-2">
                <label className="block mb-1">Reason</label>
                <select
                  value={newLeave.reason}
                  onChange={(e) => {
                    setNewLeave({ ...newLeave, reason: e.target.value });
                    if (e.target.value !== "Other") {
                      setAdditionalReason('');
                    }
                  }}
                  className="border p-3 rounded w-full"
                >
                  <option value="">Select Reason</option>
                  <option value="Sick Leave">Sick Leave</option>
                  <option value="Vacation Leave">Vacation Leave</option>
                  <option value="Bereavement">Bereavement</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {newLeave.reason === "Other" && (
                <div className="col-span-2">
                  <label className="block mb-1">Additional Reason</label>
                  <input
                    type="text"
                    value={additionalReason}
                    onChange={(e) => setAdditionalReason(e.target.value)}
                    className="border p-3 rounded w-full"
                  />
                </div>
              )}

              <div className="col-span-2">
              <Button
  onClick={handleRequestNewLeave}
  disabled={!newLeave.startDate || !newLeave.endDate || !newLeave.reason || myLeaveRequests.some((request) => request.status === 'Pending')}
  className="w-full"
>
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
