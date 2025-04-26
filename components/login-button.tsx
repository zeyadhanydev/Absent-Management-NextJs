'use client';
import React from 'react'
import { Button } from './ui/button'


export default function LoginButton({className, variant = 'outline'}: {className?: string, variant?: "outline" | "link" | "default" | "destructive" | "secondary" | "ghost" | null | undefined}) {
    const isLogin = localStorage?.getItem('token') !== null;
    console.log(isLogin)
   const  handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    }
  return (
    <Button onClick={isLogin ? () => handleLogout() : () => {}} className={`text-muted-foreground ${className}`} variant={variant}>{isLogin ? 'Logout' : "Login"}</Button>
  )
}
