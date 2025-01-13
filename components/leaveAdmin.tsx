import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import * as Dialog from '@radix-ui/react-dialog';
import LeaveApprovalFlowComponent from './leaveApprovalFlow';

interface LeaveRequest {
  id: number;
  userId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Fully Approved' | 'Approved' | 'Denied' | 'Pending';
}

interface AdminLeaveManagementComponentProps {
  userId: number;
  userRole: string;
  userName: string;
  userLocation: string; // Role of the logged-in user (e.g., "admin", "manager")
}




const AdminLeaveManagementComponent: React.FC<AdminLeaveManagementComponentProps> = ({ userId, userRole, userName, userLocation }) => {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [userNames, setUserNames] = useState<{ [key: number]: string }>({});
  const [userManagers, setUserManagers] = useState<{ [key: number]: string}>({});
  const [loading, setLoading] = useState(true);
  const [expandedLeave, setExpandedLeave] = useState<number | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false); // To control the popup state
  const [selectedLeaveId, setSelectedLeaveId] = useState<number | null>(null);
  const [selectedAction, setSelectedAction] = useState<'approve' | 'denied' | null>(null);
  const [leaveRequests2, setLeaveRequests2] = useState<LeaveRequest[]>([]);
  const [refetchLeaveRequests, setRefetchLeaveRequests] = useState<boolean>(false); // Refetch trigger state
// Declare state with the correct typeconst [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([]);
const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
const [approvedLeaves, setApprovedLeaves] = useState<LeaveRequest[]>([]);

