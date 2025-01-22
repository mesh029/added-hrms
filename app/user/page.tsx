'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, startOfDay } from 'date-fns'
import { User, Briefcase, Mail, Scale, Ruler, MapPin, Users, Phone, Building, Lock, CalendarIcon, Edit3 } from 'lucide-react'
import Footer from '@/components/footer';
import Header from '@/components/header';
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRouter } from 'next/router';
import { Head } from 'react-day-picker'


const baseSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    phone: z.string().optional(),
    title: z.string().min(1, { message: 'Title is required.' }),
    role: z.string().min(1, { message: 'Role is required.' }),
    department: z.string().min(1, { message: 'Department is required.' }),
    location: z.string().min(1, { message: 'Location is required.' }),
    address: z.string().optional(),

    hireDate: z.date().optional(),
    endDate: z.date().nullable().optional(),  // Allow null and undefined    address: z.string().optional(),
  });
  
const staffSchema = baseSchema.extend({
    hireDate: z.date({ required_error: 'Hire date is required.' }),
    facility: z.string().min(1, { message: 'Facility is required.' }),
    leaveDays: z
      .coerce
      .number()
      .min(1, { message: "Leave days must be a positive number" }) // Ensure leaveDays is a positive number
      .int() // Ensure it is an integer
      .optional(), // Make it optional
    weight: z.string().optional(),
    height: z.string().optional(),
    startDate: z.date({ required_error: 'Start date is required.' }),
    endDate: z.date().nullable().optional(),  
    reportsTo: z.string().min(1, { message: 'Reports To is required.' }),

  
  });
    
  

  const staffProjectSchema = baseSchema.extend({
    hireDate: z.date({ required_error: 'Hire date is required.' }),
    leaveDays: z
    .coerce
    .number()
    .min(1, { message: "Leave days must be a positive number" }) // Ensure leaveDays is a positive number
    .int() // Ensure it is an integer
    .optional(), // Make it optional// Ensure it is an integer
    weight: z.string().optional(),
    height: z.string().optional(),
    startDate: z.date({ required_error: 'Start date is required.' }),
    endDate: z.date().optional(),
    reportsTo: z.string().min(1, { message: 'Reports To is required.' }),

  });
  
const inchargeSchema = baseSchema.extend({
  facility: z.string().min(1, { message: 'Facility is required.' }),
  reportsTo: z.string().min(1, { message: 'Reports To is required.' }),

})

const otherRolesSchema = baseSchema.extend({});

type UserFormData = 
  (z.infer<typeof staffSchema> & 
   z.infer<typeof staffProjectSchema> & 
   z.infer<typeof inchargeSchema> & 
   z.infer<typeof otherRolesSchema>);


const roles = ['STAFF','STAFF-PROJECT', 'INCHARGE', 'PO', 'HR', 'PADM']
const departments = ['M&E', 'HR', 'HRIO', 'HRH', 'OTHER']
const locations = ['Kisumu','London', 'Homabay', 'Kisii', 'Kakamega', 'Vihiga', "Nyamira", "Migori"]
const facilities = ['Chulaimbo', 'Migosi', 'Nightingale', 'Embulumbulu']
const titles = ['M&E Officer','Marketing Specialist', 'HR Manager', 'M&E Associate', 'Nurse', 'Lab Specialist']

const sampleUserData: UserFormData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  title: 'Software Engineer',
  role: 'STAFF',
  department: 'Engineering',
  location: 'New York',
  facility: 'Main Office',
  hireDate: new Date(2020, 0, 1),
  startDate: new Date(2020, 0, 15),
  endDate: undefined,
  address: '123 Main St, New York, NY 10001',
  reportsTo: 'Jane Smith',
  leaveDays: 20,
  weight: '70',
  height: '175',
}

interface UserManagementProps {
  isNewUser: boolean;
  userData?: UserFormData;  // ✅ Directly using UserFormData type

}

type Manager = {
    id: string;
    name: string;
    role: string;
    // Add other properties if needed
  };
  

const initialUserData: UserFormData = {
    name: '',
    email: '',
    phone: '',
    title: '',
    role: '',
    department: "",
    location: '',
    facility: '',
    hireDate: new Date(),
    startDate: new Date(),
    endDate: undefined,
    address: '',
    reportsTo: '',
    leaveDays: 0,
    weight: '',
    height: '',
};

type Role = "INCHARGE" | "PADM" | "PO" | "STAFF" | "HR";


