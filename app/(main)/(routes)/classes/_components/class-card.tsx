import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen } from 'lucide-react'; // Example icons

// Define the structure of a student (simplified)
interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
}

// Define the props for the ClassCard based on your data structure
interface ClassCardProps {
  classData: {
    _id: string;
    name: string;
    teacherId: string; // Keep it, might be useful later
    semester: string;
    status: "active" | "inactive" | string; // Allow string for flexibility
    students: Student[];
    createdAt: string;
    updatedAt: string;
    sectionCount: number; // Added from your data
  };
}

export const ClassCard: React.FC<ClassCardProps> = ({ classData }) => {
  const studentCount = classData.students?.length || 0; // Calculate student count safely

  // Determine badge variant based on status
  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'default'; // Use default (often green or blue) for active
      case 'inactive':
        return 'secondary'; // Use secondary (often gray) for inactive
      default:
        return 'outline'; // Fallback variant
    }
  };

  return (
    <Card className="flex flex-col h-full"> {/* Ensure card takes full height in grid cell */}
      <CardHeader>
        <CardTitle className="text-lg">{classData.name}</CardTitle>
        <CardDescription>{classData.semester}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-3"> {/* flex-grow to push footer down */}
        <div className="flex items-center text-sm text-muted-foreground">
          <Users className="mr-2 h-4 w-4" />
          <span>{studentCount} Student{studentCount !== 1 ? 's' : ''} enrolled</span>
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <BookOpen className="mr-2 h-4 w-4" />
          <span>{classData.sectionCount} Section{classData.sectionCount !== 1 ? 's' : ''}</span>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center pt-4">
        <Badge variant={getStatusVariant(classData.status)} className="capitalize">
          {classData.status}
        </Badge>
        {/* Optional: Add an action button */}
        {/* <Button size="sm" variant="outline">View Details</Button> */}
      </CardFooter>
    </Card>
  );
};