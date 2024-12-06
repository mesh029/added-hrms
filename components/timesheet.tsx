"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import React, { useState, useEffect } from "react";

interface TimesheetEntry {
  type: "Regular" | "Holiday" | "Sick" | "Annual";
  hours: string[]; // Keep as string to manage input value directly
  description: string;
}

interface TimesheetComponentProps {
  userId: number;
  isApprover: boolean;
}
interface ParsedEntry {
  date: string;
  hours: number;
  type: "Regular" | "Holiday" | "Sick" | "Annual";
  description: string;
}


const TimesheetComponent: React.FC<TimesheetComponentProps> = ({ userId, isApprover }) => {

  const [holidaysAdded, setHolidaysAdded] = useState(false);
  const [kenyaHolidays, setKenyaHolidays] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timesheetEntries, setTimesheetEntries] = useState<TimesheetEntry[]>([
    { type: "Regular", hours: [], description: "" },
  ]);
  const [status, setStatus] = useState<"Draft" | "Ready">("Draft"); 

  const isWeekend = (dayIndex: number) => {
    // Days of the week: 0 (Sunday) - 6 (Saturday)
    const dayOfWeek = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayIndex + 1).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday (0) or Saturday (6)
  };

  // Load initial state from local storage
  useEffect(() => {
    const savedTimesheet = localStorage.getItem("timesheetEntries");
    const savedStatus = localStorage.getItem("timesheetStatus");

    if (savedTimesheet) {
      setTimesheetEntries(JSON.parse(savedTimesheet));
    }

    if (savedStatus) {
      setStatus(savedStatus as "Draft" | "Ready");
    } else {
      generateTimesheetEntries();
    }
  }, []);

  // Save timesheet and status to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("timesheetEntries", JSON.stringify(timesheetEntries));
    localStorage.setItem("timesheetStatus", status);
  }, [timesheetEntries, status]);

  
  useEffect(() => {
    generateTimesheetEntries();
  }, [currentMonth]);

  const generateTimesheetEntries = () => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    setTimesheetEntries([
      { type: "Regular", hours: Array(daysInMonth).fill("0.0"), description: "" }
    ]);
  };

  
  const handleHoursChange = (typeIndex: number, dayIndex: number, value: string) => {
    const formattedValue = value.match(/^\d*\.?\d{0,2}/)?.[0] || "0.0";
    const updatedEntries = [...timesheetEntries];
    updatedEntries[typeIndex].hours[dayIndex] = formattedValue; 
    setTimesheetEntries(updatedEntries);
  };
  const handleAddRow = (type: "Regular" | "Holiday" | "Sick" | "Annual", holidays: string[] = []) => {
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  
    // Create the new row
    const newEntry: TimesheetEntry = {
      type: type,
      hours: Array(daysInMonth).fill("0.0"), // Fill all days with "0.0"
      description: type === "Holiday" ? `National Holiday` : "",
    };
  
    if (type === "Holiday") {
      // Fill holiday days with predefined values from holidays array
      holidays.forEach((holiday) => {
        const holidayDay = parseInt(holiday.split("-")[2], 10); // Extract the day from holiday date (e.g., "12" from "2024-12-12")
        const holidayIndex = holidayDay - 1; // Convert to zero-based index
  
        // Check if the holiday index is valid
        if (holidayIndex >= 0 && holidayIndex < newEntry.hours.length) {
          newEntry.hours[holidayIndex] = "8.5"; // Mark holiday with 8.5 hours
        }
      });
    }
  
    // Add the new row to the timesheet entries
    setTimesheetEntries((prevEntries) => [...prevEntries, newEntry]);
  };
  

  const handleDeleteRow = (index: number) => {
    const updatedEntries = timesheetEntries.filter((_, idx) => idx !== index);
    setTimesheetEntries(updatedEntries);
  };

  const handleTypeChange = (typeIndex: number, newType: "Regular" | "Holiday" | "Sick" | "Annual") => {
    // Check if this day already has the same type of entry
    const hasEntryForDay = timesheetEntries.some(
      (entry) => entry.type === newType && entry.hours.some((hour) => hour !== "0.0")
    );

    if (!hasEntryForDay || timesheetEntries[typeIndex].type === newType) {
      const updatedEntries = [...timesheetEntries];
      updatedEntries[typeIndex].type = newType;
      setTimesheetEntries(updatedEntries);
    }
  };
  const handleSubmit = async () => {
    if (status !== "Ready") {
      alert("Please change the timesheet status to 'Ready' before submitting.");
      return;
    }
  
    const parsedEntries: ParsedEntry[] = [];
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const uniqueDays = new Set<string>();
  
    // Loop through all timesheet entries
    timesheetEntries.forEach((entry) => {
      entry.hours.forEach((dayValue, dayIndex) => {
        const currentDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayIndex + 1);
        const dayOfWeek = currentDay.getDay();
        const entryDate = currentDay.toLocaleDateString("en-CA");
  
        // Check if this day is a weekend or not
        const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
  
        // Check if it's a holiday
        const isHolidayDay = kenyaHolidays.some(
          (holiday) => holiday === currentDay.toISOString().split("T")[0]
        );
  
        // Skip weekends unless they are explicitly included (e.g., holidays)
        if (isWeekendDay && !isHolidayDay) return;
  
        // Include valid days with non-zero hours and ensure no duplicate entries for the same day
        if (dayValue !== "0.0" && dayValue.trim() !== "" && !uniqueDays.has(entryDate)) {
          uniqueDays.add(entryDate);
          parsedEntries.push({
            date: entryDate,
            hours: parseFloat(dayValue),
            type: entry.type,
            description: entry.description || "",
          });
        }
      });
    });
  
    console.log("Parsed Entries:", parsedEntries);
  
    try {
      const response = await fetch("http://localhost:3030/api/timesheets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          userId,
          year: currentMonth.getFullYear(),
          month: currentMonth.getMonth() + 1,
          entries: parsedEntries,
          status,
        }),
      });
  
      if (response.ok) {
        const data = await response.json();
        console.log("Timesheet submitted:", data);
        alert("Timesheet submitted successfully!");
      } else {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        try {
          const errorJson = JSON.parse(errorText);
          alert(`Error submitting timesheet: ${errorJson.message || errorJson.error || "Unknown error"}`);
        } catch {
          alert(`Error submitting timesheet: ${errorText || "Unknown error"}`);
        }
      }
    } catch (err) {
      console.error("Network error:", err);
      alert("Network error. Please try again.");
    }
  };
  
  
  
  
  
  
  // Function to calculate weekdays (Monday to Friday) in a given month
  function getWeekdaysInMonth(date: Date): number {
    const year = date.getFullYear();
    const month = date.getMonth();
    let weekdaysCount = 0;
  
    // Loop through all days in the month and count weekdays
    for (let day = 1; day <= new Date(year, month + 1, 0).getDate(); day++) {
      const currentDay = new Date(year, month, day);
      const dayOfWeek = currentDay.getDay();
      
      // Count weekdays (Monday to Friday)
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        weekdaysCount++;
      }
    }
  
    return weekdaysCount;
  }
  
  
  

  const calculateTotalHours = () => {
    return timesheetEntries.reduce((total, entry) => {
      return total + entry.hours.reduce((sum, hour) => sum + parseFloat(hour), 0);
    }, 0).toFixed(2);
  };

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    const dayName = date.toLocaleString("default", { weekday: "short" });
    const isWeekend = date.getDay() === 0 || date.getDay() === 6; 
    const dayStyle = isWeekend ? "text-red-500" : "";

    return (
      <div key={i} className={`flex flex-col items-center ${dayStyle}`}>
        <div>{dayName}</div>
        <div>{i + 1}</div>
      </div>
    );
  });

