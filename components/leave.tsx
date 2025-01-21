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
  status: 'Pending' | 'Approved' | 'Denied' | 'Fully Approved';
}

interface LeaveManagementComponentProps {
  isApprover: boolean;
  userId: number;
}

// Kenyan public holidays for 2024
const kenyanHolidays = [
  '2024-01-01', // New Year's Day
  '2024-04-07', // Good Friday
  '2024-04-10', // Easter Monday
  '2024-05-01', // Labour Day
  '2024-06-01', // Madaraka Day
  '2024-07-20', // Mashujaa Day
  '2024-10-10', // Moi Day
  '2024-12-12', // Jamhuri Day
  '2024-12-25', // Christmas Day
  '2024-12-26', // Boxing Day
];

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

// Helper function to map leave reasons to types
const mapLeaveReasonToType = (reason: string) => {
  switch (reason) {
    case 'Sick Leave':
      return 'Sick';
    case 'Vacation Leave':
      return 'VACA';
    case 'Bereavement':
      return 'BRV';
    default:
      return 'Other';
  }
};

const LeaveManagementComponent: React.FC<LeaveManagementComponentProps> = ({ userId, isApprover }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);
  const [newLeave, setNewLeave] = useState<{ startDate: string; endDate: string; reason: string }>({
    startDate: '',
    endDate: '',
    reason: 'Sick Leave',
  });
  const [additionalReason, setAdditionalReason] = useState<string>('');
  const [leaveDuration, setLeaveDuration] = useState<number>(0);
  const [expandedLeave, setExpandedLeave] = useState<number | null>(null);
  const [pending, setPending] = useState(false); // Initialize state


  const toggleExpand = (id: number) => {
    setExpandedLeave((prev) => (prev === id ? null : id));
  };

  // Helper function to check if a date is a weekend or holiday
  const isWeekendOrHoliday = (date: Date) => {
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const dateString = date.toISOString().split('T')[0]; // Get date in YYYY-MM-DD format
    return dayOfWeek === 0 || dayOfWeek === 6 || kenyanHolidays.includes(dateString);
  };

  // Calculate leave duration excluding weekends and holidays
  const calculateLeaveDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    let duration = 0;

    while (start <= end) {
      if (!isWeekendOrHoliday(start)) {
        duration++;
      }
      start.setDate(start.getDate() + 1);
    }

    return duration;
  };

  useEffect(() => {
    if (newLeave.startDate && newLeave.endDate) {
      const duration = calculateLeaveDuration(newLeave.startDate, newLeave.endDate);
      setLeaveDuration(duration);
    }
  }, [newLeave.startDate, newLeave.endDate]);


  useEffect(() => {
    const fetchLeaveRequests = async () => {
      try {
        const response = await fetch(`/api/leave?userId=${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();

          // Extract pending leave requests
          const { pendingLeaveRequests } = data;

          // Check if there are any pending leave requests
          const hasPendingRequests = pendingLeaveRequests?.length > 0;

          // Set 'pending' to true if there are any pending leave requests
          setPending(hasPendingRequests);

          // Optionally, you can also set the leaveRequests state
          setLeaveRequests(pendingLeaveRequests);
        } else {
          console.error("Failed to fetch leave requests.");
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };

    fetchLeaveRequests();
  }, [userId]);
  
  const handleRequestNewLeave = async () => {
    const leaveReason = newLeave.reason === "Other" ? additionalReason : newLeave.reason;
  
    // Map the leave reason to the type using the mapLeaveReasonToType function
    const leaveType = mapLeaveReasonToType(leaveReason);
  
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
  
    const payload = {
      startDate: newLeave.startDate,
      endDate: newLeave.endDate,
      reason: leaveReason, // Reason text
      leaveType: leaveType, // Mapped leave type
      userId,
    };
  
    // Log the payload
    console.log("Sending payload to endpoint:", payload);
  
    try {
      const response = await fetch("/api/leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });
  
      if (response.ok) {
        const newRequest = await response.json();
        setMyLeaveRequests((prev) => [...prev, newRequest]);
        setNewLeave({ startDate: '', endDate: '', reason: '' });
        setAdditionalReason('');
        alert("Leave Request Submitted for Approval!");
  
        // Optionally reload the page after submitting
        window.location.reload();
      } else {
        // Log error response details
        const errorDetails = await response.json();
        console.error("Failed to submit leave request:", {
          status: response.status,
          statusText: response.statusText,
          details: errorDetails,
        });
        alert(
          `Failed to submit leave request. Server responded with status ${response.status}: ${response.statusText}.`
        );
      }
    } catch (error) {
      // Log unexpected errors
      console.error("Error submitting leave request:", error);
      alert("An unexpected error occurred while submitting the leave request. Please try again.");
    }
  };
  
  

  const statusIcon = (status: string) => {
    if (status.startsWith("Rejected") || status === "Denied") {
        return <FaTimesCircle className="text-red-500" />;
    }

    if (status === "Fully Approved") {
        return <FaCheckCircle className="text-green-500" />;
    }

    // Default case: Treat anything else as "Pending"
    return <FaHourglass className="text-yellow-500" />;
};


  return (
    <div className="space-y-4">
      {pending && !isApprover &&(
        <div className="text-red-500 text-sm mt-2">
          You have a pending leave request. Please wait for approval before submitting another request.
        </div>
      )}
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
            </div>
            <div className="mt-4">
              <label className="block mb-1">Reason</label>
              <select
                value={newLeave.reason}
                onChange={(e) => setNewLeave({ ...newLeave, reason: e.target.value })}
                className="border p-3 rounded w-full"
              >
                <option value="Sick Leave">Sick Leave</option>
                <option value="Vacation Leave">Vacation Leave</option>
                <option value="Bereavement">Bereavement</option>
                <option value="Other">Other</option>
              </select>
            </div>
            {newLeave.reason === "Other" && (
              <div className="mt-4">
                <label className="block mb-1">Please specify the reason</label>
                <input
                  type="text"
                  value={additionalReason}
                  onChange={(e) => setAdditionalReason(e.target.value)}
                  className="border p-3 rounded w-full"
                />
              </div>
            )}
            <div className="mt-4">
              <label className="block mb-1">Leave Duration</label>
              <p>{leaveDuration} day(s)</p>
            </div>
            <Button
              onClick={handleRequestNewLeave}
              className="mt-4"
              disabled={pending}
            >
              Submit Leave Request
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default LeaveManagementComponent;
