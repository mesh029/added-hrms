import React, { useState, useEffect } from "react";
import * as XLSX from 'xlsx';
import { Button } from "./ui/button";
import { Select, MenuItem, FormControl, InputLabel, CircularProgress, Grid, Box } from '@mui/material';

interface Approval {
  approverName: string;
  approverRole: string;
  status: string;
  timestamp: Date;
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

const TimesheetReportPage = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [filters, setFilters] = useState({
    status: 'All',
    year: 'All',
    month: 'All',
  });
  const [loading, setLoading] = useState(true);

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

  const handleFilterChange = (value: string, field: string) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters, [field]: value };
      applyFilters(newFilters);
      return newFilters;
    });
  };

  const applyFilters = (newFilters: { status: string; year: string; month: string }) => {
    const { status, year, month } = newFilters;
    let filtered = [...timesheets];

    if (year !== "All") {
      filtered = filtered.filter(ts => ts.year.toString() === year);
    }

    if (month !== "All") {
      filtered = filtered.filter(ts => ts.month.toString() === month);
    }

    if (status !== "All") {
      filtered = filtered.filter(ts => ts.status === status);
    }

    setFilteredTimesheets(filtered);
  };

  const handleDownloadReport = () => {
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

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "buffer" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "timesheet_report.xlsx";
    link.click();
  };

  const years = Array.from(new Set(timesheets.map(ts => ts.year))).sort();
  const months = Array.from(new Set(timesheets.map(ts => ts.month))).sort();
  const statuses = ["Fully Approved", "Rejected", "Ready"];

  return (
    <Box sx={{ padding: 3 }}>
      <h1>Download Timesheet Report</h1>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "20px" }}>
          <CircularProgress />
        </div>
      ) : (
        <>
          {/* Filters section */}
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange(e.target.value, 'status')}
                  sx={{ width: 'auto' }}
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
                  sx={{ width: 'auto' }}
                >
                  <MenuItem value="All">All</MenuItem>
                  {years.map(year => (
                    <MenuItem key={year} value={year}>{year}</MenuItem>
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
                  sx={{ width: 'auto' }}
                >
                  <MenuItem value="All">All</MenuItem>
                  {months.map(month => (
                    <MenuItem key={month} value={month}>{month}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Download Button */}
          <div style={{ marginTop: "20px" }}>
            <Button onClick={handleDownloadReport}>Download Report</Button>
          </div>
        </>
      )}
    </Box>
  );
};

export default TimesheetReportPage;
