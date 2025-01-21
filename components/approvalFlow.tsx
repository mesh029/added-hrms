import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Link from "next/link";

interface ApprovalFlow {
  id: number;
  approverName: string;
  approverRole: string;
  status: string;
  timestamp: string;
  signature?: string;
}

interface TimesheetApprovalProps {
  timesheetId: number;
}

const ApprovalFlowComponent: React.FC<TimesheetApprovalProps> = ({ timesheetId }) => {
  const [approvalFlow, setApprovalFlow] = useState<ApprovalFlow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApprovalFlow = async () => {
      try {
        const response = await fetch(
          `/api/timesheet/${timesheetId}/flow`
        );
        if (!response.ok) {
          const errorText = await response.text(); // Get error message from the response body
          console.error("Failed to fetch approval flow", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
        } else {
          const data = await response.json();
          setApprovalFlow(data);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching approval flow", error);
      }
    };

    fetchApprovalFlow();
  }, [timesheetId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Approval Flow</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div>
            <h2 className="text-xl font-bold mb-4">Approval Timeline</h2>
            <div className="overflow-x-auto max-h-72">
              <Table className="min-w-full table-auto">
                <TableHeader>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Timestamp</TableCell>
                    <TableCell>Signature</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvalFlow.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>{approval.id}</TableCell>
                      <TableCell>{approval.approverName}</TableCell>
                      <TableCell>{approval.approverRole}</TableCell>
                      <TableCell>{approval.status}</TableCell>
                      <TableCell>
                        {new Date(approval.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {approval.signature ? (
                          <img
                            src={approval.signature}
                            alt="Signature"
                            className="h-10"
                          />
                        ) : (
                          "No Signature"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ApprovalFlowComponent;
