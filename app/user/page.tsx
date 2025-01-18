'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller, Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format, startOfDay } from 'date-fns'
import { User, Briefcase, Mail, Scale, Ruler, MapPin, Users, Phone, Building, Lock, CalendarIcon, Edit3 } from 'lucide-react'

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

const baseSchema = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  title: z.string().min(1, { message: 'Title is required.' }),
  role: z.string().min(1, { message: 'Role is required.' }),
  department: z.string().min(1, { message: 'Department is required.' }),
  location: z.string().min(1, { message: 'Location is required.' }),
  hireDate: z.date().optional(),
  endDate: z.date().optional(),
  address: z.string().optional(),
  reportsTo: z.string().min(1, { message: 'Reports To is required.' }),
}

const staffSchema = z.object({
  ...baseSchema,
  hireDate: z.date({ required_error: 'Hire date is required.' }),
  facility: z.string().min(1, { message: 'Facility is required.' }),
  leaveDays: z
  .coerce
  .number()
  .min(1, { message: "Leave days must be a positive number" }) // Ensure leaveDays is a positive number
  .int(), // Ensure it is an integer
  weight: z.string().optional(),
  height: z.string().optional(),
  startDate: z.date({ required_error: 'Start date is required.' }),
  endDate: z.date().optional(),
})

const inchargeSchema = z.object({
  ...baseSchema,
  facility: z.string().min(1, { message: 'Facility is required.' }),
})

const otherRolesSchema = z.object(baseSchema)

type UserFormData = z.infer<typeof staffSchema>

const roles = ['Staff', 'INCHARGE', 'PO', 'HR', 'PADM']
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
const locations = ['New York', 'San Francisco', 'London', 'Tokyo', 'Remote']
const facilities = ['Main Office', 'Branch A', 'Branch B', 'Factory 1', 'Factory 2']
const titles = ['Software Engineer', 'Sales Representative', 'Marketing Specialist', 'HR Manager', 'Financial Analyst']

const sampleUserData: UserFormData = {
  name: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1234567890',
  title: 'Software Engineer',
  role: 'Staff',
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

const initialUserData: UserFormData = {
    name: '',
    email: '',
    phone: '',
    title: '',
    role: 'Staff',
    department: '',
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

export default function UserManagement({ isNewUser, userData }: UserManagementProps) {

    
    const [formData, setFormData] = useState<UserFormData>(userData || initialUserData);
  const [isEditing, setIsEditing] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('Staff')
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

  const form = useForm<UserFormData>({
    resolver: zodResolver(
      selectedRole === 'Staff'
        ? staffSchema
        : selectedRole === 'INCHARGE'
          ? inchargeSchema
          : otherRolesSchema
    ),
    defaultValues: {
      name: '',
      email: '',
      role: 'Staff',
      department: '',
      location: '',
      facility: '',
      title: '',
      reportsTo: '',
      leaveDays: 0,
      startDate: startOfDay(new Date()),
      hireDate: startOfDay(new Date()),
    },
  })

  const { formState: { errors } } = form;

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
      const response = await fetch(`http://localhost:3030/api/users/${id}`)
      if (!response.ok) throw new Error("Failed to fetch user data")
      const userData = await response.json()
      form.reset(userData)
         // Explicitly update selectedRole to match the reset value
         setSelectedRole(userData.role);
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

    // In a real app, you would fetch this data from your API
    const mockReportsToOptions = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Emily Brown']
    setReportsToOptions(mockReportsToOptions)
  }, [])



  useEffect(() => {
    if (userData && !isNewUser) {
        setFormData(userData);  // ✅ Syncing userData prop with state
        setIsEditing(true);
    }
}, [userData, isNewUser]);

  useEffect(() => {
    if (!isNewUser) {
      form.reset(formData)
    } else {
      form.reset({
        name: '',
        email: '',
        role: 'Staff',
        department: '',
        location: '',
        facility: '',
        title: '',
        reportsTo: '',
        leaveDays: 0,
        startDate: startOfDay(new Date()),
        hireDate: startOfDay(new Date()),
      })
    }
  }, [isNewUser, form])

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

  return (
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
                    placeholder="John Doe"
                    icon={User}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    label="Email"
                    placeholder="john@example.com"
                    icon={Mail}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    label="Phone"
                    placeholder="+1234567890"
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
                  />
                  <FormSelect
                    control={form.control}
                    name="location"
                    label="Location"
                    options={locations}
                    disabled={!isEditing && !isNewUser}
                  />
                  <FormSelect
                    control={form.control}
                    name="title"
                    label="Title"
                    options={titles}
                    disabled={!isEditing && !isNewUser}
                  />
                  {(selectedRole === 'Staff' || selectedRole === 'INCHARGE') && (
                    <FormSelect
                      control={form.control}
                      name="facility"
                      label="Facility"
                      options={facilities}
                      disabled={!isEditing && !isNewUser}
                    />
                  )}
                  {selectedRole !== 'PADM' && (
                    <FormSelect
                      control={form.control}
                      name="reportsTo"
                      label="Reports To"
                      options={reportsToOptions}
                      disabled={!isEditing && !isNewUser}
                    />
                  )}
                </div>
              </TabsContent>
              <TabsContent value="additional" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedRole === 'Staff' && (
                    <>
<FormField
  control={form.control}
  name="leaveDays"
  label="Leave Days"
  type="number"
  placeholder="20"
  icon={CalendarIcon}
  disabled={!isEditing && !isNewUser}
/>


                      <FormField
                        control={form.control}
                        name="weight"
                        label="Weight (kg)"
                        placeholder="70"
                        icon={Scale}
                        disabled={!isEditing && !isNewUser}
                      />
                      <FormField
                        control={form.control}
                        name="height"
                        label="Height (cm)"
                        placeholder="175"
                        icon={Ruler}
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
                    placeholder="123 Main St, City, Country"
                    className="min-h-[80px]"
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
    onClick={isNewUser ? form.handleSubmit(onSubmit2) : form.handleSubmit(onSubmit)}
  >
    {isNewUser ? 'Create User' : 'Save Changes'}
  </Button>
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
            {sampleUserData.role === 'Staff' && (
              <div>
                <h3 className="text-lg font-semibold">Additional Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="font-medium">Hire Date:</span> {format(formData.hireDate, 'PPP')}</p>
                  <p><span className="font-medium">Start Date:</span> {format(formData.startDate, 'PPP')}</p>
                  <p><span className="font-medium">Leave Days:</span> {formData.leaveDays}</p>
                  <p><span className="font-medium">Weight:</span> {formData.weight} kg</p>
                  <p><span className="font-medium">Height:</span> {formData.height} cm</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
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
          render={({ field, fieldState: { error } }) => (
            <>
            <Input
              id={name}
              placeholder={placeholder}
              className={cn('pl-8', Icon && 'pl-8')}
              type={type}
              disabled={disabled}
              // Always assign a defined value, handle Date type explicitly
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
  )
}

interface FormSelectProps {
  control: Control<UserFormData>
  name: keyof UserFormData
  label: string
  options: string[]
  disabled?: boolean
  onValueChange?: (value: string) => void
}

function FormSelect({ control, name, label, options, disabled, onValueChange }: FormSelectProps) {
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
              defaultValue={field.value ? String(field.value) : undefined}  // Ensure the value is a string              disabled={disabled}
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

  if (name === 'hireDate' && role !== 'Staff') {
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

