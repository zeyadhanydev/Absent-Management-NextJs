'use client';

import Image from "next/image";
// import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
// import { useMutation } from "convex/react";
// import {api} from "@/convex/_generated/api";
// import { toast } from "sonner";

const DocumentsPage = () => {
  // const { user } = useUser();
  // const create = useMutation(api.documents.create);

  // Get states form the page.
  const onCreate = () => {
  // const promise = create({
  //   title: 'Untitled',
    
  // });
  // toast.promise(promise, {
  //   loading: "Creating a new note...",
  //   success: "New note created!",
  //   error: "Failed to create a new note",
  // })
  };

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-4">

home
    </div>
  );
}
export default DocumentsPage; 