const [rejectedLeaves, setRejectedLeaves] = useState<LeaveRequest[]>([]);
const [otherLeaves, setOtherLeaves] = useState<LeaveRequest[]>([]);
  useEffect(() => {
    const fetchLeaveRequests = async () => {
      const token = localStorage.getItem("jwtToken");
      const userData = JSON.parse(localStorage.getItem("userData") ?? '{}');
      const { id: userId, role: userRole } = userData;
  
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }
  
      try {
        const response = await fetch(
          `http://localhost:3030/api/leaves-now?userId=${userId}&userRole=${userRole}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        if (response.ok) {
          const data = await response.json();
          const leaveRequests: LeaveRequest[] = data.leaveRequests || [];
  
          // Now categorize leave requests by status
          const approvedLeaves = leaveRequests.filter((request) => request.status === "Fully Approved");
          const pendingLeaves = leaveRequests.filter((request) => request.status !== "Fully Approved");
          const rejectedLeaves = leaveRequests.filter((request) => request.status === "Denied");
          const otherLeaves = leaveRequests.filter(
            (request) => !["Fully Approved", "Pending", "Denied"].includes(request.status)
          );
  
          // Set the categorized leave requests
          setLeaveRequests(leaveRequests);
          setApprovedLeaves(approvedLeaves);
          setPendingLeaves(pendingLeaves);
          setRejectedLeaves(rejectedLeaves);
          setOtherLeaves(otherLeaves);
        } else {
          console.error("Failed to fetch leave requests.");
        }
      } catch (error) {
        console.error("Error fetching leave requests:", error);
      }
    };
  
  
    const fetchLeaveRequests2 = async () => {
      const token = localStorage.getItem("jwtToken");
    
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }
    
      try {
        const response = await fetch(`http://localhost:3030/api/leaves/role/${userId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
    
        if (response.ok) {
          const data = await response.json();
          console.log(data)
    
          if (data) {
            setLeaveRequests2(data);
          } else {
            console.error("No leave requests found in the response.");
          }
        } else {
          // Log the response status and text if the request failed
          const errorText = await response.text();
          console.error(`Failed to fetch leave requests. Status: ${response.status}, Response: ${errorText}`);
        }
      } catch (error) {
        // Catch and log any errors that occur during the fetch or JSON parsing
        console.error("Error fetching leave requests:", error);
      }
    };
    
  
    const fetchUserData = async () => {
      const token = localStorage.getItem("jwtToken");
  
      if (!token) {
        console.error("Token is missing. Please log in.");
        return;
      }
  
      try {
        const response = await fetch(`http://localhost:3030/api/users`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (response.ok) {
          const users = await response.json();
          const userNamesData: { [key: number]: string } = {};
          const userManagersData: { [key: number]: string } = {};
  
          users.forEach((user: any) => {
            userNamesData[user.id] = user.name;
            userManagersData[user.id] = user.reportsTo;
          });
  
          setUserNames(userNamesData);
          setUserManagers(userManagersData);
          setLoading(false);
        } else {
          console.error("Failed to fetch user data.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
  
    fetchLeaveRequests();
    fetchUserData();
    fetchLeaveRequests2()

    if (refetchLeaveRequests) {
      fetchLeaveRequests2(); // Call again when refetchLeaveRequests is true
      setRefetchLeaveRequests(false); // Reset the refetch state
    }

  }, [refetchLeaveRequests]);

  const handleApprove = async (id: number) => {
    setSelectedLeaveId(id);
    setSelectedAction('approve');
    setIsConfirmOpen(true);
};

const handleReject = async (id: number) => {
    setSelectedLeaveId(id);
    setSelectedAction('denied');
    setIsConfirmOpen(true);
};

const confirmApproval = async (userId: number) => {
  if (!selectedAction) return; // Ensure action is set

  try {
      const response = await fetch(
          `http://localhost:3030/api/leaves/${selectedLeaveId}/${selectedAction}?approverId=${userId}`,
          {
              method: "PATCH",
              headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${localStorage.getItem("jwtToken")}`,
              },
          }
      );

      if (response.ok) {
          setLeaveRequests((prev) =>
              prev.map((request) =>
                  request.id === selectedLeaveId
                      ? { ...request, status: selectedAction === 'approve' ? "Approved" : "Denied" }
                      : request
              )
          );
          window.location.reload(); // Always reload for both actions
      } else {
          console.error(`Failed to ${selectedAction} leave request.`, await response.json());
      }
  } catch (error) {
      console.error("Error updating leave request:", error);
  } finally {
      setIsConfirmOpen(false);
      setSelectedAction(null); // Reset action after completion
  }
};


  const formatDate = (date: string) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(new Date(date));
  };

  const toggleExpand = (id: number) => {
    setExpandedLeave((prev) => (prev === id ? null : id));
  };

 



  return (
    <>
      <CardHeader>
        <CardTitle>Leave Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* Approved Leaves Section */}
            <h2 className="text-xl font-bold mb-4">For your Action</h2>

            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Expand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests2.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                        <TableCell>{request.status}</TableCell>
                        <TableCell>{userNames[request.userId] || "Unknown"}</TableCell>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>
                          <>
                            <Button onClick={() => handleApprove(request.id)} className="mr-2">
                              Approve
                            </Button>
                            <Button onClick={() => handleReject(request.id)} variant="destructive">
                              Reject
                            </Button>
                          </>
                        </TableCell>
                        <TableCell>
                          <button onClick={() => toggleExpand(request.id)}>
                            {expandedLeave === request.id ? "⬇️" : "➡️"}
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedLeave === request.id && (
                        <>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 bg-gray-100 rounded">
                              <p><strong>Reason:</strong> {request.reason}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 bg-gray-100 rounded">
                            <LeaveApprovalFlowComponent leaveId={request.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                      </>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
            <h2 className="text-xl font-bold mb-4">Approved Leaves</h2>
            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Expand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvedLeaves.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                        <TableCell>🟢</TableCell>
                        <TableCell>{userNames[request.userId] || "Unknown"}</TableCell>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>
                          <button onClick={() => toggleExpand(request.id)}>
                            {expandedLeave === request.id ? "⬇️" : "➡️"}
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedLeave === request.id && (
                        <>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 bg-gray-100 rounded">
                              <p><strong>Reason:</strong> {request.reason}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 bg-gray-100 rounded">
                            <LeaveApprovalFlowComponent leaveId={request.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                      </>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pending Leaves Section */}
            <h2 className="text-xl font-bold mb-4">Pending Leaves</h2>
            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Actions</TableHead>
                    <TableHead>Expand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingLeaves.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                        <TableCell>⏳</TableCell>
                        <TableCell>{userNames[request.userId] || "Unknown"}</TableCell>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>
                          <button onClick={() => toggleExpand(request.id)}>
                            {expandedLeave === request.id ? "⬇️" : "➡️"}
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedLeave === request.id && (
                        <>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 bg-gray-100 rounded">
                              <p><strong>Reason:</strong> {request.reason}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                        <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 bg-gray-100 rounded">
                            <LeaveApprovalFlowComponent leaveId={request.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                      </>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Rejected Leaves Section */}
            <h2 className="text-xl font-bold mb-4">Rejected Leaves</h2>
            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Expand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rejectedLeaves.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                        <TableCell>❌</TableCell>
                        <TableCell>{userNames[request.userId] || "Unknown"}</TableCell>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
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
            </div>



            <h2 className="text-xl font-bold mb-4">Approval in Progress</h2>

            <div className="overflow-x-auto mb-6 max-h-72">
              <Table className="min-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>End Date</TableHead>
                    <TableHead>Expand</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {otherLeaves.map((request) => (
                    <React.Fragment key={request.id}>
                      <TableRow>
                      <TableCell>⏳</TableCell>
                      <TableCell>{userNames[request.userId] || "Unknown"}</TableCell>
                        <TableCell>{request.id}</TableCell>
                        <TableCell>{formatDate(request.startDate)}</TableCell>
                        <TableCell>{formatDate(request.endDate)}</TableCell>
                        <TableCell>
                          <button onClick={() => toggleExpand(request.id)}>
                            {expandedLeave === request.id ? "⬇️" : "➡️"}
                          </button>
                        </TableCell>
                      </TableRow>
                      {expandedLeave === request.id && (
                        <>
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="p-4 bg-gray-100 rounded">
                              <p><strong>Reason:</strong> {request.reason}</p>
                            </div>
                          </TableCell>
                        </TableRow>

                         <TableRow>
                        <TableCell colSpan={6}>
                          <div className="p-4 bg-gray-100 rounded">
                            <LeaveApprovalFlowComponent leaveId={request.id} />
                          </div>
                        </TableCell>
                      </TableRow>
                      </>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>



      {/* Confirmation Dialog */}
      <Dialog.Root open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
    <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
    <Dialog.Content className="p-6 bg-white rounded-lg shadow-lg fixed inset-1/4 left-1/4 w-1/2 z-50">
        <Dialog.Title className="text-xl font-bold mb-4">Confirm Action</Dialog.Title>
        <p>Are you sure you want to {selectedAction === "approve" ? "approve" : "reject"} this leave request?</p>
        
        <div className="flex justify-end gap-2 mt-4">
            {selectedAction === "approve" && (
                <Button onClick={() => confirmApproval(userId)} className="bg-green-500">
                    Yes, Approve
                </Button>
            )}
            {selectedAction === "denied" && (
                <Button onClick={() => confirmApproval(userId)} className="bg-red-500">
                    Yes, Reject
                </Button>
            )}
            <Button onClick={() => setIsConfirmOpen(false)} className="bg-gray-500">
                Cancel
            </Button>
        </div>
    </Dialog.Content>
</Dialog.Root>

    </>
  );
};

export default AdminLeaveManagementComponent;
