import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ChevronsUpDown, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
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
import { cn } from "@/lib/utils"; // Make sure you have this utility

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

interface ClassData {
  _id: string;
  name: string;
  students: Student[];
}

interface AddStudentFormProps {
  classData: ClassData;
  onAddStudent: (studentIds: string[]) => Promise<void>;
}

export default function AddStudentForm({ classData, onAddStudent }: AddStudentFormProps) {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [open, setOpen] = useState(false);

  // Get list of available students
  useEffect(() => {
    const fetchStudents = async () => {
      setSearching(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        
        const response = await axios.get("http://localhost:4000/api/auth/students", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter out students already in the class
        const enrolledStudentIds = new Set(classData.students.map(student => student._id));
        const availableStudents = response.data.data.filter(
          (student: Student) => !enrolledStudentIds.has(student._id)
        );
        
        setAllStudents(availableStudents);
      } catch (err) {
        console.error("Failed to fetch students:", err);
        toast.error("Failed to load available students");
      } finally {
        setSearching(false);
      }
    };

    fetchStudents();
  }, [classData.students]);

  // Handle student selection
  const toggleStudentSelection = (studentId: string) => {
    setSelectedStudentIds(current => {
      if (current.includes(studentId)) {
        // Remove student
        setSelectedStudents(current => current.filter(student => student._id !== studentId));
        return current.filter(id => id !== studentId);
      } else {
        // Add student
        const studentToAdd = allStudents.find(student => student._id === studentId);
        if (studentToAdd) {
          setSelectedStudents(current => [...current, studentToAdd]);
        }
        return [...current, studentId];
      }
    });
  };

  // Remove a selected student
  const removeSelectedStudent = (studentId: string) => {
    setSelectedStudentIds(current => current.filter(id => id !== studentId));
    setSelectedStudents(current => current.filter(student => student._id !== studentId));
  };

  const handleAddClick = async () => {
    if (selectedStudentIds.length === 0) {
      toast.error("Please select at least one student");
      return;
    }
    
    setLoading(true);
    try {
      await onAddStudent(selectedStudentIds);
      // Reset selections after successful add
      setSelectedStudentIds([]);
      setSelectedStudents([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Add Students</CardTitle>
        <CardDescription>Enroll students in this class</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                    disabled={searching || loading || allStudents.length === 0}
                  >
                    {searching 
                      ? "Loading students..." 
                      : allStudents.length === 0
                      ? "No students available"
                      : "Select students"}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Search students..." />
                    <CommandEmpty>No students found.</CommandEmpty>
                    <CommandGroup>
                      {allStudents.map((student) => (
                        <CommandItem
                          key={student._id}
                          value={student.name}
                          onSelect={() => toggleStudentSelection(student._id)}
                        >
                          <div className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                            selectedStudentIds.includes(student._id) 
                              ? "bg-primary text-primary-foreground" 
                              : "opacity-50"
                          )}>
                            {selectedStudentIds.includes(student._id) && (
                              <Check className="h-4 w-4" />
                            )}
                          </div>
                          <span>{student.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({student.studentId})
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <Button 
              onClick={handleAddClick} 
              disabled={selectedStudentIds.length === 0 || loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add {selectedStudentIds.length > 0 ? `(${selectedStudentIds.length})` : ''}
            </Button>
          </div>

          {/* Selected students */}
          {selectedStudents.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedStudents.map(student => (
                <Badge key={student._id} variant="secondary" className="flex items-center gap-1">
                  {student.name}
                  <button 
                    onClick={() => removeSelectedStudent(student._id)}
                    className="ml-1 rounded-full hover:bg-muted p-0.5"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">Remove {student.name}</span>
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}