// Example usage: Add a holiday row using the existing function
const addHolidayRow = () => {
  const kenyaHolidays = [
    "2024-12-12", // Example holiday
    "2024-12-25", // Example holiday
    "2024-12-26", // Example holiday
    "2024-12-31", // Example holiday
  ];

  setKenyaHolidays(kenyaHolidays)
  // Use the handleAddRow function to add a holiday row
  handleAddRow("Holiday", kenyaHolidays);
};
  useEffect(() => {
    if (!holidaysAdded) {
      addHolidayRow(); // Add the holiday rows once
      setHolidaysAdded(true); // Mark as added to prevent future additions
    }
  }, [timesheetEntries, holidaysAdded]); // Ensure it only runs when necessary
  
  return (
    <div className="space-y-4">
      <span className="text-lg font-semibold">
        {currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()}
      </span>

      <Select value={status}  onValueChange={(value) => setStatus(value as "Draft" | "Ready")}>
        <SelectTrigger>
          <SelectValue>{status}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Draft">Draft</SelectItem>
          <SelectItem value="Ready">Ready</SelectItem>
        </SelectContent>
      </Select>

      <div className="overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Time Code</TableHead>
              {daysArray.map((day, index) => (
                <TableHead key={index}>{day}</TableHead>
              ))}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {timesheetEntries.map((entry, typeIndex) => (
              <TableRow key={typeIndex}>
                <TableCell>
                  <Select value={entry.type} onValueChange={(value) => handleTypeChange(typeIndex, value as "Regular" | "Holiday" | "Sick" | "Annual")}>
                    <SelectTrigger>
                      <SelectValue>{entry.type} </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Regular">Regular</SelectItem>
                      <SelectItem value="Holiday">Holiday</SelectItem>
                      <SelectItem value="Sick">Sick</SelectItem>
                      <SelectItem value="Annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                {entry.hours.map((hour, dayIndex) => {
  const isHoliday = entry.type === "Holiday";
  const isWeekendDay = isWeekend(dayIndex); // Assuming you have this utility function
  
  // Check if the current day is a holiday
  const isHolidayDay = kenyaHolidays.some((holiday) => {
    const holidayDay = parseInt(holiday.split("-")[2], 10); // Extract the day from holiday date
    return holidayDay - 1 === dayIndex; // Check if this is the current holiday
  });

  // Disable input for holidays and weekends for all rows
  const isHolidayOrWeekend = isHoliday || isWeekendDay || isHolidayDay;
  
  // Check if the field is empty (if the hour is not filled or is the default placeholder value)
  const isRequired = !hour || hour === "0.0"; // If the hour is not filled or is the default placeholder value
  
  // Should highlight empty fields in red except for holiday days
  const shouldHighlight = !isHolidayDay && !isHolidayOrWeekend && isRequired;

  return (
    <TableCell key={dayIndex}>
      <Input
        type="text"
        value={hour}
        onChange={(e) => handleHoursChange(typeIndex, dayIndex, e.target.value)}
        placeholder="0.0"
        className="w-16 h-8 text-sm text-center"
        disabled={isHolidayOrWeekend} // Disable input for holidays and weekends
        style={{
          backgroundColor: isHolidayDay
            ? "#ffeb3b"  // Yellow background for holidays
            : isWeekendDay
            ? "lightgrey"  // Light grey for weekends
            : "white", // White background for other days
          border: shouldHighlight ? "1px solid #ff6666" : "none", // Red border for empty fields (except holidays)
        }}
      />
    </TableCell>
  );
})}


                <TableCell>
                  <Button variant="outline" onClick={() => handleDeleteRow(typeIndex)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between">
        <span className="text-lg font-semibold">Total Hours: {calculateTotalHours()}</span>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={handleAddRow}>Add Time Code</Button>
        <Button variant="outline" onClick={handleSubmit}>Submit Timesheet</Button>
      </div>
    </div>
  );
};

export default TimesheetComponent
