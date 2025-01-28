import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { ChevronDown, ChevronUp } from "lucide-react"; 
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import TimesheetTable from "./timesheetTable";
interface Timesheet {
  id: number;
  userId: number;
  user: {
    id: number;
    name: string;
  };
  month: number;
  year: number;
  status: "Draft" | "Ready" | "Approved by: HR" | "Approved by: INCHARGE" | "Approved by: PO" | "Approved by: PADM" | "Fully Approved";
  entries: Array<{ day: string; hoursWorked: number }>;
}

interface TimesheetApprovalProps {
  userId: number;
  userRole: string; // Role of the logged-in user (e.g., "admin", "incharge", "hr", "po")
  name: string;
  title: string;
}



const TimesheetApprovalComponent: React.FC<TimesheetApprovalProps> = ({ userId, userRole, name, title }) => {
  const [timesheets1, setTimesheets1] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);


const [timesheets, setTimesheets] = useState({
  roleBased: [],
  pending: [],
  fullyApproved: [],
  rejected: [],
  nextApprover: [],
});

  const handleRejectClick = (id: number) => {
    setSelectedTimesheetId(id);
    setOpenRejectModal(true);
  };

  const handleApproveClick= (id: number) => {
    setSelectedTimesheetId(id);
    setOpenApproveModal(true);
  };

    useEffect(() => {
      const fetchTimesheets = async () => {
        const token = localStorage.getItem("jwtToken");
    
        if (!token) {
          console.error("Token is missing. Please log in.");
          return;
        }
    
        try {
          const response = await fetch(`/api/timesheet?userId=${userId}`, {
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
                roleBasedTimesheets,
                pendingTimesheets,
                fullyApprovedTimesheets,
                rejectedTimesheets,
                awaitingNextApproverTimesheets
              } = data;
    
              // Ensure data is in the format your table expects
              setTimesheets({
                roleBased: roleBasedTimesheets || [],
                pending: pendingTimesheets || [],
                fullyApproved: fullyApprovedTimesheets || [],
                rejected: rejectedTimesheets || [],
                nextApprover: awaitingNextApproverTimesheets || [],
              });
              setLoading(false);
            } else {
              console.error("Unexpected response structure:", data);
            }
          } else {
            const errorData = await response.json();
            console.error("Failed to fetch timesheets:", errorData);
          }
        } catch (error) {
          console.error("Error fetching timesheets:", error);
        }
      };
    
      fetchTimesheets();
    }, [userId]);
    
    
  

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

        setTimesheets1((prev) =>
          prev.map((timesheet) =>
            timesheet.id === selectedTimesheetId
              ? { ...timesheet, status: updatedTimesheet.status }
              : timesheet
          )
        );

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
    <Card>
      <CardHeader>
        <CardTitle>Timesheet Approval</CardTitle>
      </CardHeader>
      <CardContent>
      <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          {/* Timesheet Categories */}
          {userRole ==="admin" && (
            <TimesheetTable
            title="Role-based Timesheets"
            timesheets={timesheets.roleBased}
            userId={userId}
            userRole= {userRole}
          />
          )
          
          }
          
          <TimesheetTable
  title={userRole !== "STAFF" ? "For Your Action" : "Pending..."}
  timesheets={timesheets.pending}
            userId={userId}
            userRole= {userRole}

          />
              <TimesheetTable
            title="Awaiting Next Approver"
            timesheets={timesheets.nextApprover}
            userId={userId}
            userRole= {userRole}

          />
          <TimesheetTable
            title="Fully Approved"
            timesheets={timesheets.fullyApproved}
            userId={userId}
            userRole= {userRole}

          />
          <TimesheetTable
            title="Rejected Timesheets"
            timesheets={timesheets.rejected}
            userId={userId}
            userRole= {userRole}
          />
        </>
      )}
    </div>
      </CardContent>

        
    </Card>
  );
};

export default TimesheetApprovalComponent;
