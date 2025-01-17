'use client'

import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { User, Briefcase, Mail, Scale, Ruler, MapPin, Users, Phone, Building } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'

const baseSchema = {
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Invalid email address.' }),
  phone: z.string().optional(),
  title: z.string().optional(),
  role: z.string().min(1, { message: 'Role is required.' }),
  department: z.string().min(1, { message: 'Department is required.' }),
  facility: z.string().optional(),
  location: z.string().optional(),
  hireDate: z.date({ required_error: 'Hire date is required.' }),
  endDate: z.date().optional(),
  reportsTo: z.string().optional(),
  address: z.string().optional(),
  weight: z.string().optional(),
  height: z.string().optional(),
  leaveDays: z.number().min(0, { message: 'Leave days must be a positive number.' }).optional(),
}

const newUserSchema = z.object({
  ...baseSchema,
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
})

const existingUserSchema = z.object(baseSchema)

type UserFormData = z.infer<typeof newUserSchema>

const roles = ['Staff', 'Manager', 'HR', 'Admin']
const departments = ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']

export default function UserManagement() {
  const [isEditing, setIsEditing] = useState(false)
  const [isNewUser, setIsNewUser] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserFormData | null>(null)
  const { toast } = useToast()

  const form = useForm<UserFormData>({
    resolver: zodResolver(isNewUser ? newUserSchema : existingUserSchema),
    defaultValues: {
      name: '',
      email: '',
      role: '',
      department: '',
      leaveDays: 0,
    },
  })

  useEffect(() => {
    if (selectedUser) {
      form.reset(selectedUser)
    }
  }, [selectedUser, form])

  const onSubmit = async (values: UserFormData) => {
    try {
      // Simulating API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: 'Success',
        description: isNewUser ? 'User created successfully.' : 'User updated successfully.',
      })
      
      if (isNewUser) {
        setSelectedUser(values)
        setIsNewUser(false)
      } else {
        setSelectedUser(prevState => ({ ...prevState, ...values }))
      }
      
      setIsEditing(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save user information. Please try again.',
        variant: 'destructive',
      })
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            <FormField
              control={form.control}
              name="title"
              label="Title"
              placeholder="Software Engineer"
              icon={Briefcase}
              disabled={!isEditing && !isNewUser}
            />
            <FormSelect
              control={form.control}
              name="role"
              label="Role"
              options={roles}
              disabled={!isEditing && !isNewUser}
            />
            <FormSelect
              control={form.control}
              name="department"
              label="Department"
              options={departments}
              disabled={!isEditing && !isNewUser}
            />
            <FormField
              control={form.control}
              name="facility"
              label="Facility"
              placeholder="Main Office"
              icon={Building}
              disabled={!isEditing && !isNewUser}
            />
            <FormField
              control={form.control}
              name="location"
              label="Location"
              placeholder="New York, NY"
              icon={MapPin}
              disabled={!isEditing && !isNewUser}
            />
            <FormDatePicker
              control={form.control}
              name="hireDate"
              label="Hire Date"
              disabled={!isEditing && !isNewUser}
            />
            <FormDatePicker
              control={form.control}
              name="endDate"
              label="End Date"
              disabled={!isEditing && !isNewUser}
            />
            <FormField
              control={form.control}
              name="reportsTo"
              label="Reports To"
              placeholder="Jane Smith"
              icon={Users}
              disabled={!isEditing && !isNewUser}
            />
            <FormField
              control={form.control}
              name="leaveDays"
              label="Leave Days"
              type="number"
              placeholder="20"
              icon={Calendar}
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
          
          {isNewUser && (
            <FormField
              control={form.control}
              name="password"
              label="Password"
              type="password"
              placeholder="Enter a strong password"
              icon={Lock}
            />
          )}
        </CardContent>
        <CardFooter>
          {(isEditing || isNewUser) && (
            <Button type="submit" className="w-full">
              {isNewUser ? 'Create User' : 'Save Changes'}
            </Button>
          )}
        </CardFooter>
      </form>
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
                {...field}
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
}

function FormSelect({ control, name, label, options, disabled }: FormSelectProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <>
            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={disabled}>
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
  name: 'hireDate' | 'endDate'
  label: string
  disabled?: boolean
}

function FormDatePicker({ control, name, label, disabled }: FormDatePickerProps) {
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

