"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { EmployeeProvider } from "./context/EmployeeContext";


export default function LandingPage() {
  return (
    <EmployeeProvider>
    <div className="flex flex-col min-h-screen bg-background">

      <main className="flex flex-col items-center justify-center flex-1 p-8">
        <h1 className="text-4xl font-bold mb-4">Welcome to Your HR Management System</h1>
        <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl">
          Manage employee records, track performance, and handle leave requests with ease.
        </p>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Get a quick overview of your HR metrics, employee performance, and more.
              </p>
              <Button onClick={() => window.location.href='/dashboard'}>
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                View and edit your profile information, including personal details and preferences.
              </p>
              <Button onClick={() => window.location.href='/profile-page'}>
                Go to Profile
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Login</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Access your account to manage HR functions and review your details.
              </p>
              <Button onClick={() => window.location.href='/login-page'}>
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      
    </div>
    </EmployeeProvider>
  );
}
