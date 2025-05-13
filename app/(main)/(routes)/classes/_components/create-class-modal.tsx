import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/spinner";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Instructor {
  id: string;
  name: string;
  email: string;
}

interface CreateClassModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onClassCreated: () => void;
  teacherId: string | null; // For instructor
  userRole: "admin" | "instructor";
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({
  isOpen,
  onOpenChange,
  onClassCreated,
  teacherId,
}) => {
  const [name, setName] = useState("");
  const [semester, setSemester] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));

  // For admin: instructor select
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(
    null,
  );

  // Fetch instructors if admin
  useEffect(() => {
    if (isOpen && userRole === "admin") {
      setInstructors([]);
      setSelectedTeacherId(null);
      axios
        .get(`${process.env.NEXT_PUBLIC_NETWORK_HOST}/api/auth/instructor`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        })
        .then((res) => {
          console.log(res.data.data);
          setInstructors(res.data.data || []);
        })
        .catch(() => {
          toast.error("Failed to fetch instructors.");
        });
    }
  }, [isOpen, userRole]);

  // Clear form when modal opens or teacherId changes
  useEffect(() => {
    if (isOpen) {
      setName("");
      setSemester("");
      setError(null);
      if (userRole === "admin") setSelectedTeacherId(null);
    }
  }, [isOpen, userRole]);

  const handleCreate = async () => {
    if (!name || !semester) {
      setError("Please fill in both class name and semester.");
      return;
    }
    let finalTeacherId = teacherId;
    if (userRole === "admin") {
      if (!selectedTeacherId) {
        setError("Please select an instructor.");
        return;
      }
      finalTeacherId = selectedTeacherId;
    }
    if (!finalTeacherId) {
      setError("Could not verify teacher identity. Please try reloading.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Authentication token not found.");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_NETWORK_HOST}/api/class/create`,
        {
          name,
          semester,
          teacherId: finalTeacherId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status === 201 || response.status === 200) {
        toast.success(`Class "${name}" created successfully!`);
        onClassCreated();
        onOpenChange(false);
      } else {
        throw new Error(
          response.data?.message ||
            `Failed to create class (Status: ${response.status})`,
        );
      }
    } catch (err: any) {
      let errorMessage = "Failed to create class. Please try again later.";
      if (axios.isAxiosError(err) && err.response) {
        errorMessage =
          err.response.data?.message || `Error ${err.response.status}`;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleCreate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-w-[95vw] w-full">
        <DialogHeader>
          <DialogTitle>Create New Class</DialogTitle>
          <DialogDescription>
            Fill in the details below to create a new class.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          {userRole === "admin" && (
            <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
              <Label htmlFor="teacher" className="text-left sm:text-right">
                Instructor
              </Label>
              <div className="col-span-1 sm:col-span-3">
                <Select
                  disabled={isLoading}
                  value={selectedTeacherId || ""}
                  onValueChange={(value) => setSelectedTeacherId(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an instructor" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((inst) => (
                      <SelectItem key={inst._id} value={inst._id}>
                        {inst.name} ({inst.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-left sm:text-right">
              Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-1 sm:col-span-3"
              placeholder="e.g., Introduction to Programming"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 items-center gap-4">
            <Label htmlFor="semester" className="text-left sm:text-right">
              Semester
            </Label>
            <Input
              id="semester"
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="col-span-1 sm:col-span-3"
              placeholder="e.g., Fall 2024"
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
          {error && (
            <p className="col-span-4 text-sm text-red-600 dark:text-red-500 text-center">
              {error}
            </p>
          )}
        </form>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            onClick={handleCreate}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
            {isLoading ? "Creating..." : "Create Class"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
