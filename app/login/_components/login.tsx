"use client";

import { logIn } from "@/hooks/use-auth";
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
import Link from "next/link"; // Import Link for client-side navigation
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const router = useRouter();

  // Check for existing token on mount
  React.useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // Redirect to home if already logged in
      router.replace("/"); // Use replace to avoid adding login to history
    }
  }, [router]); // Dependency on the router

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Prevent default form submission
    try {
      const res = await logIn(email, password);
      if (res) {
        toast.success("Login successful");
        setTimeout(() => {
        router.push("/"); // Navigate to home on successful login
        }
        , 2000); // Optional delay for user feedback
      } else {
        // Handle login failure (e.g., show an error message)
        // For now, redirecting to register as per original logic
        // Consider adding error handling feedback to the user
        router.push("/register");
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Optionally: Show an error message to the user
      // e.g., setErrorState("Invalid email or password");
      router.push("/register"); // Fallback as per original logic
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Login</CardTitle>
          <CardDescription>
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        {/* Use a form element for better semantics and accessibility */}
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required // Add required attribute
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required // Add required attribute
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full mt-6" > {/* Add type="submit" */}
              Login
            </Button>
            <p className="text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              {/* Use Next.js Link for client-side routing */}
              <Link href="/register" className="font-medium text-primary underline underline-offset-4 hover:text-primary/90">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}