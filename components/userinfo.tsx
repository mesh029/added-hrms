"use client"

import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { format } from "date-fns"
import { Calendar as CalendarIcon, User, Briefcase, Mail, Scale, Ruler, MapPin, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }).optional(),
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
})

// Mock array of existing users
const existingUsers = [
  { id: "1", name: "Jane Smith" },
  { id: "2", name: "John Doe" },
  { id: "3", name: "Alice Johnson" },
  { id: "4", name: "Bob Williams" },
  { id: "5", name: "Emma Brown" },
]

export default function UserInformationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hireDate, setHireDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "",
      department: "",
      address: "",
      reportsTo: "",
      manager: "",
      weight: "",
      height: "",
      leaveDays: 0,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('http://localhost:3030/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      const data = await response.json()
      toast({
        title: "Success",
        description: `User created successfully. Default password: ${data.defaultPassword}`,
      })
      form.reset()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create user. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

 // useEffect(() => {
   // if (form.formState.isSubmitSuccessful) {
     // form.reset()
    //}
  //}, [form.formState.isSubmitSuccessful, form.reset])

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>User Information Form</CardTitle>
        <CardDescription>Enter the details of the new user</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <div className="relative">
                <User className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="John Doe" className="pl-8" {...form.register("name")} />
              </div>
              {form.formState.errors.name && (
                <p className="text-sm text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <div className="relative">
                <Mail className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="email" placeholder="john@example.com" className="pl-8" {...form.register("email")} />
              </div>
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <div className="relative">
                <Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="role" placeholder="Software Engineer" className="pl-8" {...form.register("role")} />
              </div>
              {form.formState.errors.role && (
                <p className="text-sm text-red-500">{form.formState.errors.role.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <div className="relative">
                <Briefcase className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="department" placeholder="Engineering" className="pl-8" {...form.register("department")} />
              </div>
              {form.formState.errors.department && (
                <p className="text-sm text-red-500">{form.formState.errors.department.message}</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hire Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !hireDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {hireDate ? format(hireDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={hireDate}
                    onSelect={(date) => {
                      setHireDate(date)
                      form.setValue("hireDate", date as Date)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              {form.formState.errors.hireDate && (
                <p className="text-sm text-red-500">{form.formState.errors.hireDate.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>End of Hire Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={(date) => {
                      setEndDate(date)
                      form.setValue("endDate", date as Date)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reportsTo">Reports To *</Label>
              <Controller
                name="reportsTo"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select supervisor" />
                    </SelectTrigger>
                    <SelectContent>
                      {existingUsers.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.reportsTo && (
                <p className="text-sm text-red-500">{form.formState.errors.reportsTo.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="manager">Manager</Label>
              <div className="relative">
                <Users className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="manager" placeholder="John Doe" className="pl-8" {...form.register("manager")} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <div className="relative">
                <Scale className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="weight" placeholder="70" className="pl-8" {...form.register("weight")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (cm)</Label>
              <div className="relative">
                <Ruler className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="height" placeholder="175" className="pl-8" {...form.register("height")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leaveDays">Leave Days *</Label>
              <div className="relative">
                <CalendarIcon className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="leaveDays" type="number" placeholder="20" className="pl-8" {...form.register("leaveDays", { valueAsNumber: true })} />
              </div>
              {form.formState.errors.leaveDays && (
                <p className="text-sm text-red-500">{form.formState.errors.leaveDays.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address *</Label>
            <div className="relative">
              <MapPin className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Textarea id="address" placeholder="123 Main St, City, Country" className="pl-8 min-h-[80px]" {...form.register("address")} />
            </div>
            {form.formState.errors.address && (
              <p className="text-sm text-red-500">{form.formState.errors.address.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating User..." : "Submit User Information"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}