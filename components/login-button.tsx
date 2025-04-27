'use client';
import React, { useEffect } from 'react'
import { Button } from './ui/button'
import Link from 'next/link';
import { LogIn, LogOut } from 'lucide-react';

export default function LoginButton({
  className,
  variant = "outline",
}: {
  className?: string;
  variant?:
    | "outline"
    | "link"
    | "default"
    | "destructive"
    | "secondary"
    | "ghost"
    | null
    | undefined;
}) {
  let isLogin;
  useEffect(() => {
    isLogin = localStorage?.getItem("token") !== null;
  }, [isLogin])
  
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("role");
    window.location.reload();
  };
  return (
    <Link href={"/login"}>
      <Button
        onClick={isLogin ? () => handleLogout() : () => {}}
        className={`text-muted-foreground ${className}`}
        variant={variant}
      >
        {isLogin ? <LogOut /> : <LogIn />}
        {isLogin ? "Logout" : "Login"}
      </Button>
    </Link>
  );
}
