"use client"

import { useState, useEffect, Suspense } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format, parseISO } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarIcon, User, Briefcase, Mail, Scale, Ruler, MapPin, Users, FileText, Edit2, Save, X, Clock, Calendar, Send, ArrowLeft, Phone, Hospital, Map, LampDesk } from 'lucide-react'
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import Footer from "@/components/footer"
import Header from "@/components/header"
import AdminLeaveManagementComponent from "@/components/leaveAdmin"
import Link from "next/link"


import dynamic from 'next/dynamic';
import FacilitiesAndLocationsInput from "@/components/facilitiesInput"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  title: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  role: z.string().min(1, { message: "Role is required." }),
  department: z.string().min(1, { message: "Department is required." }),
  address: z.string().min(1, { message: "Address is required." }),
  hireDate: z.date({ required_error: "Hire date is required." }),
  endDate: z.date().optional(),
  reportsTo: z.string().min(1, { message: "Reports To is required." }),
  manager: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  leaveDays: z.number().min(0, { message: "Leave days must be a positive number." }),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number cannot exceed 15 digits"),
  facility: z.string().min(1, { message: "Facility is required." }),
  location: z.string().min(1, { message: "Location is required." }),
  pay: z.number().min(4, { message: "Pay must be atleast 4 digits" }),


})

type UserDocument = {
  id: string
  name: string
  type: string
  uploadDate: string
}

type Timesheet = {
  id: string
  date: string
  hoursWorked: number
  project: string
}

type Leave = {
  id: string
  startDate: string
  endDate: string
  type: string
  status: string
}

const sampleTimesheets: Timesheet[] = [
  { id: "1", date: "2023-05-01", hoursWorked: 8, project: "Project A" },
  { id: "2", date: "2023-05-02", hoursWorked: 7.5, project: "Project B" },
  { id: "3", date: "2023-05-03", hoursWorked: 8, project: "Project A" },
  { id: "4", date: "2023-05-04", hoursWorked: 6, project: "Project C" },
  { id: "5", date: "2023-05-05", hoursWorked: 8, project: "Project B" },
]

const statusVariantMap = {
  Approved: "default", // Map "success" to "default" or any existing variant
  Pending: "secondary", // Map "warning" to "secondary"
  Rejected: "destructive",
};

const sampleLeaves: Leave[] = [
  { id: "1", startDate: "2023-04-10", endDate: "2023-04-12", type: "Vacation", status: "Approved" },
  { id: "2", startDate: "2023-05-15", endDate: "2023-05-15", type: "Sick Leave", status: "Approved" },
  { id: "3", startDate: "2023-06-01", endDate: "2023-06-02", type: "Personal", status: "Pending" },
  { id: "4", startDate: "2023-07-20", endDate: "2023-07-25", type: "Vacation", status: "Approved" },
]

const predefinedFacilities = [
  "Nairobi Hospital", "Kenyatta National Hospital", "Aga Khan University Hospital",
  "Mater Hospital", "MP Shah Hospital", "Karen Hospital",
  "Gertrude's Children's Hospital", "Coptic Hospital", 
  "Nairobi Women's Hospital", "The Nairobi West Hospital"
];

const predefinedLocations = [
  "Nairobi", "Mombasa", "Kisumu", "Eldoret", "Nakuru",
  "Thika", "Malindi", "Garissa", "Nyeri", "Kitale"
];

