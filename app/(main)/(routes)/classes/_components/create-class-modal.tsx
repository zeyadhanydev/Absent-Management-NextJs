import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger, // Trigger will be handled in the parent page
  DialogClose // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from '@/components/spinner'; // Assuming spinner path
import { toast } from 'sonner';

interface CreateClassModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClassCreated: () => void; // Callback to refresh classes list
  teacherId: string | null; // Pass the fetched teacher ID
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onOpenChange,
  onClassCreated,
  teacherId
}) => {
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear form when modal opens or teacherId changes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setSemester("");
      setError(null);
    }
  }, [isOpen]);

  const handleCreate = async () => {
    if (!name || !semester) {
      setError("Please fill in both class name and semester.");
      return;
    }
    if (!teacherId) {
        setError("Could not verify teacher identity. Please try reloading.");
        return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication token not found.");
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_NETWORK_HOST}/api/class/create`,
        {
          name,
          semester,
          teacherId, // Use the ID passed via props
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201 || response.status === 200) { // Handle 201 Created or 200 OK
        toast.success(`Class "${name}" created successfully!`);
        onClassCreated(); // Trigger class list refresh in parent
        onOpenChange(false); // Close the modal
      } else {
        throw new Error(response.data?.message || `Failed to create class (Status: ${response.status})`);
      }
    } catch (err: any) {
      console.error("Failed to create class:", err);
      let errorMessage = "Failed to create class. Please try again later.";
       if (axios.isAxiosError(err) && err.response) {
         errorMessage = err.response.data?.message || `Error ${err.response.status}`;
       } else if (err instanceof Error) {
         errorMessage = err.message;
       }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new class.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Introduction to Programming"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="semester" className="text-right">
              Semester
            </Label>
            <Input
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Fall 2024"
              disabled={isLoading}
            />
          </div>
          {error && (
             <p className="col-span-4 text-sm text-red-600 dark:text-red-500 text-center">{error}</p>
          )}
        </div>
        <DialogFooter>
           {/* Use DialogClose for the Cancel button */}
           <DialogClose asChild>
             <Button type="button" variant="outline" disabled={isLoading}>
               Cancel
             </Button>
           </DialogClose>
          <Button type="button" onClick={handleCreate} disabled={isLoading}>
            {isLoading ? <Spinner size="sm"/> : null}
            {isLoading ? 'Creating...' : 'Create Class'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};