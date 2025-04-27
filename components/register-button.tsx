'use client';
import React from 'react'
import { Button } from './ui/button'
import Link from 'next/link';


export default function RegisterButton({className, variant = 'outline'}: {className?: string, variant?: "outline" | "link" | "default" | "destructive" | "secondary" | "ghost" | null | undefined}) {
    const isLogin = localStorage?.getItem('token') !== null;
    console.log(isLogin)

  return (
    !isLogin && (
        <Link href={"/register"}>
      <Button
        className={`text-muted-foreground ${className}`}
        variant={variant}
      >
        Register
      </Button></Link>
    )
  );
}
