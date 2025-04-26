'use client';

import { Avatar } from "@/components/ui/avatar";
// import { SignOutButton, useUser } from "@clerk/clerk-react";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronsLeftRight, CopyIcon } from "lucide-react";
import { ComponentRef, useRef } from "react";

export const UserItem = () => {
    // const {user} = useUser(); // get current login 
    const copyRef = useRef<ComponentRef<'svg'>>(null);


    const handleCopyEmail = () => {
        // const email = user?.emailAddresses[0]?.emailAddress;
        // if (email) {
        //     navigator.clipboard.writeText(email);
        //     copyRef.current?.style.setProperty('color', 'green');
        //     setTimeout(() => {
        //         copyRef.current?.style.setProperty('color', 'black');

        //     }, 300);
        // }
    }
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            role="button"
            className="
            flex items-center text-sm p-3 w-full hover:bg-primary/5"
          >
            <div className="gap-x-2 flex items-center max-w-[150px]">
              <Avatar className="h-5 w-5">
                {/* <AvatarImage src={user?.imageUrl} /> */}
              </Avatar>
              <span className="text-start font-medium line-clamp-1">
                {/* {user?.fullName}&apos;s Jotion */}
              </span>
            </div>
            <ChevronsLeftRight className="rotate-90 ml-2 text-muted-foreground h-4 w-4 cursor-pointer" />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-80" align="start" alignOffset={10}>
          <div className="flex flex-col space-y-4 p-2 rounded-md">
            <p className="flex items-center justify-between text-xs font-medium text-muted-foreground leading-none transition-all duration-300">
              {/* {user?.emailAddresses[0]?.emailAddress} */}
              <span><CopyIcon className="transition-all duration-300" ref={copyRef} onClick={handleCopyEmail}/></span>
            </p>
            <div className="flex items-center gap-x-2 hover:bg-secondary">
              <div className="rounded-md p-1">
                <Avatar className="h-8 w-8">
                  {/* <AvatarImage src={user?.imageUrl} /> */}
                  {/* <AvatarFallback>{user?.firstName}</AvatarFallback> */}
                </Avatar>
              </div>
              <div className="space-y-1">
                {/* <p className="text-sm font-medium">{user?.fullName}</p> */}
              </div>
              
            </div>
            <DropdownMenuSeparator />
          <DropdownMenuItem className="cursor-pointer w-full text-muted-foreground" asChild> 
            {/* <SignOutButton> */}
                {/* Log out */}

            {/* </SignOutButton> */}
            </DropdownMenuItem>
          </div>
          
            </DropdownMenuContent>
      </DropdownMenu>
    );
}