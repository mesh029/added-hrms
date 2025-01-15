import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { ChevronDown, ChevronUp, Circle, Hourglass, XCircle } from "lucide-react";
import LeaveApprovalFlowComponent from "./leaveApprovalFlow";

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
}

const LeaveTable: React.FC<LeaveApprovalProps> = ({ userId, userRole, title, leaveRequests }) => {
    const [selectedLeaveRequestId, setSelectedLeaveRequestId] = useState<number | null>(null);
    const [expandedMonth, setExpandedMonth] = useState<string | null>(null);
    const [expandedLeave, setExpandedLeave] = useState<number | null>(null);
    const [openApproveModal, setOpenApproveModal] = useState(false);
    const [openRejectModal, setOpenRejectModal] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    const getStatusIndicator = (status: string) => {
        if (status === "Approved") return <Circle className="text-green-500 w-5 h-5" />;
        if (status === "Rejected") return <XCircle className="text-red-500 w-5 h-5" />;
        return <Hourglass className="text-yellow-500 w-5 h-5" />;
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

    const toggleExpand = (id: number) => {
        setExpandedLeave((prev) => (prev === id ? null : id));
    };

    const handleApproveClick = (id: number) => {
        setSelectedLeaveRequestId(id);
        setOpenApproveModal(true);
    };

    const handleRejectClick = (id: number) => {
        setSelectedLeaveRequestId(id);
        setOpenRejectModal(true);
    };

    const handleApprove = async () => {
        alert(`Approved leave request ID: ${selectedLeaveRequestId}`);
        setOpenApproveModal(false);
    };

    const handleReject = async () => {
        if (!rejectReason) {
            alert("Please provide a reason for rejection.");
            return;
        }
        alert(`Rejected leave request ID: ${selectedLeaveRequestId}`);
        setOpenRejectModal(false);
        setRejectReason('');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
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

            {/* Approve Modal */}
            <Dialog open={openApproveModal} onClose={() => setOpenApproveModal(false)}>
                <DialogTitle>Approve Leave Request</DialogTitle>
                <DialogActions>
                    <Button onClick={handleApprove}>Approve</Button>
                    <Button onClick={() => setOpenApproveModal(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Reject Modal */}
            <Dialog open={openRejectModal} onClose={() => setOpenRejectModal(false)}>
                <DialogTitle>Reject Leave Request</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Rejection Reason"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        fullWidth
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleReject}>Reject</Button>
                    <Button onClick={() => setOpenRejectModal(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>
        </Card>
    );
};

export default LeaveTable;
