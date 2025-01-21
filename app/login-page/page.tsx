"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AtSign, KeyRound, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null); // Add error state
  const router = useRouter();

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);
    setError(null); // Clear previous errors

    try {
        // Step 1: Make a login request to the server at the correct address
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }), // Use state variables here
        });

        if (!response.ok) {
            const errorData = await response.json(); // Get error message from the server
            setError(errorData.error || "Login failed"); // Display error message
            throw new Error(errorData.error || "Login failed");
        }

        // Step 2: Get the data from the login response
        const data = await response.json();
        console.log("Token:", data.token); // Token received from the login response

        // Store token in local storage for future requests
        localStorage.setItem('jwtToken', data.token); 

        // Step 3: Fetch user data using the token
        const userResponse = await fetch("/api/users/me", { // Adjust the endpoint as necessary
            headers: {
                "Authorization": `Bearer ${data.token}`,
                "Content-Type": "application/json"
            }
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            setError(errorData.error || "Failed to fetch user data");
            throw new Error(errorData.error || "Failed to fetch user data");
        }

        const userData = await userResponse.json();
        console.log("User Data:", userData); // Check if role data is here

        // Step 4: Check user role and redirect based on it
        if (userData.role === "admin") {
            router.push("/profile-page");
        } else {
            router.push("/profile-page");
        }

    } catch (error) {
        console.error("Login error:", error);
        // Show an error message on the UI
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-red-900 to-blue-900">
      <Card className="w-[350px]">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">Sign in to PATH HRMS</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <AtSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                className="pl-8"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                className="pl-8"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-500 mt-2">
              {error} {/* Display the error message here */}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col">
          <Button className="w-full" onClick={onSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>
          <p className="mt-2 text-sm text-center text-muted-foreground">
            Your account type will be automatically detected
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
