"use client";

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Users, Briefcase, Calendar as CalendarIcon, TrendingUp } from 'lucide-react'
import PerformanceChart from '@/components/charts';
import Header from '@/components/header';
import Footer from '@/components/footer';


export default function HRMSDashboard() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [activeTab, setActiveTab] = useState('dashboard');

  const employees = [
    { id: 1, name: 'Alice Johnson', role: 'Software Engineer', department: 'Engineering' },
    { id: 2, name: 'Bob Smith', role: 'Product Manager', department: 'Product' },
    { id: 3, name: 'Charlie Brown', role: 'UX Designer', department: 'Design' },
    { id: 4, name: 'Diana Ross', role: 'HR Specialist', department: 'Human Resources' },
  ]

  const handleTabClick = (value: "dashboard" | "employees" | "performance") => {
    setActiveTab(value);
  };
  
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>                <Header />

    <div className="flex flex-col space-y-4 p-8 bg-background" style={{flex:1, padding:"20px"}}>

      <Tabs defaultValue="dashboard" className="w-full">
      <TabsList
            style={{
              display: 'flex',
              borderRadius: '5px',
              padding: '5px',
              gap: '10px',
            }}
          >
            <TabsTrigger
              value="dashboard"
              onClick={() => handleTabClick('dashboard')}
              style={{
                backgroundColor: activeTab === 'dashboard' ? '#003366' : '#8B1F25', // Dark blue for active, maroon for inactive
                color: activeTab === 'dashboard' ? '#FFFFFF' : '#DDDDDD',
                padding: '10px 20px',
                borderRadius: '5px',
                transition: 'background-color 0.3s, color 0.3s',
              }}
            >
              Dashboard
            </TabsTrigger>
            <TabsTrigger
              value="employees"
              onClick={() => handleTabClick('employees')}
              style={{
                backgroundColor: activeTab === 'employees' ? '#003366' : '#8B1F25',
                color: activeTab === 'employees' ? '#FFFFFF' : '#DDDDDD',
                padding: '10px 20px',
                borderRadius: '5px',
                transition: 'background-color 0.3s, color 0.3s',
              }}
            >
              Employees
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              onClick={() => handleTabClick('performance')}
              style={{
                backgroundColor: activeTab === 'performance' ? '#003366' : '#8B1F25',
                color: activeTab === 'performance' ? '#FFFFFF' : '#DDDDDD',
                padding: '10px 20px',
                borderRadius: '5px',
                transition: 'background-color 0.3s, color 0.3s',
              }}
            >
              Performance
            </TabsTrigger>
          </TabsList>
        <TabsContent value="dashboard">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Employees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">+5.2% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Open Positions</CardTitle>
                <Briefcase className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">23</div>
                <p className="text-xs text-muted-foreground">4 filled this week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Reviews</CardTitle>
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">Within next 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8.7</div>
                <p className="text-xs text-muted-foreground">Out of 10</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>Employee Directory</CardTitle>
              <CardDescription>Manage and view all employee information</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <Input className="max-w-sm" placeholder="Search employees..." />
                <Button>Add Employee</Button>
              </div>
              <div className="space-y-4">
                {employees.map((employee) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarFallback>{employee.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-sm text-muted-foreground">{employee.role} sasa</p>
                      </div>
                    </div>
                    <Badge>{employee.department}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card>
            <CardHeader>
              <CardTitle>Leave Management</CardTitle>
              <CardDescription>Track and manage employee leave requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Leave Calendar</h3>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium mb-2">Leave Requests</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Alice Johnson</p>
                        <p className="text-sm text-muted-foreground">Vacation: 5 days</p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">Approve</Button>
                        <Button variant="outline" size="sm">Deny</Button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">Bob Smith</p>
                        <p className="text-sm text-muted-foreground">Sick Leave: 2 days</p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">Approve</Button>
                        <Button variant="outline" size="sm">Deny</Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance Reviews</CardTitle>
              <CardDescription>Track and manage employee performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Performance Overview</h3>
                 
                  <Card>
                  <CardContent>

                  <PerformanceChart /> 

                  </CardContent>
                  </Card>

                </div>
                <div>
                  <h3 className="text-lg font-medium mb-2">Recent Reviews</h3>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Alice Johnson</p>
                        <Badge>Q2 2023</Badge>
                      </div>
                      <Progress value={85} className="mb-2" />
                      <p className="text-sm text-muted-foreground">Performance Score: 8.5/10</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium">Bob Smith</p>
                        <Badge>Q2 2023</Badge>
                      </div>
                      <Progress value={92} className="mb-2" />
                      <p className="text-sm text-muted-foreground">Performance Score: 9.2/10</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    <Footer/>

    </div>
  )
}