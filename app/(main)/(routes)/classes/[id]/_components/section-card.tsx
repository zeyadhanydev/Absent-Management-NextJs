import React, { useState } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Users, Calendar, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import SectionStudentsModal from './section-students-modal';

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
}

export default function SectionCard({ section, classId, canManage, onDelete }: SectionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStudentsModalOpen, setIsStudentsModalOpen] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete Section ${section.sectionNumber}?`)) {
      return;
    }
    
    setIsDeleting(true);
    try {
      await onDelete(section._id);
    } finally {
      setIsDeleting(false);
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

  return (
    <>
      <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Section {section.sectionNumber}</span>
            {canManage && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-destructive" 
                onClick={handleDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="h-4 w-4 border-2 border-t-transparent animate-spin rounded-full" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-grow">
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4" />
              <span>Day: {getDayName(section.dayNumber)} (Day {section.dayNumber})</span>
            </div>
            <div className="flex items-center text-muted-foreground">
              <Users className="mr-2 h-4 w-4" />
              <span>{section.students?.length || 0} Student(s)</span>
            </div>
            <div className="flex items-center text-muted-foreground text-xs">
              Created: {formatDate(section.createdAt)}
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => setIsStudentsModalOpen(true)}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> {canManage ? "Manage Students" : "View Students"}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Section students modal */}
      <SectionStudentsModal
        isOpen={isStudentsModalOpen}
        onOpenChange={setIsStudentsModalOpen}
        section={section}
        classId={classId}
        canManage={canManage}
      />
    </>
  );
}