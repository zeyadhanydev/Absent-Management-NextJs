import React from 'react';
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Loader2 } from 'lucide-react';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

interface StudentsGridProps {
  students: Student[];
  canManage: boolean;
  onRemoveStudent: (studentId: string) => Promise<void>;
}

export default function StudentsGrid({ students, canManage, onRemoveStudent }: StudentsGridProps) {
  const [isRemoving, setIsRemoving] = React.useState<string | null>(null);

  const handleRemoveClick = async (studentId: string) => {
    setIsRemoving(studentId);
    try {
      await onRemoveStudent(studentId);
    } finally {
      setIsRemoving(null);
    }
  };

  if (students.length === 0) {
    return (
      <div className="text-center py-10 border rounded-md bg-muted/20">
        <p className="text-muted-foreground">No students enrolled in this class.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
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
          {students.map((student) => (
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
                    onClick={() => handleRemoveClick(student._id)}
                    disabled={isRemoving === student._id}
                  >
                    {isRemoving === student._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span className="sr-only">Remove student</span>
                  </Button>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}