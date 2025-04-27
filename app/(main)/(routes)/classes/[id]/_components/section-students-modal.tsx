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
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem 
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils"; // Make sure you have this utility
import { toast } from "sonner";
import { Spinner } from "@/components/spinner";

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

interface Section {
  _id: string;
  classId: string;
  sectionNumber: number;
  dayNumber: number;
  students: Student[];
  createdAt: string;
}

interface SectionStudentsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  section: Section;
  classId: string;
  canManage: boolean;
}

export default function SectionStudentsModal({
  isOpen,
  onOpenChange,
  section,
  classId,
  canManage
}: SectionStudentsModalProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [sectionStudents, setSectionStudents] = useState<Student[]>(section.students || []);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  // When the modal opens, fetch available students
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
      // Update section students from the section prop
      setSectionStudents(section.students || []);
    }
  }, [isOpen, section]);

  const fetchAvailableStudents = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      
      const response = await axios.get('http://localhost:4000/api/auth/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out students already in this section
      const sectionStudentIds = new Set(section.students?.map(s => s._id));
      const availableStudents = response.data.data.filter(
        (student: Student) => !sectionStudentIds.has(student._id)
      );
      
      setAllStudents(availableStudents);
    } catch (error) {
      console.error('Failed to fetch students', error);
      toast.error('Failed to load available students');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStudent = async () => {
    if (!selectedStudentId) return;
    
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      
      await axios.post(
        'http://localhost:4000/api/attendance/section/add-students',
        {
          sectionId: section._id,
          studentIds: [selectedStudentId]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Find the added student from allStudents and add to sectionStudents
      const addedStudent = allStudents.find(s => s._id === selectedStudentId);
      if (addedStudent) {
        setSectionStudents(prev => [...prev, addedStudent]);
      }
      
      // Remove the added student from available students
      setAllStudents(prev => prev.filter(s => s._id !== selectedStudentId));
      
      // Reset selection
      setSelectedStudentId('');
      setOpen(false);
      
      toast.success('Student added to section');
    } catch (error) {
      console.error('Failed to add student to section', error);
      toast.error('Failed to add student to section');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    setRemovingStudentId(studentId);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      
      await axios.post(
        'http://localhost:4000/api/attendance/section/remove-students',
        {
          sectionId: section._id,
          studentIds: [studentId]
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Remove from section students
      setSectionStudents(prev => prev.filter(s => s._id !== studentId));
      
      // Add back to available students
      const removedStudent = sectionStudents.find(s => s._id === studentId);
      if (removedStudent) {
        setAllStudents(prev => [...prev, removedStudent]);
      }
      
      toast.success('Student removed from section');
    } catch (error) {
      console.error('Failed to remove student from section', error);
      toast.error('Failed to remove student from section');
    } finally {
      setRemovingStudentId(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Section {section.sectionNumber} Students</DialogTitle>
          <DialogDescription>
            Manage students in this section
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Student selector and add button - only for admins/instructors */}
          {canManage && (
            <div className="flex items-center space-x-2 mb-4">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="flex-1 justify-between"
                    disabled={isLoading || isUpdating}
                  >
                    {isLoading ? "Loading students..." : 
                     selectedStudentId ? 
                     allStudents.find(student => student._id === selectedStudentId)?.name || "Select student" : 
                     "Select student"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search student..." />
                    <CommandEmpty>No student found.</CommandEmpty>
                    <CommandGroup>
                      {allStudents.map((student) => (
                        <CommandItem
                          key={student._id}
                          value={student.name}
                          onSelect={() => {
                            setSelectedStudentId(student._id === selectedStudentId ? "" : student._id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStudentId === student._id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {student.name} ({student.studentId})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button 
                onClick={handleAddStudent} 
                disabled={!selectedStudentId || isUpdating || isLoading}
              >
                {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add"}
              </Button>
            </div>
          )}

          {/* Students table */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Spinner size="medium" />
            </div>
          ) : sectionStudents.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Email</TableHead>
                    {canManage && <TableHead className="w-[80px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionStudents.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell>{student.email}</TableCell>
                      {canManage && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleRemoveStudent(student._id)}
                            disabled={removingStudentId === student._id}
                          >
                            {removingStudentId === student._id ? (
                              <div className="h-4 w-4 border-2 border-t-transparent animate-spin rounded-full" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/20 rounded-lg">
              <p className="text-muted-foreground">No students in this section yet.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}