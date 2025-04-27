import LoginButton from '@/components/login-button';
import RegisterButton from '@/components/register-button';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import React from 'react'

export default function page() {
  
  return (
    <div className="h-screen">
      <nav className="p-4 text-white">
        <div className="container mx-auto flex justify-between items-center mt-3">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Student Management System
          </h1>
          <ul className="flex space-x-4 items-center justify-between">
            <li>
                <LoginButton></LoginButton>
            </li>
            <li>
              <RegisterButton />
            </li>
          </ul>
        </div>
      </nav>
      <main>
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-4xl font-bold">
            Welcome to the Student Management System
          </h1>
          <p className="mt-4 text-lg">
              <LoginButton variant={"link"} className="text-xl font-mono " />
            <Link href={"/home"}>
              <Button variant={"link"} className="text-xl font-mono ">
                Home
              </Button>
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
