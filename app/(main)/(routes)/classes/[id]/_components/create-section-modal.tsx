import React, { useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from 'lucide-react'; // Import Loader icon

// Define the structure for existing sections if needed for validation
interface ExistingSection {
  sectionNumber: number;
  dayNumber: number;
  // Add other relevant fields if necessary
}

interface CreateSectionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateSection: (sectionNumber: number, dayNumber: number) => Promise<void>;
  existingSections?: ExistingSection[];
}

// Define options for selects
// Increase the number of section options - SelectContent will scroll if needed
const sectionNumberOptions = Array.from({ length: 30 }, (_, i) => i + 1); // Sections 1-30

// Update day options: Saturday to Thursday
// Assuming backend expects values 1-6 for Sat-Thurs respectively.
// Adjust 'value' if your backend expects different numbers (e.g., ISO day numbers).
const dayNumberOptions = [
  { value: 1, label: 'Saturday' }, // Assuming 1 represents Saturday
  { value: 2, label: 'Sunday' },   // Assuming 2 represents Sunday
  { value: 3, label: 'Monday' },   // Assuming 3 represents Monday
  { value: 4, label: 'Tuesday' },  // Assuming 4 represents Tuesday
  { value: 5, label: 'Wednesday' },// Assuming 5 represents Wednesday
  { value: 6, label: 'Thursday' }, // Assuming 6 represents Thursday
];

export function CreateSectionModal({
  isOpen,
  onOpenChange,
  onCreateSection,
  existingSections = [],
}: CreateSectionModalProps) {
  const [selectedSectionNumber, setSelectedSectionNumber] = useState<string>('');
  const [selectedDayNumber, setSelectedDayNumber] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async () => {
    if (!selectedSectionNumber || !selectedDayNumber) {
      toast.error("Please select both a section number and a day.");
      return;
    }

    const sectionNum = parseInt(selectedSectionNumber, 10);
    const dayNum = parseInt(selectedDayNumber, 10); // This is the value (e.g., 1 for Saturday)

    // Optional: Validate against existing sections
    const alreadyExists = existingSections.some(
      // Ensure this comparison uses the same day number logic as your backend/data
      sec => sec.sectionNumber === sectionNum && sec.dayNumber === dayNum
    );
    if (alreadyExists) {
      toast.error(`Section ${sectionNum} on the selected day already exists.`);
      return;
    }

    setIsCreating(true);
    try {
      // Pass the numeric values to the creation function
      await onCreateSection(sectionNum, dayNum);
      // Reset state and close modal on success (handled partly by parent, partly here)
      setSelectedSectionNumber('');
      setSelectedDayNumber('');
      onOpenChange(false); // Explicitly close modal on success
    } catch (error) {
      console.error("Error during section creation:", error);
      // Error toast is likely handled in `onCreateSection`, but modal knows creation failed.
    } finally {
      setIsCreating(false);
    }
  };

  // Reset state when modal is closed or opened
  const handleOpenChange = (open: boolean) => {
      if (!open) {
          // Reset selections when closing
          setSelectedSectionNumber('');
          setSelectedDayNumber('');
          setIsCreating(false); // Ensure loading state is reset
      }
      onOpenChange(open);
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Section</DialogTitle>
          <DialogDescription>
            Select the section number and the day of the week for the new section.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Section Number Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="section-number" className="text-right">
              Section
            </Label>
            <Select
              value={selectedSectionNumber}
              onValueChange={setSelectedSectionNumber}
              disabled={isCreating}
            >
              <SelectTrigger id="section-number" className="col-span-3">
                <SelectValue placeholder="Select section number" />
              </SelectTrigger>
              {/* SelectContent will automatically handle scrolling if options exceed max height */}
              <SelectContent>
                {sectionNumberOptions.map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    Section {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Number Select */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="day-number" className="text-right">
              Day
            </Label>
            <Select
              value={selectedDayNumber}
              onValueChange={setSelectedDayNumber}
              disabled={isCreating}
            >
              <SelectTrigger id="day-number" className="col-span-3">
                <SelectValue placeholder="Select day of the week" />
              </SelectTrigger>
              <SelectContent>
                {dayNumberOptions.map((day) => (
                  <SelectItem key={day.value} value={String(day.value)}>
                    {day.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
             <Button variant="outline" disabled={isCreating}>Cancel</Button>
          </DialogClose>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!selectedSectionNumber || !selectedDayNumber || isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Section"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}