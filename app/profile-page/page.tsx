"use client";

import { SetStateAction, useEffect, useState } from 'react';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Camera, Lock, LogOut, Mail, Phone, User } from 'lucide-react';

import { LinearProgress } from "@mui/material"; // For percentage bars
import { TrendingUp, TrendingDown, Users } from "lucide-react"; // For icons
import TimesheetComponent from "@/components/timesheet";
import LeaveManagementComponent from '@/components/leave';
import Footer from '@/components/footer';
import Header from '@/components/header';
import {SelectContent, SelectItem, SelectPortal, SelectTrigger, SelectValue } from '@radix-ui/react-select';
import { toast } from '@/hooks/use-toast';
import { useRouter } from "next/router";
import { EmployeeProvider, useEmployee } from '../context/EmployeeContext';
import Link from 'next/link';
import AdminLeaveManagementComponent from '@/components/leaveAdmin';

import * as XLSX from "xlsx"; // For exporting to Excel
import TimesheetApprovalComponent from '@/components/timeSheetApproval';
import AdminTimesheetApprovalComponent from '@/components/adminTimesheetApproval';
import LeaveApprovalComponent from '@/components/leaveApproval';
import Toast from '@/components/ui/toasMui';
import { useToast } from '../context/ToastContext';
import TimesheetReportPage from '@/components/reportComponent';
import { Select } from '@/components/ui/select';

const employees = [
  { id: 1, name: 'Alice Johnson', role: 'Software Engineer', department: 'Engineering' },
  { id: 2, name: 'Bob Smith', role: 'Product Manager', department: 'Product' },
  { id: 3, name: 'Charlie Brown', role: 'UX Designer', department: 'Design' },
  { id: 4, name: 'Diana Ross', role: 'HR Specialist', department: 'Human Resources' },
]
interface User {
  id: number; // or string, depending on your ID type
  name: string;
  role: string;
  department: string;
  location: string;
  reportsTo: string;
  createdAt: Date;
  // Add any additional fields your user objects have
}
type Employee = {
  id: number;
  name: string;
  role: string;
  department: string;
  location: string;
  reportsTo: string;
  createdAt: string; // Add this line if `createdAt` is a string (e.g., ISO date)
};



interface DeleteConfirmationModalProps {
  user: User;
  onCancel: () => void;
  onConfirm: (userId: number) => void; 
}


  

export default function ProfilePage() {

  const [isApprover] = useState(false);
  const [showDeletionCalendar, setShowDeletionCalendar] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [userMain, setUser] = useState<any>(null); // to store user data
  const [loading, setLoading] = useState(true); // loading state
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false); // simplified hook for admin role
  const [isHandler, setIsHandler] = useState(false); // simplified hook for admin role

  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [searchQuery, setSearchQuery] = useState<any>("");
  const [selectedRole, setSelectedRole] = useState<any>("");
  const [deleteUser, setDeleteUser] =useState<any>(null);  // Holds the user to delete
  const [refreshKey, setRefreshKey] = useState(0); // A state to trigger refresh
  const [selectedLocation, setSelectedLocation] = useState<any>("");
  const [isCardVisible, setIsCardVisible] = useState(false); // State to toggle the card visibility
    const [allUsers, setAllUsers] = useState([ { id: 1, name: 'Alice Johnson', role: 'Software Engineer', department: 'Engineering', location:"Kakamega", reportsTo: "Meshack Ariri" },
  ])
  const [toastOpen, setToastOpen] = useState(false);
  const [toastDuration, setToastDuration] = useState(3000); // Default 3 seconds
  const [toastMessage, setToastMessage] = useState("");
  const [toastSeverity, setToastSeverity] = useState<"success" | "error">("success");
  

  const { showToast } = useToast();

  const handleSuccessToast = () => {
    // Trigger success toast
    showToast("Success! Your operation was completed.", "success");
  };

  const handleErrorToast = () => {
    // Trigger error toast
    showToast("Error! Something went wrong.", "error");
  };

  const handleWarningToast = () => {
    // Trigger warning toast
    showToast("Warning! Please check your input.", "warning");
  };

  const handleInfoToast = () => {
    // Trigger info toast
    showToast("Info: Your session will expire soon.", "info");
  };

  // Fetch user details using the token
  const { setEmployee } = useEmployee();


  const handleEmployeeClick = (employee: { id: number, name: string }) => {
    setEmployee(employee); // Store employee data in context
  };



    