export default function UserManagement( ){
    const [isNewUser, setNewUser] = useState(true)

    const [formData, setFormData] = useState<UserFormData>(initialUserData);
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [location, setLocation] = useState<string>('')
  const [title, setTitle] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [facility, setFacility] = useState<string>('')
  const [reportsTo, setReportsTo] = useState<string>('')

  const [userName, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')




  const [reportsToOptions, setReportsToOptions] = useState<string[]>([])
  const { toast } = useToast()
  const [token, setToken] = useState<string | null>(null);  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);  
  const [userId, setUserId] = useState<string | null>(null)
  const [hasPersonalInfoError, setHasPersonalInfoError] = useState(false);
  const [hasWorkInfoError, setHasWorkInfoError] = useState(false);
  const [hasAdditionalInfoError, setHasAdditionalInfoError] = useState(false);
  const [managers, setManagers] = useState<Manager[]>([]);

  const form = useForm<UserFormData>({
    resolver: zodResolver(
      selectedRole === 'STAFF'
        ? staffSchema
        : selectedRole === 'STAFF-PROJECT'
        ? staffProjectSchema
        : selectedRole === 'INCHARGE'
        ? inchargeSchema
        : otherRolesSchema
    ),
    defaultValues: {
        ...initialUserData, // This includes formData values as defaults
      },
  });
  
  useEffect(() => {
    if (formData) {
      form.setValue('endDate', formData.endDate ? new Date(formData.endDate) : undefined);      form.setValue('phone', formData.phone || '');
      form.setValue('name', formData.name || '');
      form.setValue('email', formData.email || '');
      form.setValue('leaveDays', formData.leaveDays ? parseInt(formData.leaveDays.toString(), 10) : undefined);
      form.setValue('reportsTo', formData.reportsTo || '');
      form.setValue('location', formData.location || '');
      form.setValue('department', formData.department || '');
      form.setValue('title', formData.title || '');
      form.setValue('address', formData.address || '');
      form.setValue('facility', formData.facility || '');





      setDepartment(formData.department)
      setTitle(formData.title)
      setLocation(formData.location)
      

    }
  }, [formData]); 


  const { formState: { errors } } = form;
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);  // Set searchParams when on client-side
      console.log("params set@!!!!")
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

      } else {
        // Handle new user logic
        console.log("User not found or server is not operational.")
        setLoading(false);
      }
    }
  }, [searchParams]); 

  // Check for errors in each section based on the active schema
  useEffect(() => {
    // Personal Info error detection
    setHasPersonalInfoError(
      !!errors.name || !!errors.email || !!errors.reportsTo
    );
  
    // Work Info error detection
    setHasWorkInfoError(
      !!errors.title || !!errors.role || !!errors.department || !!errors.location
    );
  
    // Additional Info error detection
    setHasAdditionalInfoError(
      !!errors.facility || !!errors.leaveDays || !!errors.startDate
    );
  }, [errors]);  // Re-run this effect whenever `errors` change
  

  const fetchUserData = async (id: string) => {
    try {
      const response = await fetch(`/api/users/${id}`)
      if (!response.ok) throw new Error("Failed to fetch user data")
      const userData = await response.json()
    setFormData(userData)
        // Explicitly update selectedRole to match the reset value
         setSelectedRole(userData.role);
         console.log("user was found", userData)
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
    console.log("your token", token)


    if (!token) {
      setError("No token found");
      setLoading(false);
      return;
    }

    // In a real app, you would fetch this data from your API
    const mockReportsToOptions = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Emily Brown']
    setReportsToOptions(mockReportsToOptions)
  }, [])
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
          const response = await fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });
      
          if (!response.ok) {
            throw new Error("Failed to fetch users");
          }
      
          const allUsers: Manager[] = await response.json();
      
          // Adjust filtering logic based on selected role
          const filteredManagers = allUsers.filter((user) => {
            const userRole = user.role.toLowerCase();
            if (selectedRole === "STAFF") {
              return userRole === "incharge";
            } else if (selectedRole === "INCHARGE") {
              return userRole === "po";
            } else if (selectedRole === "STAFF-PROJECT") {
              return userRole === "po";
            }
            return false; // Default case for other roles
          });
      
          setManagers(filteredManagers);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError("An unknown error occurred");
          }
        } finally {
          setLoading(false);
        }
      };
      
      

    fetchManagers();
  }, [selectedRole]);



  useEffect(() => {
    form.setValue('role', selectedRole)
  }, [selectedRole, form])

  useEffect(() => {
    if (searchParams !== null) {  // Null check to ensure searchParams is available
      const id = searchParams.get("id");
      setUserId(id);
      if (id) {
        // Start loading data when 'id' is available
        fetchUserData(id);
      } else {
        // Handle new user logic
        setLoading(false);
      }
    }
  }, [searchParams]); 

  const onSubmit = async (values: UserFormData) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: {
            "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) throw new Error("Failed to save user data")



      toast({
        title: "Success",
        description: "User updated successfully",
      })
      console.log("successfull champ!!!", values)
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


    const onSubmit2 = async (values: UserFormData) => {
      setIsSubmitting(true)
      try {
        // For creating a new user, the endpoint should be the "create user" route
        console.log("heres your token", token)
        const response = await fetch('/api/users', {
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
        window.location.reload()

  
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
    setIsEditing(!isEditing)
  }

  const getErrorMessages = () => {
    const errorMessages: string[] = [];
    const errorObj = errors as Record<string, any>; // Cast errors to allow dynamic indexing
    for (const key in errorObj) {
      if (errorObj[key]) {
        errorMessages.push(errorObj[key]?.message);
      }
    }
    return errorMessages;
  };
  
  return (
    <>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

    <Header/>
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>{isNewUser ? 'Create New User' : 'User Profile'}</CardTitle>
        <CardDescription>
          {isNewUser
            ? 'Enter the details of the new user'
            : isEditing
            ? 'Edit user information'
            : 'View user profile'}
        </CardDescription>
      </CardHeader>
      {isNewUser || isEditing ? (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-6">
            {!isNewUser && (
              <div className="flex justify-end">
                <Switch
                  checked={isEditing}
                  onCheckedChange={toggleEditMode}
                  aria-label="Toggle edit mode"
                />
                <Label className="ml-2">{isEditing ? 'Editing' : 'Viewing'}</Label>
              </div>
            )}

            <FormSelect
              control={form.control}
              name="role"
              label="Role"
              options={roles}
              disabled={!isEditing && !isNewUser}
              onValueChange={(value) => setSelectedRole(value)}
              value={formData.role}

            />

            <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
  <TabsTrigger
    value="personal"
    className={`border-2 ${hasPersonalInfoError ? 'border-red-500' : ''}`}
  >
    Personal Info
  </TabsTrigger>
  <TabsTrigger
    value="work"
    className={`border-2 ${hasWorkInfoError ? 'border-red-500' : ''}`}
  >
    Work Info
  </TabsTrigger>
  <TabsTrigger
    value="additional"
    className={`border-2 ${hasAdditionalInfoError ? 'border-red-500' : ''}`}
  >
    Additional Info
  </TabsTrigger>
</TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    label="Name"
                    placeholder={"Example Name"}
                    icon={User}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder={"Example email"}
                    icon={Mail}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    label="Phone"
                    placeholder={"+25478921312"}
                    icon={Phone}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormDatePicker
                    control={form.control}
                    name="hireDate"
                    label="Hire Date"
                    disabled={!isEditing && !isNewUser}
                  />
                </div>
              </TabsContent>
              <TabsContent value="work" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormSelect
                    control={form.control}
                    name="department"
                    label="Department"
                    options={departments}
                    disabled={!isEditing && !isNewUser}
                    onValueChange={(value) => setDepartment(value)}
                    value={department}

                  />
                  <FormSelect
                    control={form.control}
                    name="location"
                    label="Location"
                    options={locations}
                    disabled={!isEditing && !isNewUser}
                    onValueChange={(value) => setLocation(value)}
                    value={location}
                  />
                  <FormSelect
                    control={form.control}
                    name="title"
                    label="Title"
                    options={titles}
                    disabled={!isEditing && !isNewUser}
                    onValueChange={(value) => setTitle(value)}

                    value={title}

                  />
{(selectedRole === 'STAFF' || selectedRole === 'INCHARGE' || selectedRole === 'STAFF-PROJECT') && (
  <>
    {/* Facility Select - Only for STAFF and INCHARGE */}
    {(selectedRole === 'STAFF' || selectedRole === 'INCHARGE') && (
      <FormSelect
        control={form.control}
        name="facility"
        label="Facility"
        options={facilities}
        disabled={!isEditing && !isNewUser}
        onValueChange={(value) => setFacility(value)}
        value={formData.facility}
      />
    )}

    {/* Reports To Select - For STAFF, INCHARGE, and STAFF-PROJECT */}
    <FormSelect
      control={form.control}
      name="reportsTo"
      label="Reports To"
      options={managers.map((manager) => manager.name)} // Extract only the names
      disabled={!isEditing && !isNewUser}
      onValueChange={(value) => setReportsTo(value)}
      value={formData.reportsTo}
    />
  </>
)}


                </div>
              </TabsContent>
              <TabsContent value="additional" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(selectedRole === 'STAFF' || selectedRole === 'STAFF-PROJECT') && (
  <>
    <FormField
      control={form.control}
      name="leaveDays"
      label="Leave Days"
      type="number"
      placeholder={`${formData.leaveDays}`}
      icon={CalendarIcon}
      disabled={!isEditing && !isNewUser}
    />

    <FormDatePicker
      control={form.control}
      name="startDate"
      label="Start Date"
      disabled={!isEditing && !isNewUser}
    />
    <FormDatePicker
      control={form.control}
      name="endDate"
      label="End Date"
      disabled={!isEditing && !isNewUser}
    />
  </>
)}

                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea
                    id="address"
                    placeholder={"23, Sample Address"}
                    className="min-h-[80px]"
                    defaultValue={formData.address}
                    {...form.register('address')}
                    disabled={!isEditing && !isNewUser}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>

          <CardFooter>
            
            
          {(isEditing || isNewUser) && (
  <Button
    type="submit"
    className="w-full"
    disabled= {isSubmitting}
    onClick={isNewUser ? form.handleSubmit(onSubmit2) : form.handleSubmit(onSubmit)}
  >
    {isNewUser ? 'Create User' : 'Save Changes'}
  </Button>
)}

      {/* Error Summary Section */}
      {Object.keys(errors).length > 0 && (
        <div className="error-summary">
          <h3>Form Errors</h3>
          <ul>
            {getErrorMessages().map((errorMessage, index) => (
              <li key={index} className="error">{errorMessage}</li>
            ))}
          </ul>
        </div>
      )}


          </CardFooter>
        </form>
      ) : (
        <CardContent>
          <div className="space-y-6">
            <div className="flex justify-end">
              <Button onClick={() => setIsEditing(true)} variant="outline">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-lg font-semibold">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Name:</span> {formData.name}</p>
                  <p><span className="font-medium">Email:</span> {formData.email}</p>
                  <p><span className="font-medium">Phone:</span> {formData.phone}</p>
                  <p><span className="font-medium">Address:</span> {formData.address}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Work Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Role:</span> {formData.role}</p>
                  <p><span className="font-medium">Title:</span> {formData.title}</p>
                  <p><span className="font-medium">Department:</span> {formData.department}</p>
                  <p><span className="font-medium">Location:</span> {formData.location}</p>
                  <p><span className="font-medium">Facility:</span> {formData.facility}</p>
                  <p><span className="font-medium">Reports To:</span> {formData.reportsTo}</p>
                </div>
              </div>
            </div>
            {formData.role === 'STAFF' && (
              <div>
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Hire Date:</span> {format(formData.hireDate, 'PPP')}</p>
                  <p><span className="font-medium">Start Date:</span> {format(sampleUserData.startDate, 'PPP')}</p>
                  <p><span className="font-medium">Leave Days:</span> {formData.leaveDays}</p>
                  <p><span className="font-medium">Weight:</span> {formData.weight} kg</p>
                  <p><span className="font-medium">Height:</span> {formData.height} cm</p>

                  <p><span className="font-medium">Address:</span> {formData.address} cm</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
    </div>
        <Footer/>
        </>


  )
}

interface FormFieldProps {
  control: Control<UserFormData>
  name: keyof UserFormData
  label: string
  placeholder?: string
  icon?: React.ElementType
  type?: string
  disabled?: boolean
}

function FormField({ control, name, label, placeholder, icon: Icon, type = 'text', disabled }: FormFieldProps) {
    return (
      <div className="space-y-2">
        <Label htmlFor={name}>{label}</Label>
        <div className="relative">
          {Icon && <Icon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />}
          <Controller
            name={name}
            control={control}
   // Add defaultValue here
            render={({ field, fieldState: { error } }) => (
              <>
                <Input
                  id={name}
                  placeholder={placeholder}
                  className={cn('pl-8', Icon && 'pl-8')}
                  type={type}
                  disabled={disabled}
                  value={field.value ? (field.value instanceof Date ? field.value.toISOString() : field.value) : ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                />
                {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
              </>
            )}
          />
        </div>
      </div>
    );
  }
  
interface FormSelectProps {
  control: Control<UserFormData>
  name: keyof UserFormData
  label: string
  options: string[]
  disabled?: boolean
  onValueChange?: (value: string) => void
  value: string | number;  // Allow value to be either a string or a number
}

function FormSelect({ control, name, label, options, disabled, value, onValueChange }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <Select 
              onValueChange={(value) => {
                field.onChange(value)
                onValueChange && onValueChange(value)
              }} 

              defaultValue={value ? String(value) : undefined} // Ensure the value is a string for defaultValue


>
              <SelectTrigger>
                <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
          </>
        )}
      />
    </div>
  )
}

interface FormDatePickerProps {
  control: Control<UserFormData>
  name: 'hireDate' | 'endDate' | 'startDate'
  label: string
  disabled?: boolean
}

function FormDatePicker({ control, name, label, disabled }: FormDatePickerProps) {
  const { watch } = useForm()
  const role = watch('role')

  if (name === 'hireDate' && role !== 'STAFF') {
    return null
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState: { error } }) => (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={'outline'}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !field.value && 'text-muted-foreground'
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) =>
                    date > new Date() || date < new Date('1900-01-01')
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
          </>
        )}
      />
    </div>
  )
}

