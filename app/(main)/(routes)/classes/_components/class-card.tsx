import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  // CardFooter, // Keep CardFooter
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, BookOpen, CalendarDays, TrashIcon } from 'lucide-react'; // Ensure TrashIcon is imported
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Ensure Button is imported
import { useRouter } from 'next/navigation';

// Define the structure of a student (simplified)
interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

// Define the props for the ClassCard
interface ClassCardProps {
  classData: {
    _id: string;
    name: string;
    teacherId: string;
    semester: string;
    status: string;
    students: Student[];
    createdAt: string;
    updatedAt: string;
    sectionCount: number;
  };
  userData: { // Pass user data to check ownership/role
        _id: string;
        role: 'student' | 'admin' | 'instructor';
  } | null;
  onClick?: () => void; // For navigating to class details
  onDelete: (classId: string, className: string) => void; // Callback for delete request
}

export const ClassCard: React.FC<ClassCardProps> = ({ classData, userData, onClick, onDelete }) => {
  const studentCount = classData.students?.length || 0;
  const router = useRouter(); // Assuming you're using Next.js or a similar router
  // Determine badge variant based on status
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      default: return 'outline';
    }
  };

  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the card's onClick
    onDelete(classData._id, classData.name); // Call the handler passed from parent
  };
  console.log(userData)
  // Determine if the current user can delete this class
  // Only the teacher who created it or an admin can delete
  const canDelete = userData && (userData.role === 'admin');

  return (
    <Card
      className={cn(
        "group flex flex-col h-full overflow-hidden relative cursor-pointer", // Added group and relative positioning
        "transition-all duration-200 ease-in-out",
        "hover:shadow-lg", // Keep shadow, remove scale if delete button is primary hover target
        onClick ? "cursor-pointer hover:scale-[1.02]" : "", // Slightly less scale on card if clickable
      )}
      onClick={() => router.push(`/classes/${classData._id}`)} // Navigate to class details
    >
       {/* Delete Button - positioned top-right, visible on hover */}
       {canDelete && (
           <Button
             variant={'ghost'} // Use ghost for less visual clutter initially
             size="icon"
             className='absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/50 hover:bg-destructive/10' // Positioned, hides initially, shows on card hover
             onClick={handleDeleteClick}
             aria-label={`Delete class ${classData.name}`} // Accessibility
           >
             <TrashIcon className="h-4 w-4 text-destructive" />
           </Button>
       )}

      <CardHeader className="pt-4 pb-2"> {/* Adjusted padding */}
        <CardTitle className="text-lg truncate pr-8" title={classData.name}> {/* Add padding-right */}
            {classData.name}
        </CardTitle>
        <CardDescription className="flex items-center pt-1">
             <CalendarDays className="mr-1.5 h-4 w-4" />
             {classData.semester}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3 pt-2 pb-4"> {/* Adjusted padding */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{studentCount} Student{studentCount !== 1 ? 's' : ''} enrolled</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4 flex-shrink-0" />
          <span>{classData.sectionCount} Section{classData.sectionCount !== 1 ? 's' : ''}</span>
        </div>
      </CardContent>
      {/* Footer remains for status */}
      <CardFooter className="flex justify-start items-center pt-2 pb-3 border-t mt-auto"> {/* Added border-t, mt-auto */}
        <Badge
          variant={getStatusVariant(classData.status)}
          className="capitalize text-xs" // Smaller text
        >
          {classData.status}
        </Badge>
         {/* Removed the original delete button from here */}
      </CardFooter>
    </Card>
  );
};