useEffect(() => {
  const token = localStorage.getItem("jwtToken"); // Get the token from localStorage

  if (!token) {
    setError("No token found");
    setLoading(false);
    return;
  }

  fetch("/api/users/me", {
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch user data");
      }
      return response.json();
    })
    .then((userData) => {
      const userId = userData.id;
      localStorage.setItem('userData', JSON.stringify(userData)); // Store user data in localStorage

      

      return fetch(`/api/users/${userId}`, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to fetch detailed user data");
      }
      return response.json();
    })
    .then((data) => {
      setUser(data); // Set the fetched user data
      const isAdmin = ["admin", "hr", "incharge", "po", "padm"].includes(data.role.toLowerCase());
      const isHandler = ["incharge", "po", "padm"].includes(data.role.toLowerCase());
      setIsHandler(isHandler)

      setIsAdmin(isAdmin); // Set admin status

      // If the user is an admin, fetch the list of all users
      if (isAdmin) {
        return fetch("/api/users", {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Failed to fetch all users data");
            }
            return response.json();
          })
          .then((allUsersData) => {
            setAllUsers(allUsersData); // Set all users data
          });
      }
    })
    .catch((err) => {
      setError(err.message); // Set error if any
    })
    .finally(() => {
      setLoading(false); // Stop loading in case of success or error
    });
}, [refreshKey]);
  
const handleDeleteUser = async (id: number) => {
  try {
    const response = await fetch(`/api/users/${id}`, {
      method: "DELETE",
    });


    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error deleting user:", errorData.message);
      handleErrorToast()
      return;
    }

    setRefreshKey((prevKey) => prevKey + 1);
    handleSuccessToast()

    setTimeout(() => {
      window.location.reload();
    }, 2000); // 2000 m    setDeleteUser(null); // Close the modal
    // Optionally refresh the user list
    // fetchUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("An error occurred while deleting the user.");
  }
};

const filteredUsers = allUsers.filter((user) => {
  const matchesSearch =
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase());
  const matchesRole = selectedRole ? user.role === selectedRole : true;
  const matchesLocation = selectedLocation
    ? user.location === selectedLocation
    : true;

  return matchesSearch && matchesRole && matchesLocation;
});


const locationAccess: Record<string, string[]> = {
  Kakamega: ["Kakamega"],
  Kisumu: ["Kisumu", "Nyamira"],
  Nyamira: ["Nyamira", "Kisii", "Migori"],
  // Add other HR locations and their accessible locations here
};

// Ensure userMain?.location is checked properly
const hrAccessibleLocations =
  userMain?.role === "HR" && userMain?.location && locationAccess[userMain.location]
    ? locationAccess[userMain.location]
    : [];

