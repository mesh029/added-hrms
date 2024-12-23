import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { ChevronDown, ChevronUp } from "lucide-react"; 
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
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
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTimesheet, setExpandedTimesheet] = useState<number | null>(null);
  const [openRejectModal, setOpenRejectModal] = useState(false);
  const [openApproveModal, setOpenApproveModal] = useState(false);

  const [rejectReason, setRejectReason] = useState('');
  const [selectedTimesheetId, setSelectedTimesheetId] = useState<number | null>(null);

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
            setTimesheets(data);
            setLoading(false);
          } else {
            console.log(data);
            console.error("Unexpected response structure:", data);
          }
        } else {
          const data = await response.json();
          console.log(data);
          console.error("Failed to fetch timesheets.");
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

        setTimesheets((prev) =>
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

  const groupedTimesheets = {
    Ready: timesheets.filter((t) => t.status === "Ready"),
    ApprovedIncharge: timesheets.filter((t) => t.status === "Approved by: INCHARGE"),
    ApprovedHR: timesheets.filter((t) => t.status === "Approved by: HR"),
    ApprovedPO: timesheets.filter((t) => t.status === "Approved by: PO"),
    ApprovedPADM: timesheets.filter((t) => t.status === "Approved by: PADM"),
    FullyApporved: timesheets.filter((t) => t.status === "Fully Approved"),
    Rejected: timesheets.filter((t) => t?.status?.startsWith("Rejected")),

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
{userRole === "STAFF" && (
  <>
    {/* Section for pending and non-fully-approved timesheets */}
    <h2 className="text-xl font-bold mb-4">Your Pending Timesheets</h2>
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
          {timesheets
            .filter(
              (timesheet) =>
                timesheet.userId === userId && // Filter by userId
                timesheet.status !== "Fully Approved" && !timesheet.status.startsWith("Rejected")
            )
            .map((timesheet) => (
              <React.Fragment key={timesheet.id}>
                <TableRow>
                  <TableCell>{timesheet.id}</TableCell>
                  <TableCell>{timesheet.user.name}</TableCell>
                  <TableCell>{timesheet.month}</TableCell>
                  <TableCell>{timesheet.year}</TableCell>
                  <TableCell>{timesheet.status}</TableCell>
                  <TableCell>
                    <Button>
                      <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                    </Button>
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

    {/* Section for rejected timesheets */}
    <h2 className="text-xl font-bold mb-4">Your Rejected Timesheets</h2>
    <div className="overflow-x-auto mb-6 max-h-72">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Rejected By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>View</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {timesheets
            .filter(
              (timesheet) =>
                timesheet.userId === userId && // Filter by userId
                timesheet.status.startsWith("Rejected") // Only rejected timesheets
            )
            .map((timesheet) => {
              const rejectionDetails = timesheet.status.split(" by: ");
              const rejectedBy = rejectionDetails.length > 1 ? rejectionDetails[1].split(" ")[0] : "Unknown";
              const reason = rejectionDetails[1] ? rejectionDetails[1].slice(rejectedBy.length + 1) : "No reason provided";

              return (
                <React.Fragment key={timesheet.id}>
                  <TableRow>
                    <TableCell>{timesheet.id}</TableCell>
                    <TableCell>{timesheet.user.name}</TableCell>
                    <TableCell>{timesheet.month}</TableCell>
                    <TableCell>{timesheet.year}</TableCell>
                    <TableCell>{rejectedBy}</TableCell>
                    <TableCell>{reason}</TableCell>
                    <TableCell>
                      <Button>
                        <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                      </Button>
                    </TableCell>
                    <TableCell>
                      {/* Add any actions if needed, like edit or delete */}
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
        </TableBody>
      </Table>
    </div>
  </>
)}


          {userRole === "admin" && (
  <>
    <h2 className="text-xl font-bold mb-4">Timesheets Rejected</h2>
    <div className="overflow-x-auto mb-6 max-h-72">
      <Table className="min-w-full">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>User</TableHead>
            <TableHead>Month</TableHead>
            <TableHead>Year</TableHead>
            <TableHead>Rejected By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>View</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groupedTimesheets.Rejected.map((timesheet) => {
            const rejectionDetails = timesheet.status.split(" by: ");
            const rejectedBy = rejectionDetails.length > 1 ? rejectionDetails[1].split(" ")[0] : "Unknown";
            const reason = rejectionDetails[1] ? rejectionDetails[1].slice(rejectedBy.length + 1) : "No reason provided";

            return (
              <React.Fragment key={timesheet.id}>
                <TableRow>
                  <TableCell>{timesheet.id}</TableCell>
                  <TableCell>{timesheet.user.name}</TableCell>
                  <TableCell>{timesheet.month}</TableCell>
                  <TableCell>{timesheet.year}</TableCell>
                  <TableCell>{rejectedBy}</TableCell>
                  <TableCell>{reason}</TableCell>
                  <TableCell>
                    <Button>
                      <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                    </Button>
                  </TableCell>
                  <TableCell>
                    {/* Add any actions if needed, like edit or delete */}
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  </>
)}

            {userRole === "PADM" && (
              <>
                <h2 className="text-xl font-bold mb-4">Timesheets Approved by HR</h2>
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
                      {groupedTimesheets.ApprovedHR.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
                          <TableRow>
                            <TableCell>{timesheet.id}</TableCell>
                            <TableCell>{timesheet.user.name}</TableCell>
                            <TableCell>{timesheet.month}</TableCell>
                            <TableCell>{timesheet.year}</TableCell>
                            <TableCell>
                              <Button>
                                <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                              </Button>
                            </TableCell>
                            <TableCell>
                              {userRole === "PADM" && (
                                <>
                                  <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedTimesheet === timesheet.id && (
                            <TableRow>
                            <TableCell colSpan={6}>
                              <div className="p-4 bg-gray-100 rounded">
                               {timesheet.id}
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
              </>
            )}
            {userRole === "HR" && (
              <>
                <h2 className="text-xl font-bold mb-4">Timesheets Approved by PO</h2>
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
                      {groupedTimesheets.ApprovedPO.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
                          <TableRow>
                            <TableCell>{timesheet.id}</TableCell>
                            <TableCell>{timesheet.user.name}</TableCell>
                            <TableCell>{timesheet.month}</TableCell>
                            <TableCell>{timesheet.year}</TableCell>
                            <TableCell>
                              <Button>
                                <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                              </Button>
                            </TableCell>
                            <TableCell>
                              {userRole === "HR" && (
                                <>
                                  <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                          {expandedTimesheet === timesheet.id && (
                            <TableRow>
                            <TableCell colSpan={6}>
                              <div className="p-4 bg-gray-100 rounded">
                               {timesheet.id}
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
              </>
            )}
                        {userRole === "INCHARGE" && (
              <>
                <h2 className="text-xl font-bold mb-4">Timesheets For Incharge's Approval</h2>
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
                      {groupedTimesheets.Ready.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
                          <TableRow>
                            <TableCell>{timesheet.id}</TableCell>
                            <TableCell>{timesheet.user.name}</TableCell>
                            <TableCell>{timesheet.month}</TableCell>
                            <TableCell>{timesheet.year}</TableCell>
                            <TableCell>
                              <Button>
                                <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                              </Button>
                            </TableCell>
                            <TableCell>
                              {userRole === "INCHARGE" && (
                                <>
                                  <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
                                </>
                              )}
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            {userRole === "PO" && (
              <>
                <h2 className="text-xl font-bold mb-4">Timesheets Approved by Incharge</h2>
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
                      {groupedTimesheets.ApprovedIncharge.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
                          <TableRow>
                            <TableCell>{timesheet.id}</TableCell>
                            <TableCell>{timesheet.user.name}</TableCell>
                            <TableCell>{timesheet.month}</TableCell>
                            <TableCell>{timesheet.year}</TableCell>
                            <TableCell>
                              <Button>
                                <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                              </Button>
                            </TableCell>
                            <TableCell>
                              {userRole === "PO" && (
                                <>
                                  <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
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
              </>
            )}
           {(userRole === "PADM" || userRole === "admin") && (
              <>
                <h2 className="text-xl font-bold mb-4">View All Timesheets</h2>
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
                      {timesheets.map((timesheet) => (
                        <React.Fragment key={timesheet.id}>
 <TableRow>
  <TableCell>{timesheet.id}</TableCell>
  <TableCell>{timesheet.user.name}</TableCell>
  <TableCell>{timesheet.month}</TableCell>
  <TableCell>{timesheet.year}</TableCell>
  <TableCell>
    <Button>
      <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
    </Button>
  </TableCell>
  <TableCell>
    {userRole === "PADM" && (
      <>
        <Button onClick={() => handleApproveClick(timesheet.id)}>Approve</Button>
        <Button variant="destructive" onClick={() => handleRejectClick(timesheet.id)}>Reject</Button>
      </>
    )}
  </TableCell>
  <TableCell>
    <Button onClick={() => toggleExpand(timesheet.id)}>
      {expandedTimesheet === timesheet.id ? <ChevronUp /> : <ChevronDown />}
    </Button>
  </TableCell>
</TableRow>
{expandedTimesheet === timesheet.id && (
  <TableRow>
    <TableCell colSpan={6}>
      <div className="p-4 bg-gray-100 rounded">
       {timesheet.id}
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
              </>
            )}

<h2 className="text-xl font-bold mb-4">Fully Approved Timesheets</h2>
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
                  {groupedTimesheets.FullyApporved.map((timesheet) => (
                    <React.Fragment key={timesheet.id}>
                      <TableRow>
                        <TableCell>{timesheet.id}</TableCell>
                        <TableCell>{timesheet.user.name}</TableCell>
                        <TableCell>{timesheet.month}</TableCell>
                        <TableCell>{timesheet.year}</TableCell>
                        <TableCell>
                          <Button>
                            <Link href={`/timesheet/${timesheet.id}`}>View Timesheet</Link>
                          </Button>
                        </TableCell>
                        <TableCell>
                          <Button disabled>Fully Approved</Button>
                        </TableCell>
                        
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
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
    </Card>
  );
};

export default TimesheetApprovalComponent;
