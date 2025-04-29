"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";

// Define the allowed role types
type Role = "admin" | "instructor"; // Removed "student"

export default function Register() {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [role, setRole] = React.useState<Role | undefined>(undefined); // Role state for allowed types
  // Removed studentId and department states
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    setError(null); // Clear previous errors
    setIsLoading(true);

    if (!role) {
        setError("Please select a role.");
        setIsLoading(false);
        return;
    }

    // userData now only includes common fields + selected role
    const userData = {
      name,
      email,
      password,
      role,
    };

    console.log('userData', userData);
    try {
      const response = await axios.post(`${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}/api/auth/register`, {
        ...userData,
      },
        {
          withCredentials: true,
            headers: {
              "Content-Type": "application/json"
          }
        }
      );
      console.log("Response:", response);
     
      // Assuming 201 Created is also a success status for registration
      if (response.status === 200 || response.status === 201) {
        // Registration successful, redirect to login
        toast.success("Registration successful! Please log in.");
        setTimeout(() => { router.push("/login");}, 2000); // Optional delay before redirect
       
      } else {
        // Try to parse error from response data
        const errorData = response.data; // Axios automatically parses JSON
        console.log("Error data:", errorData);
        setError(errorData?.message || `Registration failed with status: ${response.status}. Please try again.`);
      }
    } catch (err: any) { // Catch specific AxiosError or general error
      console.error("Registration request failed:", err);
      let errorMessage = "An unexpected error occurred. Please try again later.";
      // Handle Axios specific errors
      if (axios.isAxiosError(err) && err.response) {
        console.error("Error response data:", err.response.data);
        errorMessage = err.response.data?.message || `Request failed with status ${err.response.status}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Register</CardTitle>
          <CardDescription>
            Create an admin or instructor account
          </CardDescription>
        </CardHeader>
          <CardContent className="space-y-4">
            {/* Role Selection */}
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value: Role) => setRole(value)}
                required // Make role selection required
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select account role" />
                </SelectTrigger>
                <SelectContent>
                  {/* Removed "student" option */}
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="instructor">Instructor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Common Fields */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* Student Specific Fields Removed */}

            {/* Error Message Display */}
            {error && (
              <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
            )}

          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            {/* NOTE: Changed Button type back to "button" since we are not using form onSubmit */}
            <Button type="button" className="w-full" disabled={isLoading} onClick={handleSubmit}>
              {isLoading ? "Registering..." : "Register"}
            </Button>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
                Login
              </Link>
            </p>
          </CardFooter>
      </Card>
    </div>
  );
}