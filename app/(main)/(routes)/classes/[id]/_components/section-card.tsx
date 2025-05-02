import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Calendar, PlusCircle, ChevronRight, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';
import SectionStudentsModal from './section-students-modal';
import DeleteSectionDialog from './delete-section-dialog';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

interface SectionCardProps {
  section: Section;
  classId: string;
  canManage: boolean;
  onDelete: (sectionId: string) => Promise<void>;
  classData: any;
}

export default function SectionCard({ section, classId, canManage, onDelete, classData }: SectionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(section._id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return 'N/A';
    }
  };

  // Map day number to day name
  const getDayName = (dayNumber: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber % 7]; // Ensure it's within 0-6 range
  };

  // Get color based on day of week
  const getDayColor = (dayNumber: number): string => {
    const colors = [
      'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',        // Sunday
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',    // Monday
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',// Tuesday
      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', // Wednesday
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300', // Thursday
      'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',    // Friday
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'  // Saturday
    ];
    return colors[dayNumber % 7];
  };

  return (
    <TooltipProvider>
      <Card className="h-full flex flex-col  transition-all duration-300 hover:shadow-md border-border hover:border-primary/20">
        {/* Section number badge - positioned prominently */}
        
        
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <Badge 
              className={`${getDayColor(section.dayNumber)} border-0 font-medium py-1.5`}
            >
              <Calendar className="mr-1 h-3.5 w-3.5" />

              {getDayName(section.dayNumber)}
              &nbsp; section {section.sectionNumber}
            </Badge>
            
            {canManage && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                    onClick={() => setIsDeleteDialogOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Delete section</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="flex-grow flex flex-col justify-center py-6">
          <div className="flex items-center justify-center">
            <div className="bg-muted/50 p-4 rounded-full">
              <Users className="h-7 w-7 text-primary" />
            </div>
          </div>
          
          <div className="text-center mt-4">
            <div className="text-2xl font-bold">{section.students?.length || 0}</div>
            <div className="text-sm text-muted-foreground">
              Student{section.students?.length !== 1 ? 's' : ''} Enrolled
            </div>
          </div>
          
          <div className="mt-4 text-xs text-center text-muted-foreground">
            Created: {formatDate(section.createdAt)}
          </div>
        </CardContent>
        
        <CardFooter className="flex items-center justify-center gap-2 border-t bg-muted/10 p-3 ">
          {/* <Button 
            variant="outline" 
            size="sm"
            className="flex items-center justify-center"
            onClick={() => setIsStudentsModalOpen(true)}
          >
            <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> 
            <span>{canManage ? "Edit" : "View"}</span>
          </Button> */}
          
          <Button
            onClick={() => router.push(`/classes/${classId}/section/${section._id}`)}
            variant="default"
            size="sm"
            className="flex items-center justify-center"
          >
            <ClipboardList className="mr-1.5 h-3.5 w-3.5" /> 
            <span>Manage</span>
          </Button>
        </CardFooter>
      </Card>
      
      {/* Section students modal
      <SectionStudentsModal
        isOpen={isStudentsModalOpen}
        onOpenChange={setIsStudentsModalOpen}
        section={section}
        classId={classId}
        classData={classData}
        canManage={canManage}
      /> */}

      {/* Delete section confirmation dialog */}
      <DeleteSectionDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        sectionNumber={section.sectionNumber}
        isDeleting={isDeleting}
      />
    </TooltipProvider>
  );
}