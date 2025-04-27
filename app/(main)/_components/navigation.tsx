import { cn } from '@/lib/utils';
import { ChevronLeftSquareIcon, ChevronRight, ChevronsLeftIcon, LogOut, MenuIcon, PlusCircle, School, Search, Settings, TableCellsSplitIcon } from 'lucide-react'
import { usePathname } from 'next/navigation';
import React, { ComponentRef, useEffect, useRef, useState } from 'react'
import {useMediaQuery} from "usehooks-ts";
import { UserItem } from './user-item';
// import { useMutation, useQuery } from 'convex/react';
// import {api } from '@/convex/_generated/api'
import { Item } from './item';
import { toast } from 'sonner';
import { SidebarItem } from './sidebar-item';
import Link from 'next/link';
import LoginButton from '@/components/login-button';
export default function Navigation() {
    const pathname = usePathname();
  // const documents = useQuery(api.documents.get);
  // const create = useMutation(api.documents.create);

    const isMobile = useMediaQuery("(max-width: 768px)");
    const isResizingRef = useRef(false);
    const sidebarRef = useRef<ComponentRef<"aside">>(null);
    const navbarRef = useRef<ComponentRef<"div">>(null);
    const [isResetting, setIsResetting] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(isMobile);

      useEffect(() => {
        if (isMobile) {
          collapse();
        }
        else {
          resetWidth();
        }
      }, [isMobile])

      useEffect(() => {
        if (isMobile) {
          collapse();
        }
      }, [pathname, isMobile])
      
    const handleMouseDown = (event: React.MouseEvent<HTMLDivElement,MouseEvent>) => {
      event.preventDefault();
      event.stopPropagation(); 
      isResizingRef.current = true;
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp)
    }
 const handleMouseMove = (event: MouseEvent) => {
  if (!isResizingRef.current) return;
  let newWidth = event.clientX;
  // controlle the width of the sidebar
  if (newWidth < 240) newWidth = 240;
  if (newWidth > 480) newWidth = 480;

  if (sidebarRef.current && navbarRef.current) {
    sidebarRef.current.style.width = `${newWidth}px`;
    navbarRef.current.style.setProperty('left', `${newWidth}px`);
    navbarRef.current.style.setProperty('width', `calc(100% - ${newWidth}px)`);
  }
 };
 const handleMouseUp = () => {
  isResizingRef.current = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
 };
 const resetWidth = () => {
  if (sidebarRef.current && navbarRef.current) {
      setIsCollapsed(false);
      setIsResetting(true);
      sidebarRef.current.style.width = isMobile ? '100%' : '240px';
      navbarRef.current.style.setProperty('width', isMobile ? '0' : 'calc(100% - 240px)');
      navbarRef.current.style.setProperty(
        'left',
        isMobile ? '0' : '240px'
      )
      setTimeout(() => {
        setIsResetting(false);
      }, 300);
  }
 }
 const collapse = () => {
  if (sidebarRef.current && navbarRef.current) {
    setIsCollapsed(true);
    setIsResetting(true);
    sidebarRef.current.style.width = '0';
    // set the width of the navbar to 100% and left to 0
    navbarRef.current.style.setProperty('width', '100%');
    navbarRef.current.style.setProperty('left', '0');

    setTimeout(() => setIsResetting(false), 300);
  }
 }

  return (
    <>
      <aside
        ref={sidebarRef}
        className={cn(
          "group/sidebar h-full bg-secondary overflow-y-auto relative flex w-60 flex-col z-[99999]",
          isMobile && "w-0",
          isResetting && "transition-all duration-300 ease-in-out"
        )}
      >
        <div
          role="button"
          onClick={collapse}
          className={cn(
            "h-6 w-6 text-muted-foreground rounded-sm hover:bg-neutral-300 dark:hover:bg-neutral-600 absolute top-3 right-2 opacity-0 group-hover/sidebar:opacity-100 transition",
            isMobile && "opacity-100"
          )}
        >
          <ChevronsLeftIcon className="h-6 w-6" />
        </div>
        <div>
          <div className="py-10">
            <h1 className="text-sm text-center font-bold text-muted-foreground">
              Student Management System
            </h1>
          </div>
          <Item isSearch label="Search" icon={Search} onClick={() => {}} />
          <Item label="Settings" icon={Settings} onClick={() => {}} />
          <Link href="classes">
            <SidebarItem
              label="Classes"
              icon={School}
              controls={<ChevronRight />}
            />
          </Link>
        </div>
        <div
          className="mt-auto self-end"
        >
          <LoginButton variant={"link"} />
        </div>
        <div
          onMouseDown={handleMouseDown}
          onDoubleClick={resetWidth}
          className="opacity-0 group-hover/sidebar:opacity-100 transition cursor-ew-resize absolute h-full w-1 bg-primary/10 right-0 top-0"
        />
      </aside>
      <div
        ref={navbarRef}
        className={cn(
          "absolute top-0 z-[99999] left-60 w-[calc(100%-240px)]",
          isResetting && "transition-all ease-in-out duration-300",
          isMobile && "left-0 w-full"
        )}
      >
        <nav className="bg-transparent px-3 py-2 w-full">
          {isCollapsed && (
            <MenuIcon
              onClick={resetWidth}
              role="button"
              className="h-6 w-6 text-muted-foreground"
            ></MenuIcon>
          )}
        </nav>
      </div>
    </>
  );
}
