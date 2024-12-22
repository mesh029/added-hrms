import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";
import ApprovalFlowComponent from "./approvalFlow";
import { ChevronDown, ChevronUp } from "lucide-react"; 
interface Timesheet {
  id: number;
  userId: number;
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

  const handleApprove = async (timesheetId: number, approverId: number) => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("Authentication token is missing.");
        return;
      }

      const response = await fetch(
        `http://localhost:3030/api/timesheets/${timesheetId}/approve?approverId=${approverId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const updatedTimesheet = await response.json();

        setTimesheets((prev) =>
          prev.map((timesheet) =>
            timesheet.id === timesheetId
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
  };

  const handleReject = async (id: number) => {
    try {
      const token = localStorage.getItem("jwtToken");

      const response = await fetch(`http://localhost:3030/api/timesheets/${id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setTimesheets((prev) => prev.filter((timesheet) => timesheet.id !== id));
      } else {
        console.error("Failed to reject timesheet.");
      }
    } catch (error) {
      console.error("Error rejecting timesheet:", error);
    }
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
                            <TableCell>{timesheet.userId}</TableCell>
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
                                  <Button onClick={() => handleApprove(timesheet.id, userId)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleReject(timesheet.id)}>Reject</Button>
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
                            <TableCell>{timesheet.userId}</TableCell>
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
                                  <Button onClick={() => handleApprove(timesheet.id, userId)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleReject(timesheet.id)}>Reject</Button>
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
                            <TableCell>{timesheet.userId}</TableCell>
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
                                  <Button onClick={() => handleApprove(timesheet.id, userId)}>Approve</Button>
                                  <Button variant="destructive" onClick={() => handleReject(timesheet.id)}>Reject</Button>
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
            {userRole === "PADM" && (
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
  <TableCell>{timesheet.userId}</TableCell>
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
        <Button onClick={() => handleApprove(timesheet.id, userId)}>Approve</Button>
        <Button variant="destructive" onClick={() => handleReject(timesheet.id)}>Reject</Button>
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
                        <TableCell>{timesheet.userId}</TableCell>
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default TimesheetApprovalComponent;