export default function UserProfilePage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isEditMode, setIsEditMode] = useState(true)
  const [isNewUser, setNewUser] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [userDocuments, setUserDocuments] = useState<UserDocument[]>([])
  const [timesheets, setTimesheets] = useState<Timesheet[]>(sampleTimesheets)
  const [leaves, setLeaves] = useState<Leave[]>(sampleLeaves)
  const [managers, setManagers] = useState([]); // Store filtered managers
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter()
  const [facilitySearch, setFacilitySearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);  const [token, setToken] = useState<string | null>(null);  const { toast } = useToast()

  
  const locations = [
    "Kisumu",
    "Nyamira",
    "Kisii",
    "Migori",
    "Nyamira",
    "Kakamega",
    "Vihiga",
  ];
  
  type Role = "INCHARGE" | "PADM" | "PO" | "STAFF" | "HR";

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title:"",
      email: "",
      role: "",
      department: "",
      address: "",
      hireDate: new Date(),
      reportsTo: "PATH",
      manager: "",
      weight: "",
      height: "",
      leaveDays: 0,
      location: "PATH",
      phone: "",
      facility:"PATH",
      pay: 5000
    },
  })
  const [selectedRole, setSelectedRole] = useState<Role | "">("");

  const { register, handleSubmit, formState, setValue } = form; // Destructure necessary methods from form
  const { errors } = formState;
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);  // Set searchParams when on client-side
    }
  }, []);

  useEffect(() => {
    if (searchParams !== null) {  // Null check to ensure searchParams is available
      const id = searchParams.get("id");
      setUserId(id);
      if (id) {
        // Start loading data when 'id' is available
        fetchUserData(id);
        setNewUser(false)
        setIsEditMode(false)
      } else {
        // Handle new user logic
        setLoading(false);
      }
    }
  }, [searchParams]); 
  const fetchUserData = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3030/api/users/${id}`)
      if (!response.ok) throw new Error("Failed to fetch user data")
      const userData = await response.json()
      form.reset(userData)
         // Explicitly update selectedRole to match the reset value
         setSelectedRole(userData.role as Role);
    } catch (error) {
      console.error("Error fetching user data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user data. Please try again.",
        variant: "destructive",
      })
    }
  }


  useEffect(() => {
    const token = localStorage.getItem("jwtToken");
    setToken(token)


    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    const fetchManagers = async () => {
      try {
        const response = await fetch("http://localhost:3030/api/users", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }

        const allUsers = await response.json();

        // Filter users with roles 'admin' or 'approver'
        const filteredManagers = allUsers.filter((user: any) =>
          ["admin", "approver", "incharge", "po"].includes(user.role.toLowerCase())
        );

        setManagers(filteredManagers);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message); // Extract the error message
        } else {
          setError("An unknown error occurred");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, []);

  const fetchUserDocuments = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}/documents`)
      if (!response.ok) throw new Error("Failed to fetch user documents")
      const documents = await response.json()
      setUserDocuments(documents)
    } catch (error) {
      console.error("Error fetching user documents:", error)
      toast({
        title: "Error",
        description: "Failed to fetch user documents. Please try again.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`http://localhost:3030/api/users/${userId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to save user data")

        console.log("something went wrong")


      toast({
        title: "Success",
        description: "User updated successfully",
      })
      console.log("successfull champ!!!")
      setIsEditMode(false)
    } catch (error) {
      console.error("Error saving user data:", error)
      toast({
        title: "Error",
        description: "Failed to save user data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const onSubmit2 = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      // For creating a new user, the endpoint should be the "create user" route
      console.log("heres your token", token)
      const response = await fetch('http://localhost:3030/api/users', {
        method: 'POST', // Change to POST for creating a new user
        headers: {
            "Authorization": `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values), // Send form data as the request body
      })
  
      if (!response.ok) throw new Error('Failed to create new user')
  
      // Handle successful response (e.g., show success message, etc.)
      const responseData = await response.json()
      console.log('User created successfully:', responseData)
  
      toast({
        title: 'Success',
        description: `User created successfully. Default password: ${responseData.defaultPassword}`, // Show default password if needed
      })

      alert("USer Created!!!")
  
      setIsEditMode(false) // Switch to view mode after successful creation
      setNewUser(false)

    } catch (error) {
      console.error('Error creating new user:', error)
      toast({
        title: 'Error',
        description: 'Failed to create new user. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }
  

  const toggleEditMode = () => {
    setIsEditMode(!isEditMode)
  }

  if (loading) {
    return <div>Loading...</div>;  // Render loading state while waiting for the data
  }



  const handleRoleChange = (role: Role) => {
    setSelectedRole(role);
    form.setValue("role", role); // Update the form state
  };
  

  return (
    <Suspense fallback={<div>Loading user profile...</div>}>
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
    <Header/>
    <div className="container mx-auto p-4 sm:p-8" style={{ flex: 1, padding: "20px" }}>

    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
        {isNewUser ? (
            <>
  <CardTitle>Create New User</CardTitle>
  <CardDescription>Add New user to PATH HRMS</CardDescription>
  </>


) : (
  <>
    <CardTitle>Employee Profile</CardTitle>
    <CardDescription>View and manage employee information</CardDescription>
  </>
)}
        </div>

{isNewUser ? (
<>
<Link href={`/profile-page`}>

<Button>

<ArrowLeft className="mr-2 h-4 w-4" /> Back to Admin Panel
  </Button>
  </Link>

</>
) : (
  <Button onClick={toggleEditMode} variant="outline">
    {isEditMode ? (
      <>
        <X className="mr-2 h-4 w-4" /> Cancel
      </>
    ) : (
      <>
        <Edit2 className="mr-2 h-4 w-4" /> Edit Profile
      </>
    )}
  </Button>
)}
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src="/placeholder-avatar.jpg" alt={form.getValues("name")} />
              <AvatarFallback>{form.getValues("name").slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-bold">{form.getValues("name")}</h2>
              <p className="text-muted-foreground">{form.getValues("role")}</p>
            </div>
          </div>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList>
              <TabsTrigger value="personal">Personal Info</TabsTrigger>
              <TabsTrigger value="employment">Employment</TabsTrigger>
              {!isNewUser ? (
                <>
  <TabsTrigger value="documents">Documents</TabsTrigger>
  <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
  <TabsTrigger value="leaves">Leaves</TabsTrigger>
  </>
) : null}

            </TabsList>
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <div className="relative">
                    <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      placeholder="Brian Odhiambo"
                      className="pl-8 border-blue-300 focus:border-blue-500"
                      {...form.register("name")}
                      disabled={!isEditMode}
                    />
                  </div>
                  {form.formState.errors.name && (
                    <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Controller
                    name="title"
                    control={form.control}
                    defaultValue={form.getValues("title") || ""}
                    render={({ field, fieldState: { error } }) => (
                      <>
                      <Select
 onValueChange={(value) => {
  field.onChange(value); // Update the form's state
}}                        value={field.value || ""} // Controlled component value
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={`border-blue-300 focus:border-blue-500 ${error ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select Title" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="Health Worker">Health Worker</SelectItem>
                          <SelectItem value="PADM">HR</SelectItem>
                          <SelectItem value="PO">Facility Incharge</SelectItem>
                          <SelectItem value="STAFF">Volunteer</SelectItem>
                          <SelectItem value="HR">Program Officer M&E</SelectItem>

                        </SelectContent>
                      </Select>
                    </>
                    )}
                  />
                  {form.formState.errors.title && <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                  }
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      placeholder="brian@example.com"
                      className="pl-8 border-blue-300 focus:border-blue-500"
                      {...form.register("email")}
                      disabled={!isEditMode}
                    />
                  </div>
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Textarea
                    id="address"
                    placeholder="187 Mega City, Kisumu, Kenya"
                    className="pl-8 min-h-[80px] border-blue-300 focus:border-blue-500"
                    {...form.register("address")}
                    disabled={!isEditMode}
                  />
                </div>
                {form.formState.errors.address && (
                  <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <div className="relative">
                    <Scale className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="weight"
                      placeholder="70"
                      className="pl-8 border-blue-300 focus:border-blue-500"
                      {...form.register("weight")}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <div className="relative">
                    <Ruler className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="height"
                      placeholder="175"
                      className="pl-8 border-blue-300 focus:border-blue-500"
                      {...form.register("height")}
                      disabled={!isEditMode}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="employment" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Controller
                    name="role"
                    control={form.control}
                    defaultValue={form.getValues("role") || ""}
                    render={({ field, fieldState: { error } }) => (
                      <>
                      <Select
 onValueChange={(value) => {
  field.onChange(value); // Update the form's state
  handleRoleChange(value as Role); // Update the local state
}}                        value={field.value || ""} // Controlled component value
                        disabled={!isEditMode}
                      >
                        <SelectTrigger className={`border-blue-300 focus:border-blue-500 ${error ? "border-red-500" : ""}`}>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="INCHARGE">INCHARGE</SelectItem>
                          <SelectItem value="PADM">PADM</SelectItem>
                          <SelectItem value="PO">PO</SelectItem>
                          <SelectItem value="STAFF">STAFF</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>


                        </SelectContent>
                      </Select>
                    </>
                    )}
                  />
                  {form.formState.errors.role && <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
                  }
                </div>
                <div className="space-y-2">
  <Label htmlFor="department">Department</Label>
  <Controller
    name="department"
    control={form.control}
    defaultValue={form.getValues("department") || ""} // Ensure a default value
    render={({ field, fieldState: { error } }) => (
      <>
        <Select
          onValueChange={field.onChange}
          value={field.value || ""} // Controlled component value
          disabled={!isEditMode}
        >
          <SelectTrigger className={`border-blue-300 focus:border-blue-500 ${error ? "border-red-500" : ""}`}>
            <SelectValue placeholder="Select department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Volunteering">Volunteering</SelectItem>
            <SelectItem value="Health Workers">Health Workers</SelectItem>
            <SelectItem value="HR">Human Resources</SelectItem>
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-red-500">{error.message}</p>}
      </>
    )}
  />
</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


{/* Conditional inputs */}
{["INCHARGE", "STAFF", "HR", "PO"].includes(selectedRole) && (
      <div className="space-y-2">
      <Label htmlFor="location">Location</Label>
        <Map className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

      <div className="relative">
      <Map className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />

<Controller
control={form.control}
name="location"
rules={{ required: "Please select a location" }}
defaultValue={form.getValues("location") || ""} // Set the default value from the database or any fallback
render={({ field }) => (
  <select
    id="location"
    className="pl-8 border-blue-300 focus:border-blue-500 w-full"
    {...field}
    disabled={!isEditMode}
  >
    <option value="" disabled>
      Select a location
    </option>
    {locations.map((location, index) => (
      <option key={index} value={location}>
        {location}
      </option>
    ))}
  </select>
)}
/>


      </div>
      {errors.location && (
        <p className="text-red-500">{errors.location.message}</p>
      )}
    </div>
      )}

      {["INCHARGE", "STAFF"].includes(selectedRole) && (
                    <div className="space-y-2">
                    <Label htmlFor="facility">Facility</Label>
                    <div className="relative">
                      <Hospital className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="facility"
                        placeholder="Saint John"
                        className="pl-8 border-blue-300 focus:border-blue-500"
                        {...form.register("facility")}
                        disabled={!isEditMode}
                      />
                    </div>
                  
                  </div>
      )}
      {["STAFF","INCHARGE"].includes(selectedRole) && (
        <>
                                  <div className="space-y-2">
   
                                  <label htmlFor="reportsTo">Reports To</label>
                                        {loading ? (
                                          <p>Loading...</p>
                                        ) : (
                                          <Controller
                                            control={form.control} // Bind the Controller to the form control
                                            name="reportsTo" // Specify the name of the field in the form
                                            rules={{ required: "Please select a manager" }} // Optional validation
                                            defaultValue={form.getValues("reportsTo") || ""}
                                            render={({ field }) => (
                                              <select
                                                id="manager"
                                                className="pl-8 border-blue-300 focus:border-blue-500 w-full"
                                                {...field} // Spread the field props to connect it with react-hook-form
                                                disabled={!isEditMode}
                                              >
                                                <option value="" disabled>
                                                  Select a manager
                                                </option>
                                                {managers.map((manager: any) => (
                                                  <option key={manager.id} value={manager.name}>
                                                    {manager.name}
                                                  </option>
                                                ))}
                                              </select>
                                            )}
                                          />
                                        )}
                                                       {form.formState.errors.reportsTo && (
                                                      <p className="text-sm text-red-500">{form.formState.errors.reportsTo.message}</p>
                                                    )}
                                  
                                                  </div>



<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div className="space-y-2">
  <Label>Hire Date</Label>
  <Controller
    name="hireDate"
    control={form.control}
    render={({ field }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
            disabled={!isEditMode}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date > new Date() || date < new Date("1900-01-01")
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )}
  />
  {form.formState.errors.hireDate && (
    <p className="text-sm text-red-500">{form.formState.errors.hireDate.message}</p>
  )}
</div>
<div className="space-y-2">
  <Label>End Date</Label>
  <Controller
    name="endDate"
    control={form.control}
    render={({ field }) => (
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !field.value && "text-muted-foreground"
            )}
            disabled={!isEditMode}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <CalendarComponent
            mode="single"
            selected={field.value}
            onSelect={field.onChange}
            disabled={(date) =>
              date < new Date(form.getValues("hireDate"))
            }
            initialFocus
          />
        </PopoverContent>
      </Popover>
    )}
  />
</div>
<div className="space-y-2">
                <Label htmlFor="leaveDays">Leave Days</Label>
                <Input
                  id="leaveDays"
                  type="number"
                  placeholder="20"
                  className="border-blue-300 focus:border-blue-500"
                  {...form.register("leaveDays", { valueAsNumber: true })}
                  disabled={!isEditMode}
                />
                {form.formState.errors.leaveDays && (
                  <p className="text-sm text-red-500">{form.formState.errors.leaveDays.message}</p>
                )}
              </div>
</div>
</>
      )}

              <div className="space-y-2">
  <Label htmlFor="phoneNumber">Phone Number</Label>
  <div className="relative">
    <Phone className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
    <Input
      id="phoneNumber"
      placeholder="0738238129"
      className="pl-8 border-blue-300 focus:border-blue-500"
      {...form.register("phone")}
      disabled={!isEditMode}
    />
  </div>
</div>


                <div className="space-y-2">
                </div>
              </div>

            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Uploaded Documents</h3>
                {userDocuments.length > 0 ? (
                  <ul className="space-y-2">
                    {userDocuments.map((doc) => (
                      <li key={doc.id} className="flex items-center justify-between p-2 bg-muted rounded-md">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-blue-500" />
                          <span>{doc.name}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{doc.type}</Badge>
                          <span className="text-sm text-muted-foreground">{doc.uploadDate}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">No documents uploaded yet.</p>
                )}
              </div>
              {isEditMode && (
                <div className="space-y-2">
                  <Label htmlFor="document">Upload New Document</Label>
                  <Input id="document" type="file" className="border-blue-300 focus:border-blue-500" />
                </div>
              )}
            </TabsContent>
            <TabsContent value="timesheets" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Timesheet History</h3>
                {timesheets.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Hours Worked</TableHead>
                        <TableHead>Project</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {timesheets.map((timesheet) => (
                        <TableRow key={timesheet.id}>
                          <TableCell>{format(parseISO(timesheet.date), "PPP")}</TableCell>
                          <TableCell>{timesheet.hoursWorked}</TableCell>
                          <TableCell>{timesheet.project}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No timesheet entries found.</p>
                )}
              </div>
            </TabsContent>
            <TabsContent value="leaves" className="space-y-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Leave History</h3>
                {leaves.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Start Date</TableHead>
                        <TableHead>End Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaves.map((leave) => (
                        <TableRow key={leave.id}>
                          <TableCell>{format(parseISO(leave.startDate), "PPP")}</TableCell>
                          <TableCell>{format(parseISO(leave.endDate), "PPP")}</TableCell>
                          <TableCell>{leave.type}</TableCell>
                          <TableCell>
                            <Badge>
                              {leave.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">No leave records found.</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        {isNewUser && (
    <Button
      type="submit"
      className="w-full bg-blue-500 hover:bg-blue-600 text-white"
      disabled={isSubmitting}
      onClick={form.handleSubmit(onSubmit2)}
    >
      {isSubmitting ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Submitting...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" /> Submit
        </>
      )}
    </Button>
  )}

        {isEditMode &&!isNewUser && (
          <CardFooter>
            <Button
              type="submit"
              className="w-full bg-blue-500 hover:bg-blue-600 text-white"
              disabled={isSubmitting}
              onClick={form.handleSubmit(onSubmit)}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Save Changes
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </form>
      <div className="mb-4">
      {Object.keys(formState.errors).length > 0 && (
  <p className="font-semibold text-red-500">Please fix the following errors:</p>
)}
      <ul className="list-disc pl-5">
        {Object.keys(formState.errors).map((fieldName) => {
          const field = fieldName as keyof typeof formState.errors; // Type-cast the fieldName
          return (
            <li key={field} className="text-red-500">
              {formState.errors[field]?.message}
            </li>
          );
        })}
      </ul>
    </div>

    </Card>
    </div>

    <Footer/>
    </div>
    </Suspense>

  )
}