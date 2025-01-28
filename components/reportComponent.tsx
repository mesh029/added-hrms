import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { Button } from "./ui/button";
import { Select, MenuItem, FormControl, InputLabel, CircularProgress, Grid, Box, Alert, Container } from '@mui/material';
import { report } from "process";
import { userAgentFromString } from "next/server";

interface Approval {
  approverName: string;
  approverRole: string;
  status: string;
  timestamp: Date;
}

interface User{
    id: number;
    name: string;
    reportsTo: string;
    role: string,
    location: string,
    facility: string,
    approvedLeaveDays: string,
}

interface Timesheet {
  id: number;
  userId: number;
  user: {
    name: string;
    role: string;
  };
  status: string;
  year: number;
  month: number;
  approvals: Approval[];
}

interface Leave {
    id: number;
    userId: number;
    user: {
      name: string;
      role: string;
    };
    status: string;
    startDate: Date;
    endDate: Date;
    approvals: Approval[];
  }
const TimesheetReportPage = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [filteredLeaves, setFilteredLeaves] = useState<Leave[]>([]);
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({
    status: 'All',
    year: 'All',
    month: 'All',
  });
  const [leaveFilters, setLeaveFilters] = useState({
    status: 'All',
    year: 'All',
    month: 'All',
  });

  const [userFilters, setUserFilters] = useState({
    role: "All",
    location: "All",
    facility: "All",
    reportsTo: "All"
  })
  const [loading, setLoading] = useState(true);
  const [loadingLeaves, setLoadingLeaves] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);


  const [noRecords, setNoRecords] = useState(false);
  const [noRecordsLeave, setNoRecordsLeave] = useState(false);
  const [noRecordsUsers, setNoRecordsUsers] = useState(false);


  

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const response = await fetch('/api/timesheet/report');
        if (response.ok) {
          const data = await response.json();
          setTimesheets(data.timesheets);
          setFilteredTimesheets(data.timesheets);
        } else {
          console.error("Failed to fetch timesheets");
        }
      } catch (error) {
        console.error("Error fetching timesheets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, []);

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const response = await fetch('/api/leave/report');
        if (response.ok) {
          const data = await response.json();
          setLeaves(data.leaves);
          setFilteredLeaves(data.leaves);
        } else {
          console.error("Failed to fetch leaves");
        }
      } catch (error) {
        console.error("Error fetching leaves:", error);
      } finally {
        setLoadingLeaves(false);
      }
    };

    fetchLeaves();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
          console.log("Data is here!!!", data)
          setFilteredUsers(data);
        } else {
          console.error("Failed to fetch users");
        }
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const handleFilterChange = (value: string, field: string) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleLeaveFilterChange = (value: string, field: keyof typeof leaveFilters) => {
    const newFilters = { ...leaveFilters, [field]: value };
    setLeaveFilters(newFilters);
    applyLeaveFilters(newFilters);
  };

  const handleUserFilterChange = (value: string, field: keyof typeof userFilters) => {
    const newFilters = { ...userFilters, [field]: value };
    setUserFilters(newFilters);
    applyUserFilters(newFilters);
  };
  const applyLeaveFilters = (newFilters: typeof leaveFilters) => {
    const { status, year, month } = newFilters;
  
    // Convert month names to 0-indexed month values
    const monthMap = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };
  
    const filtered = leaves.filter((lv) => {
      const statusMatch =
        status === "All" ||
        (status === "Rejected" && lv.status.startsWith("Rejected")) ||
        lv.status === status;
  
      const yearMatch = year === "All" || new Date(lv.startDate).getFullYear() === Number(year);
  
      const monthMatch =
        month === "All" || new Date(lv.startDate).getMonth() === monthMap[month as keyof typeof monthMap]; // Assert month type
  
      return statusMatch && yearMatch && monthMatch;
    });
  
    // If status starts with "Rejected", set status to "Rejected" for those records
    const updatedFilteredLeaves = filtered.map((lv) => ({
      ...lv,
      status: lv.status.startsWith("Rejected") ? "Rejected" : lv.status,
    }));
  
    setFilteredLeaves(updatedFilteredLeaves);
    setNoRecordsLeave(updatedFilteredLeaves.length === 0);
  };
  
  const applyFilters = (newFilters: { status: string; year: string; month: string }) => {
    const { status, year, month } = newFilters;
    const filtered = timesheets.filter(ts => {
      const statusMatch = status === "All" || ts.status === status;
      const yearMatch = year === "All" || ts.year === Number(year);
      const monthMatch = month === "All" || ts.month === Number(month);
      return statusMatch && yearMatch && monthMatch;
    });

    setFilteredTimesheets(filtered);
    setNoRecords(filtered.length === 0);
  };

  const applyUserFilters = (newFilters: { role: string; location: string; facility: string; reportsTo: string }) => {
    const { role, location, facility, reportsTo } = newFilters;
    const filtered = users.filter(ts => {
      const roleMatch = role === "All" || ts.role === role;
      const locationMatch = location === "All" || ts.location ===  location;
      const fcailityMatch = facility === "All" || ts.facility === facility;
      const reportsToMatch = reportsTo === "All" || ts.reportsTo === reportsTo;

      return roleMatch && locationMatch && fcailityMatch && reportsToMatch;
    });

    setFilteredUsers(filtered);
    setNoRecordsUsers(filtered.length === 0);
  };

  const handleDownloadReport = () => {
    if (filteredTimesheets.length === 0) {
      alert("No records found to generate the report.");
      return;
    }

    const timesheetReport = filteredTimesheets.map((timesheet) => {
      const approvers = timesheet.approvals
        ? timesheet.approvals
            .map((approval) =>
              `${approval.approverName} (${approval.approverRole}) - ${approval.status} on ${new Date(approval.timestamp).toLocaleString()}`
            )
            .join(", ")
        : "No approvals";

      return {
        timesheetId: timesheet.id,
        userName: timesheet.user.name,
        userRole: timesheet.user.role,
        year: timesheet.year,
        month: timesheet.month,
        status: timesheet.status,
        approvers: approvers,
      };
    });

    const dataToExport = [
      ["Timesheet ID", "User Name", "User Role", "Year", "Month", "Status", "Approvers"],
      ...timesheetReport.map((item) => [
        item.timesheetId,
        item.userName,
        item.userRole,
        item.year,
        item.month,
        item.status,
        item.approvers,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Timesheet Report");

    XLSX.writeFile(wb, "timesheet_report.xlsx");
  };

  const handleDownloadUserReport = () => {
    if (filteredUsers.length === 0) {
      alert("No records found to generate the report.");
      return;
    }

    const usereport = filteredUsers.map((user) => {
      return {
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        reportsTo: user.reportsTo,
        facility: user.facility,
        location: user.location,
      };
    });

    const dataToExport = [
      ["User ID", "User Name", "User Role", "Manager", "Facility", "Location"],
      ...usereport.map((item) => [
        item.userId,
        item.userName,
        item.userRole,
        item.reportsTo,
        item.facility,
        item.location,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "User Report");

    XLSX.writeFile(wb, "user_report.xlsx");
  };


  const handleDownloadReportLeaves = () => {
    if (filteredLeaves.length === 0) {
      alert("No records found to generate the leave report.");
      return;
    }
  
    const leaveReport = filteredLeaves.map((leave) => {
      const approvers = leave.approvals
        ? leave.approvals
            .map((approval) =>
              `${approval.approverName} (${approval.approverRole}) - ${approval.status} on ${new Date(approval.timestamp).toLocaleString()}`
            )
            .join(", ")
        : "No approvals";
  
      // Extract year and month from startDate and endDate
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);
  
      // Get year and month (0-indexed month, so add 1)
      const startYear = startDate.getFullYear();
      const startMonth = startDate.getMonth() + 1; // Add 1 to get the correct month (1-12)
  
      const endYear = endDate.getFullYear();
      const endMonth = endDate.getMonth() + 1; // Add 1 for the month (1-12)
  
      return {
        leaveId: leave.id,
        userName: leave.user.name,
        userRole: leave.user.role,
        year: startYear, // You can choose to use either start or end year
        month: startMonth, // You can choose to use either start or end month
        startDate: startDate,
        endDate: endDate,
        status: leave.status,
        approvers: approvers,
      };
    });
  
    const dataToExport = [
      ["Leave ID", "User Name", "User Role", "Year", "Month", "Start Date", "End Date", "Status", "Approvers"],
      ...leaveReport.map((item) => [
        item.leaveId,
        item.userName,
        item.userRole,
        item.year,
        item.month,
        item.startDate,
        item.endDate,
        item.status,
        item.approvers,
      ]),
    ];
  
    const ws = XLSX.utils.aoa_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Leave Report");
  
    XLSX.writeFile(wb, "leave_report.xlsx");
  };
  

  const years = Array.from(new Set(timesheets.map(ts => ts.year))).sort();
  const months = Array.from(new Set(timesheets.map(ts => ts.month))).sort();
  const statuses = ["Fully Approved", "Rejected", "Ready"];
  const role = Array.from(new Set(users.map(ts => ts.role))).sort();
  const location = Array.from(new Set(users.map(ts => ts.location))).sort();
  const facility = Array.from(new Set(users.map(ts => ts.facility))).sort();
  const reportsTo = Array.from(new Set(users.map(ts => ts.reportsTo))).sort();

  const yearsLeave = Array.from(
    new Set(
      leaves
        .map((ts) => {
          const startDate = new Date(ts.startDate);
          // Log the startDate to ensure it's being parsed correctly
          
          // Check if the startDate is valid
          if (isNaN(startDate.getTime())) {
            console.warn(`Invalid date found: ${ts.startDate}`); // Warn if the date is invalid
            return null;
          }
          return startDate.getFullYear(); // Extract the year if valid
        })
        .filter((year) => year !== null) // Remove invalid years
    )
  ).sort(); // Sort the years
  
  
  
  const monthsLeave = Array.from(
    new Set(
      leaves.map((ts) => new Date(ts.startDate).getMonth()) // Get the 0-indexed month
    )
  )
    .map((monthIndex) => {
      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ];
      return months[monthIndex]; // Map the month index to the month name
    })
    .sort(); // Sort alphabetically, which is fine for months as "Jan", "Feb", etc.
  
  

  return (
    <>
 <div className="w-full sm:w-1/2 p-2">
 <Box sx={{ padding: 3 }}>
      <h1 style={{fontStyle:"bold", fontSize:"20px"}}>Download User Report</h1>

      {loadingUsers ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {noRecordsUsers && <Alert severity="warning">No records found with the selected filters.</Alert>}

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={userFilters.role}
                  label="Role"
                  onChange={(e) => handleUserFilterChange(e.target.value, 'role')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {role.map(role => (
                    <MenuItem key={role} value={role}>{role}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Location</InputLabel>
                <Select
                  value={userFilters.location}
                  label="Location"
                  onChange={(e) => handleUserFilterChange(e.target.value, 'location')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {location.map(location => (
                    <MenuItem key={location} value={location}>{location}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Facility</InputLabel>
                <Select
                  value={userFilters.facility}
                  label="Facility"
                  onChange={(e) => handleUserFilterChange(e.target.value, 'facility')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {facility.map(facility => (
                    <MenuItem key={facility} value={facility}>{facility}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Manager</InputLabel>
                <Select
                  value={userFilters.reportsTo}
                  label="Manager"
                  onChange={(e) => handleUserFilterChange(e.target.value, 'reportsTo')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {reportsTo.map(reportsTo => (
                    <MenuItem key={reportsTo} value={reportsTo}>{reportsTo}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <div style={{ marginTop: "20px" }}>
            <Button onClick={handleDownloadUserReport}>Download Report</Button>
          </div>
        </>
      )}
    </Box>
    </div>

    <div className="w-full sm:w-1/2 p-2">
        <Box sx={{ padding: 3 }}>
        <h1 style={{fontStyle:"bold", fontSize:"20px"}}>Download Timesheet Report</h1>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {noRecords && <Alert severity="warning">No records found with the selected filters.</Alert>}

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange(e.target.value, 'status')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={filters.year}
                  label="Year"
                  onChange={(e) => handleFilterChange(e.target.value, 'year')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={filters.month}
                  label="Month"
                  onChange={(e) => handleFilterChange(e.target.value, 'month')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {months.map(month => (
                    <MenuItem key={month} value={month.toString()}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <div style={{ marginTop: "20px" }}>
            <Button onClick={handleDownloadReport}>Download Report</Button>
          </div>
        </>
      )}
    </Box>
</div>

<div className="w-full sm:w-1/2 p-2">
<Box sx={{ padding: 3 }}>
<h1 style={{fontStyle:"bold", fontSize:"20px"}}>Download Leave Report</h1>

      {loadingLeaves || leaves.length === 0  ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {noRecordsLeave && <Alert severity="warning">No records found with the selected filters.</Alert>}

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={leaveFilters.status}
                  label="Status"
                  onChange={(e) => handleLeaveFilterChange(e.target.value, 'status')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {statuses.map(status => (
                    <MenuItem key={status} value={status}>{status}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Year</InputLabel>
                <Select
                  value={leaveFilters.year}
                  label="Year"
                  onChange={(e) => handleLeaveFilterChange(e.target.value, 'year')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {yearsLeave.map(year => (
                    <MenuItem key={year} value={year.toString()}>{year}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Month</InputLabel>
                <Select
                  value={leaveFilters.month}
                  label="Month"
                  onChange={(e) => handleLeaveFilterChange(e.target.value, 'month')}
                >
                  <MenuItem value="All">All</MenuItem>
                  {monthsLeave.map(month => (
                    <MenuItem key={month} value={month.toString()}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          <div style={{ marginTop: "20px" }}>
            <Button onClick={handleDownloadReportLeaves}>Download Report</Button>
          </div>
        </>
      )}
    </Box>

</div>

    
    </>
  );
};

export default TimesheetReportPage;