const filteredUsers2 = allUsers.filter((user) => {
  const matchesSearch =
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.department.toLowerCase().includes(searchQuery.toLowerCase());

  const matchesRole = selectedRole ? user.role === selectedRole : true;

  const matchesLocation = selectedLocation
    ? user.location === selectedLocation
    : true;

  const matchesManager =
    userMain?.role === "admin" ||
    userMain?.role === "HR" ||
    user.reportsTo === userMain?.name;

  const matchesHRLocation =
    userMain?.role === "HR" ? hrAccessibleLocations.includes(user.location) : true;

  return matchesSearch && matchesRole && matchesLocation && matchesManager && matchesHRLocation;
});



  // Export to Excel
  const exportToExcel = () => {
    const data = filteredUsers2.map((user) => ({
      Name: user.name,
      Role: user.role,
      Department: user.department,
      Location: user.location,
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    XLSX.writeFile(workbook, "Employees.xlsx");
  };


 // Predefined Managers and Locations
const predefinedManagers = ["Manager 1", "Manager 2", "Manager 3"];
const predefinedLocations = ["Location 1", "Location 2", "Location 3"];

const roleFields = {
  STAFF: [
    "Name", "Email", "Role", "Department", "Address", "Hire Date", "End Date", "Phone", 
    "Facility", "Location", "Manager", "Leave Days", "Title"
  ],
  "STAFF-PROJECT": [
    "Name", "Email", "Role", "Project", "Department", "Address", "Hire Date", 
    "Phone", "Location", "Leave Days", "Manager"
  ],
  INCHARGE: ["Name", "Email", "Role", "Department", "Reports To", "Phone", "Facility", "Location"],
  EMPLOYEE: ["Name", "Email", "Role", "Department", "Address", "Hire Date", "End Date", "Phone", "Location"]
} as const;

  // Type for role keys
  type Role = keyof typeof roleFields;
  
  // Function to generate Excel template for a selected role
  const generateExcelTemplate = (role: keyof typeof roleFields) => {
    const fields = roleFields[role];
  
    if (!fields) {
      alert("Invalid role selected");
      return;
    }
  
    // Create an empty row with all fields
    const data = [fields.reduce((acc, field) => ({ ...acc, [field]: "" }), {})];
  
    // Create the worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);
  
    // Add instructions in the first row
    XLSX.utils.sheet_add_aoa(worksheet, [
      [
        "Instructions: Please fill out the template below. Fields like Manager and Location have dropdowns. " +
        "Ensure Hire Date and End Date are in the format YYYY-MM-DD."
      ]
    ], { origin: "A1" });
  
    // Define data validation for Managers and Locations
    const rangeManagers = predefinedManagers.map((manager, i) => `A${i + 2}`).join(",");
    const rangeLocations = predefinedLocations.map((location, i) => `B${i + 2}`).join(",");
  
    worksheet["!dataValidations"] = {
      rules: [
        {
          type: "list",
          allowBlank: false,
          sqref: "L3:L100", // Assume Managers column starts at column L
          formula1: `"${predefinedManagers.join(",")}"`
        },
        {
          type: "list",
          allowBlank: false,
          sqref: "I3:I100", // Assume Locations column starts at column I
          formula1: `"${predefinedLocations.join(",")}"`
        }
      ]
    };
  
    // Add validation to required fields
    const requiredColumns = ["Name", "Email", "Role", "Hire Date"];
    requiredColumns.forEach((field, index) => {
      worksheet["!dataValidations"].rules.push({
        type: "custom",
        allowBlank: false,
        sqref: `${String.fromCharCode(65 + index)}3:${String.fromCharCode(65 + index)}100`, // Map columns A, B, C, etc.
        formula1: `ISNUMBER(${String.fromCharCode(65 + index)}3)` // Example validation rule
      });
    });
  
    // Create the workbook and add the sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `${role} Template`);
  
    // Write to Excel file
    XLSX.writeFile(workbook, `${role.toLowerCase()}_template.xlsx`);
  };

  // Component for Dropdown and Download Button
  const ExcelDownloadButton = () => {
    const [selectedRole, setSelectedRole] = useState<Role | ''>(''); // Type state as Role or empty string
  
    // Handle dropdown change
    const handleRoleChange = (value: string) => {
      setSelectedRole(value as Role); // Cast the string value to a Role type
    };
  
    // Trigger download based on selected role
    const handleDownload = () => {
      if (!selectedRole) {
        alert('Please select a role');
        return;
      }
      generateExcelTemplate(selectedRole);
    };
  }

  // Component for Dropdown and Download Button

  // Handle dropdown change
  const handleRoleChange = (value: string) => {
    setSelectedRole(value as Role); // Cast the string value to a Role type
  };

  // Trigger download based on selected role
  const handleDownload = () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }
    generateExcelTemplate(selectedRole);
  };



  ///Uploading the excell....

  const [file, setFile] = useState(null);
  
  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/users/bulkupload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload file.");

      const result = await response.json();
      alert(`Upload successful! ${result.createdUsers.length} users added.`);
    } catch (error) {
      console.error(error);
      alert("Error uploading file.");
    }
  }


const handleAddNewUser = () => {
  toast({
    title: "Nekee!!",
  });
};


