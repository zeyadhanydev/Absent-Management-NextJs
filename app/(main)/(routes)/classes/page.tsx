'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ClassCard } from './_components/class-card'; // Adjust path if needed
import { Spinner } from '@/components/spinner'; // Assuming spinner path
import { toast } from 'sonner'; // Import toast for error notifications

// Define the Class interface based on expected API data
interface ClassData {
  _id: string;
  name: string;
  teacherId: string;
  semester: string;
  status: string;
  students: any[]; // Keep as any[] or define Student interface if needed elsewhere
  createdAt: string;
  updatedAt: string;
  sectionCount: number;
}

export default function ClassesPage() { // Renamed component for clarity
  const [classes, setClasses] = useState<ClassData[]>([]); // Typed state
  const [isLoading, setIsLoading] = useState(true); // Start in loading state
  const [error, setError] = useState<string | null>(null); // State for error messages

  useEffect(() => {
    const getAllClasses = async () => {
      setIsLoading(true); // Set loading true at the start of fetch
      setError(null); // Clear previous errors
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          throw new Error("Authentication token not found.");
        }

        const response = await axios.get<{ data: ClassData[] }>( // Type the expected response structure
          "http://localhost:4000/api/class/my-classes",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            // Optional: Add timeout
            // timeout: 10000, // 10 seconds
          }
        );

        console.log('Fetched classes:', response.data.data);
        setClasses(response.data.data || []); // Ensure it's an array
      } catch (err: any) { // Catch any error
        console.error("Failed to fetch classes:", err);
        let errorMessage = "Failed to load classes. Please try again later.";
        if (axios.isAxiosError(err)) {
          if (err.response) {
            // Backend responded with an error status
            errorMessage = err.response.data?.message || `Error ${err.response.status}`;
          } else if (err.request) {
            // Request was made but no response received
            errorMessage = "Could not connect to the server. Please check your connection.";
          } else {
             // Error setting up the request
             errorMessage = err.message;
          }
        } else if (err instanceof Error) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        toast.error(errorMessage); // Show error toast
        setClasses([]); // Clear classes on error
      } finally {
        setIsLoading(false); // Set loading false after fetch attempt (success or fail)
      }
    };

    getAllClasses();
  }, []); // Empty dependency array ensures this runs only once on mount

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-200px)]"> {/* Adjust min-height as needed */}
        <Spinner size="large" /> {/* Use your Spinner component */}
      </div>
    );
  }

  // Render error state
//   if (error) { // You might want a more prominent error display than just toast
//     return (
//       <div className="container mx-auto p-6 text-center text-red-600">
//         <p>Error loading classes: {error}</p>
//         <Button onClick={getAllClasses} className="mt-4">Retry</Button> {/* Add a retry button */}
//       </div>
//     );
//  }

  // Render content (classes or no classes message)
  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-2">
        My Classes
      </h1>

      {classes.length === 0 && !isLoading ? ( // Show message only if not loading and no classes
         <div className="text-center text-muted-foreground mt-10">
           <p>You are not enrolled in any classes yet.</p>
           {/* Optional: Add a link or button to find classes */}
         </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {classes.map((classItem) => (
            <ClassCard key={classItem._id} classData={classItem} />
          ))}
        </div>
      )}
    </div>
  );
}