const handleUpdateUser = (updatedUser: User) => {
  setAllUsers(allUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
  toast({
    title: "User Updated",
    description: `${updatedUser.name}'s information has been updated successfully.`,
  });
};




  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center">
      <div className="w-16 h-16 border-4 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
    </div>
  );

  // If loading, display the spinner; if error, display the error message
  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <div className="text-center text-red-500">{error}</div>;
  }

  const handleTabClick = (value: "personal" | "account" | "timesheet"| "timesheetManagement" | "leave" | "add" | "report") => {
    setActiveTab(value);
  };

  const user = {
    name: "Alice Johnson",
    email: "alice@example.com",
    role: isAdmin ? "Admin" : (isApprover ? "Approver" : "Employee"),
    department: "Engineering",
    joinDate: "2022-03-15",
    hireDate: "2020-01-10",
    phone: "+1 (555) 123-4567",
    manager: "John Doe",
    pay: "$80,000",
    height: "5'6\"",
    weight: "130 lbs",
    address: "123 Main St, Cityville, ST 12345",
    bio: "Passionate.",
  }

  const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({ user, onCancel, onConfirm }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 space-y-4 shadow-lg max-w-md w-full">
        <h2 className="text-xl font-semibold text-gray-900">Confirm Deletion</h2>
        <p className="text-gray-700">
          Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={() => onConfirm(user.id)}> {/* Pass only the user id */}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
  

  return (
    <EmployeeProvider>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
    

      <div className="container mx-auto p-4 sm:p-8" style={{ flex: 1, padding: "20px" }}>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-8">Hello {userMain.name}!</h1>
        <button
              onClick={() => setIsCardVisible(!isCardVisible)}
              className="w-full sm:w-auto p-2 bg-gray-300 rounded-full shadow-md focus:outline-none"
            >
              {/* You can add an icon or text for the menu button */}
              <span>{isCardVisible ? 'Hide Profile' : 'Show Profile'}</span>
            </button>
        <div className="grid gap-4 sm:gap-8 md:grid-cols-3">
       
        <div
              className={`transition-all duration-500 ease-in-out transform ${isCardVisible ? 'scale-100' : 'scale-0 absolute top-0 left-0 w-full sm:w-80 p-4 bg-white shadow-lg z-50'}`}
              style={{ position: isCardVisible ? 'relative' : 'absolute', top: 0, left: 0 }}
            >
 
          <Card className="md:col-span-1">
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src="/placeholder.svg?height=80&width=80" alt={user.name} />
                  <AvatarFallback>{user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-center sm:text-left">
                  <CardTitle>{userMain.name}</CardTitle>
                  <CardDescription>{userMain.email}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">

                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span>{userMain.role}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{userMain.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{userMain.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                  <span>Joined {user.joinDate}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Manager:</span>
                  <span>{userMain.reportsTo}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Address:</span>
                  <span>{userMain.address}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Leave Days:</span>
                  <span>{userMain.leaveDays}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">Location:</span>
                  <span>{userMain.location}</span>
                </div>
                {(userMain.role === "STAFF" || userMain.role === "INCHARGE") &&(
                                  <div className="flex items-center space-x-2">
                                  <span className="font-bold">Facility:</span>
                                  <span>{userMain.facility}</span>
                                </div>
                )}

                <div className="flex items-center space-x-2">
  <span className="font-bold">Hire Date:</span>
  <span>
    {new Intl.DateTimeFormat("en-US", { dateStyle: "long" }).format(
      new Date(userMain.hireDate)
    )}
  </span>
</div>
                {isAdmin && (

                <div className="flex items-center space-x-2">
                  <span className="font-bold">Leave Days:</span>
                  <span>{userMain.leaveDays}</span>
                </div>
                )}
              </div>
            </CardContent>
          </Card>
          </div>
          <div
      className={`transition-all duration-500 ease-in-out ${isCardVisible ? 'md:col-span-2' : 'md:col-span-3 w-full'}`}
    >        <Card className="mw-full">
            <Tabs defaultValue="personal" className="w-full">
            <CardHeader>
  <TabsList className="flex flex-wrap gap-2 p-2 rounded-md h-auto">
    <TabsTrigger
      value="personal"
      onClick={() => handleTabClick('personal')}
      className="px-4 py-2 rounded-md transition-colors"
      style={{
        backgroundColor: activeTab === 'personal' ? '#003366' : '#8B1F25',
        color: activeTab === 'personal' ? '#FFFFFF' : '#DDDDDD',
      }}
    >
      Personal Information
    </TabsTrigger>

    <TabsTrigger
      value="account"
      onClick={() => handleTabClick('account')}
      className="px-4 py-2 rounded-md transition-colors"
      style={{
        backgroundColor: activeTab === 'account' ? '#003366' : '#8B1F25',
        color: activeTab === 'account' ? '#FFFFFF' : '#DDDDDD',
      }}
    >
      Account Settings
    </TabsTrigger>

    {!isAdmin && (
      <TabsTrigger
        value="timesheet"
        onClick={() => handleTabClick('timesheet')}
        className="px-4 py-2 rounded-md transition-colors"
        style={{
          backgroundColor: activeTab === 'timesheet' ? '#003366' : '#8B1F25',
          color: activeTab === 'timesheet' ? '#FFFFFF' : '#DDDDDD',
        }}
      >
        Timesheet
      </TabsTrigger>
    )}

    <TabsTrigger
      value="leave"
      onClick={() => handleTabClick('leave')}
      className="px-4 py-2 rounded-md transition-colors"
      style={{
        backgroundColor: activeTab === 'leave' ? '#003366' : '#8B1F25',
        color: activeTab === 'leave' ? '#FFFFFF' : '#DDDDDD',
      }}
    >
      Leave Management
    </TabsTrigger>

    {isAdmin && (
      <>
        <TabsTrigger
          value="timesheetManagement"
          onClick={() => handleTabClick('timesheetManagement')}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: activeTab === 'timesheetManagement' ? '#003366' : '#8B1F25',
            color: activeTab === 'timesheetManagement' ? '#FFFFFF' : '#DDDDDD',
          }}
        >
          Manage Timesheets
        </TabsTrigger>

        <TabsTrigger
          value="add"
          onClick={() => handleTabClick('add')}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: activeTab === 'add' ? '#003366' : '#8B1F25',
            color: activeTab === 'add' ? '#FFFFFF' : '#DDDDDD',
          }}
        >
          Manage Employees
        </TabsTrigger>

        <TabsTrigger
          value="report"
          onClick={() => handleTabClick('report')}
          className="px-4 py-2 rounded-md transition-colors"
          style={{
            backgroundColor: activeTab === 'report' ? '#003366' : '#8B1F25',
            color: activeTab === 'report' ? '#FFFFFF' : '#DDDDDD',
          }}
        >
          Generate Reports
        </TabsTrigger>
      </>
    )}
  </TabsList>
</CardHeader>

              <CardContent>
                <TabsContent value="personal">
                  <form className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" defaultValue={userMain.name} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue={userMain.email} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" type="tel" defaultValue={userMain.phone} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Department</Label>
                        <Input id="email" type="email" defaultValue={userMain.department} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea id="bio" defaultValue={user.bio} />
                    </div>
                  </form>
                </TabsContent>
                
                <TabsContent value="account">
                  <form className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch id="two-factor" />
                      <Label htmlFor="two-factor">Enable Two-Factor Authentication</Label>
                    </div>
                    <Button type="submit">Update Password</Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="timesheet">
                <TimesheetComponent userId={userMain.id} isApprover={isApprover} />

                <TimesheetApprovalComponent userId={userMain.id} userRole={userMain.role}  name={userMain.name} title={userMain.title} />




              </TabsContent>
                        
              <TabsContent value="leave">
              <LeaveManagementComponent userId={userMain.id} isApprover={isAdmin} leaveDays={userMain.leaveDays} />

                <LeaveApprovalComponent userRole={userMain.role} userId={userMain.id} name={userMain.name} title={userMain.location} />

              </TabsContent>
              {isAdmin && (
               <TabsContent value="timesheetManagement">
                <TimesheetApprovalComponent userId={userMain.id} userRole={userMain.role} name={userMain.name} title={userMain.title}/>
             </TabsContent>
)}
              {isAdmin && (
                <>

<TabsContent value="add">
  <Card>
    <CardHeader>
      <CardTitle>Employee Directory</CardTitle>
      <CardDescription>Manage and view all employee information.</CardDescription>
    </CardHeader>

    {/* Stats Cards Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Total Employees */}
      <Card className="flex items-center justify-between p-4">
        <div>
          <p className="text-sm text-muted-foreground">Total Employees</p>
          <h2 className="text-2xl font-bold">{allUsers.length}</h2>
        </div>
        <Users className="w-8 h-8 text-blue-500" />
      </Card>

      {/* Dynamic Role Cards */}
      {["STAFF", "HR", "PADM", "INCHARGE", "STAFF PROJECT"].map((role) => {
        const roleCount = allUsers.filter((user) => user.role === role).length;
        const percentage = Math.round((roleCount / allUsers.length) * 100);
        const trend = percentage > 20 ? "up" : "down"; // Example trend logic

        return (
          <Card
            key={role}
            className="flex items-center justify-between p-4"
          >
            <div>
              <p className="text-sm text-muted-foreground">{role}</p>
              <h2 className="text-2xl font-bold">{roleCount}</h2>
              <div className="flex items-center space-x-2 mt-2">
                {trend === "up" ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
                <span className="text-sm text-muted-foreground">
                  {trend === "up" ? "+" : "-"}{Math.abs(percentage - 20)}%
                </span>
              </div>
            </div>
            <div className="w-24">
              <LinearProgress
                variant="determinate"
                value={percentage}
                color={trend === "up" ? "success" : "error"}
              />
            </div>
          </Card>
        );
      })}
    </div>

    <CardContent>
      {/* Search and Add Section */}
      <div className="flex justify-between items-center mb-4 max-w-full">
        <Input
          className="max-w-sm w-full"
          placeholder="Search employees..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {!isHandler && (
          <Button>
            <Link href={`/user`}>Add Employee</Link>
          </Button>
        )}
      </div>

      {/* Filters and Export Section */}
      <div className="flex flex-wrap justify-start space-x-4 mb-4 max-w-full overflow-x-auto">
        <select
          className="border rounded px-2 py-1 flex-shrink-0 w-full sm:w-auto"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
        >
          <option value="">Filter by Role</option>
          {[...new Set(allUsers.map((u) => u.role))].map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1 flex-shrink-0 w-full sm:w-auto"
          value={selectedLocation}
          onChange={(e) => setSelectedLocation(e.target.value)}
        >
          <option value="">Filter by Location</option>
          {[...new Set(allUsers.map((u) => u.location))].map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>

        <Button onClick={exportToExcel} className="w-full sm:w-auto">
          Download Excel
        </Button>




        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Shadcn Button */}
      <Button
        onClick={handleDownload}
        disabled={!selectedRole}
        variant="outline" // You can also use "solid" or other variants
        color="primary"
        size="lg" // You can choose the size that suits your design
      >
        Download Excel Template
      </Button>
    </div>

    <div>
      <Input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />
      <Button onClick={handleUpload}>Upload Excel</Button>
    </div>
      </div>

      {/* Employee List */}
      <div className="space-y-4 max-h-[400px] overflow-y-auto max-w-full">
        {filteredUsers2
      .sort((a, b) => {
    const dateA = new Date((a as any).createdAt); // Cast to `any` to access `createdAt`
    const dateB = new Date((b as any).createdAt); // Cast to `any` to access `createdAt`
    return dateB.getTime() - dateA.getTime(); // Compare dates
  })          .map((employee) => (
            <div
              key={employee.id}
              className="flex items-center justify-between p-4 border rounded-lg max-w-full flex-wrap"
            >
              <div className="flex items-center space-x-4 flex-shrink-0 w-full sm:w-auto">
                <Avatar>
                  <AvatarFallback>
                    {employee?.name.split(" ").map((n) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{employee.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {employee.role}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center sm:space-x-4 space-y-2 sm:space-y-0">
                <Badge className="flex-shrink-0">{employee.department}</Badge>
                <Button variant="outline" className="ml-2">
                  <Link href={`/user?id=${employee.id}`}>
                    View {employee.name}'s Profile
                  </Link>
                </Button>
                {userMain.role === "admin" && (
                  <Button
                    variant="destructive"
                    className="ml-2"
                    onClick={() => setDeleteUser(employee)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}

        {/* Confirmation Modal */}
        {deleteUser && (
          <DeleteConfirmationModal
            user={deleteUser} // Pass the entire user object
            onCancel={() => setDeleteUser(null)}
            onConfirm={() => handleDeleteUser(deleteUser.id)} // Directly call handleDeleteUser with user.id
          />
        )}
      </div>
    </CardContent>
  </Card>
</TabsContent>



<TabsContent value="report">
<Card>
  <CardHeader>
    <CardTitle>Report Generator</CardTitle>
    <CardDescription>Generate Reports</CardDescription>
  </CardHeader>
  <CardContent>
  <div className="flex flex-wrap justify-between items-center mb-4">
          <TimesheetReportPage/>Select

</div>


  </CardContent>
</Card>
</TabsContent>
</>
)}




              
              </CardContent>
              
            </Tabs>
          </Card>
          </div>
        </div>
      </div>



      <Footer />
    </div>
    </EmployeeProvider>
  );
}
