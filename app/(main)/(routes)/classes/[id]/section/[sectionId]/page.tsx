'use client';

import React, { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList
} from "@/components/ui/command";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, ChevronsUpDown, Trash2, Loader2, QrCode, MapPin, ChevronLeft, PowerOff, X, Edit, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/spinner";
import QrCodeDialog from './_components/QrCodeDialog';

// --- Interfaces ---
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
  className?: string;
}

interface UserData {
  _id: string;
  name: string;
  role: 'student' | 'admin' | 'instructor';
}

interface LocationCoords {
    latitude: number;
    longitude: number;
}

interface QrCodeData {
    qrImage: string;
    expiresAt: string;
    codeId: string;
}

// --- LocalStorage Key ---
const MANUAL_LOCATION_STORAGE_KEY = 'manualAttendanceLocation';

// --- Component ---
export default function SectionPage({params}: {params: {id: string, sectionId: string}}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const classId = unwrappedParams.id;
  const sectionId = unwrappedParams.sectionId;

  // --- State ---
  const [sectionData, setSectionData] = useState<Section | null>(null);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

  // Loading States
  const [isLoadingSection, setIsLoadingSection] = useState(true);
  const [isLoadingAvailableStudents, setIsLoadingAvailableStudents] = useState(true);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isAddingStudents, setIsAddingStudents] = useState(false);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isClosingQr, setIsClosingQr] = useState(false);

  // UI State
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [qrCodeDetails, setQrCodeDetails] = useState<QrCodeData | null>(null);
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false);
  // Manual Location State
  const [showManualLocationInput, setShowManualLocationInput] = useState(false);
  const [manualLatitude, setManualLatitude] = useState('');
  const [manualLongitude, setManualLongitude] = useState('');
  const [storedManualLocation, setStoredManualLocation] = useState<LocationCoords | null>(null);

  // Permissions
  const canManage = userData?.role === 'admin' || userData?.role === 'instructor';
  
  // --- Check if QR code is expired ---
  const isQrCodeExpired = useCallback(() => {
    if (!qrCodeDetails || !qrCodeDetails.expiresAt) return false;
    try {
      const expirationDate = new Date(qrCodeDetails.expiresAt);
      return new Date() > expirationDate;
    } catch (e) {
      console.error("Error parsing expiresAt date:", e);
      return true; // Assume expired on error
    }
  }, [qrCodeDetails]);

  // --- Load Stored Location on Mount ---
  useEffect(() => {
    try {
        const storedLocationString = localStorage.getItem(MANUAL_LOCATION_STORAGE_KEY);
        if (storedLocationString) {
            const parsedLocation = JSON.parse(storedLocationString);
            if (typeof parsedLocation.latitude === 'number' && typeof parsedLocation.longitude === 'number') {
                 setStoredManualLocation(parsedLocation);
                 console.log("Loaded manual location from storage:", parsedLocation);
            } else {
                 console.warn("Invalid manual location data found in storage. Clearing.");
                 localStorage.removeItem(MANUAL_LOCATION_STORAGE_KEY);
            }
        }
    } catch (error) {
        console.error("Failed to load or parse manual location from localStorage", error);
        localStorage.removeItem(MANUAL_LOCATION_STORAGE_KEY);
    }
  }, []);

  // --- Data Fetching Callbacks ---
  const fetchUserData = useCallback(async () => {
    setIsLoadingUser(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
          toast.error("Authentication token not found. Please log in.");
          setIsLoadingUser(false);
          return;
      };
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
      const response = await axios.get(`${apiUrl}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch user data', error);
      toast.error('Failed to load user information.');
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  const fetchSectionData = useCallback(async () => {
    if (!sectionId) {
        console.warn("Section ID parameter is missing.");
        setIsLoadingSection(false);
        return;
    };
    setIsLoadingSection(true);
    setQrCodeDetails(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error("Authentication token not found.");
        setIsLoadingSection(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||`${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
      const response = await axios.get(`${apiUrl}/api/sections/my-sections`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const allSections: Section[] = response.data?.data || response.data || [];
      const currentSection = allSections.find(section => section._id === sectionId);

      if (currentSection) {
        setSectionData(currentSection);
      } else {
        console.error(`Section with ID ${sectionId} not found in user's sections.`);
        toast.error('Section details not found or access denied.');
        setSectionData(null);
      }

    } catch (error) {
      console.error('Failed to fetch or filter section data', error);
      toast.error('Failed to load section details.');
      setSectionData(null);
    } finally {
      setIsLoadingSection(false);
    }
  }, [sectionId]);

  const fetchAvailableStudents = useCallback(async () => {
    setIsLoadingAvailableStudents(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
          toast.error("Authentication token not found for fetching students.");
          setIsLoadingAvailableStudents(false);
          return;
      };

      const apiUrl = process.env.NEXT_PUBLIC_API_URL ||`${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
      const response = await axios.get(`${apiUrl}/api/auth/students`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const allSystemStudents: Student[] = response.data.data || [];
      setAllStudents(allSystemStudents);

      if (sectionData) {
          const sectionStudentIds = new Set(sectionData.students?.map(s => s._id) || []);
          const available = allSystemStudents.filter(s => !sectionStudentIds.has(s._id));
          setAvailableStudents(available.sort((a, b) => a.name.localeCompare(b.name)));
      } else {
          setAvailableStudents(allSystemStudents.sort((a, b) => a.name.localeCompare(b.name)));
      }

    } catch (error) {
      console.error('Failed to fetch students', error);
      toast.error('Failed to load available students list.');
      setAvailableStudents([]);
    } finally {
      setIsLoadingAvailableStudents(false);
    }
  }, [sectionData]);

  // --- Effects ---
  useEffect(() => {
    fetchUserData();
    fetchSectionData();
  }, [fetchUserData, fetchSectionData]);

  useEffect(() => {
    if (sectionData) {
      fetchAvailableStudents();
    }
  }, [sectionData, fetchAvailableStudents]);

  // --- Student Management Handlers ---
  const handleAddStudents = async () => {
    if (selectedStudentIds.size === 0 || !sectionData) return;
    setIsAddingStudents(true);
    const studentIdsArray = Array.from(selectedStudentIds);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
      await axios.post(`${apiUrl}/api/sections/add-students`,
        { sectionId: sectionData._id, studentIds: studentIdsArray },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const addedStudents = allStudents.filter(s => selectedStudentIds.has(s._id));
      setSectionData(prev => prev ? { ...prev, students: [...prev.students, ...addedStudents].sort((a,b) => a.name.localeCompare(b.name)) } : null);
      setAvailableStudents(prev => prev.filter(s => !selectedStudentIds.has(s._id)));
      setSelectedStudentIds(new Set());
      setPopoverOpen(false);
      toast.success(`${studentIdsArray.length} student(s) added.`);

    } catch (error) {
        console.error('Failed to add students', error);
        const message = error instanceof AxiosError ? error.response?.data?.message || error.message : (error as Error).message;
        toast.error(`Failed to add students: ${message}`);
    } finally {
      setIsAddingStudents(false);
    }
  };

  const handleRemoveStudent = async (studentIdToRemove: string) => {
    if (!sectionData) return;
    setRemovingStudentId(studentIdToRemove);

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Authentication token not found');

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
      await axios.delete(`${apiUrl}/api/sections/remove-students`,
        {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            data: { sectionId: sectionData._id, studentIds: [studentIdToRemove] }
        }
      );

      const removedStudent = sectionData.students.find(s => s._id === studentIdToRemove);
      setSectionData(prev => prev ? { ...prev, students: prev.students.filter(s => s._id !== studentIdToRemove) } : null);
      if (removedStudent && allStudents.some(s => s._id === removedStudent._id)) {
            setAvailableStudents(prev => [...prev, removedStudent].sort((a, b) => a.name.localeCompare(b.name)));
      }
      toast.success('Student removed.');

    } catch (error) {
        console.error('Failed to remove student', error);
        const message = error instanceof AxiosError ? error.response?.data?.message || error.message : (error as Error).message;
        toast.error(`Failed to remove student: ${message}`);
    } finally {
      setRemovingStudentId(null);
    }
  };

  // --- Location Helper (with error naming) ---
  const getLocation = (): Promise<LocationCoords> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const error = new Error("Geolocation is not supported by your browser.");
            error.name = 'GeolocationUnsupportedError';
            return reject(error);
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude });
            },
            (error) => {
                console.error("Geolocation error:", error);
                let message = "Failed to get location.";
                switch(error.code) {
                    case error.PERMISSION_DENIED: message = "Location permission denied."; break;
                    case error.POSITION_UNAVAILABLE: message = "Location information unavailable."; break;
                    case error.TIMEOUT: message = "Location request timed out."; break;
                }
                const geoError = new Error(message);
                geoError.name = 'GeolocationError';
                geoError.cause = error;
                reject(geoError);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });
  };

  // --- QR Code Handlers (with manual location fallback and storage) ---
  const handleGenerateQr = async (sourceCoords?: LocationCoords, source?: 'manual-input' | 'stored') => {
    if (!sectionData || !classId) {
      toast.error("Section or Class data is missing. Cannot generate QR.");
      return;
    }
    setIsGeneratingQr(true);
    setQrCodeDetails(null);
    setShowManualLocationInput(false);

    let locationCoords: LocationCoords | null = null;
    let locationSource: 'manual-input' | 'stored' | 'automatic' | null = null;

    // --- Determine Location Coordinates ---
    if (sourceCoords) {
        locationCoords = sourceCoords;
        locationSource = source || 'manual-input';
        toast.info(`Using ${locationSource === 'stored' ? 'stored' : 'manually entered'} location.`);
    } else if (storedManualLocation) {
        locationCoords = storedManualLocation;
        locationSource = 'stored';
        toast.info("Using stored manual location.");
    } else {
        setIsGettingLocation(true);
        try {
            locationCoords = await getLocation();
            locationSource = 'automatic';
            toast.success("Location obtained automatically.");
        } catch (locationError: any) {
             setIsGettingLocation(false);
             if (locationError.name === 'GeolocationError' || locationError.name === 'GeolocationUnsupportedError') {
                 toast.error(`${locationError.message} Please enter location manually.`);
                 if (storedManualLocation) {
                     setManualLatitude(storedManualLocation.latitude.toString());
                     setManualLongitude(storedManualLocation.longitude.toString());
                 }
                 setShowManualLocationInput(true);
                 setIsGeneratingQr(false);
                 return;
             } else {
                 toast.error(`An unexpected error occurred getting location: ${locationError.message}`);
                 setIsGeneratingQr(false);
                 return;
             }
        } finally {
             setIsGettingLocation(false);
        }
    }

    if (!locationCoords) {
        toast.error("Location coordinates could not be determined.");
        setIsGeneratingQr(false);
        return;
    }

    // --- Proceed with API call to generate QR ---
    try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token not found');

        const payload = {
            classId: classId,
            sectionId: sectionId,
            sectionNumber: sectionData.sectionNumber,
            dayNumber: sectionData.dayNumber,
            location: {
                latitude: locationCoords.latitude,
                longitude: locationCoords.longitude,
                radius: 500
            }
        };

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
        const response = await axios.post(`${apiUrl}/api/qrcodes/generate`, payload, { headers: { Authorization: `Bearer ${token}` } });

        if (response.data?.qrImage && response.data?.expiresAt && response.data?.codeId) {
             setQrCodeDetails({
                 qrImage: response.data.qrImage,
                 expiresAt: response.data.expiresAt,
                 codeId: response.data.codeId
             });
             setIsQrDialogOpen(true);
             toast.success(response.data.message || "QR Code generated successfully!");

             if (locationSource === 'manual-input' || locationSource === 'stored') {
                 try {
                      localStorage.setItem(MANUAL_LOCATION_STORAGE_KEY, JSON.stringify(locationCoords));
                      setStoredManualLocation(locationCoords);
                      console.log("Saved/Updated manual location to storage:", locationCoords);
                 } catch (storageError) {
                      console.error("Failed to save manual location to localStorage", storageError);
                      toast.error("Could not save manual location for future use.");
                 }
             }
        } else {
            throw new Error("QR Code data missing or invalid in API response.");
        }
    } catch (error) {
        console.error("Failed to generate QR code API call:", error);
        const message = error instanceof AxiosError ? error.response?.data?.message || error.message : (error as Error).message;
        toast.error(`QR generation failed: ${message}`);
        setQrCodeDetails(null);
    } finally {
        setIsGeneratingQr(false);
    }
  };

  // Handler for regenerating an expired QR code
  const handleRegenerateQr = async () => {
    try {
      setIsRegeneratingQr(true);
      setIsQrDialogOpen(false); // Close the dialog
      
      // Use stored location if available for consistency
      if (storedManualLocation) {
        await handleGenerateQr(storedManualLocation, 'stored');
        return;
      }
      
      // Otherwise try automatic location again
      await handleGenerateQr();
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  // Handler for the manual location form submission button
  const handleManualLocationSubmit = () => {
        const lat = parseFloat(manualLatitude);
        const lon = parseFloat(manualLongitude);

        if (isNaN(lat) || isNaN(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
            toast.error("Invalid latitude (-90 to 90) or longitude (-180 to 180).");
            return;
        }
        handleGenerateQr({ latitude: lat, longitude: lon }, 'manual-input');
  };

  // Handler to show the manual input form, pre-populated if needed
  const handleEditStoredLocation = () => {
      if (storedManualLocation) {
          setManualLatitude(storedManualLocation.latitude.toString());
          setManualLongitude(storedManualLocation.longitude.toString());
      } else {
          setManualLatitude('');
          setManualLongitude('');
      }
      setShowManualLocationInput(true);
  };

  // Handler to clear location from localStorage and state
  const handleClearStoredLocation = () => {
      try {
           localStorage.removeItem(MANUAL_LOCATION_STORAGE_KEY);
           setStoredManualLocation(null);
           setManualLatitude('');
           setManualLongitude('');
           toast.success("Stored manual location cleared.");
      } catch (error) {
           console.error("Failed to clear stored location", error);
           toast.error("Could not clear stored location.");
      }
  };

  // Handler to close the active QR code session via API
  const handleCloseQr = async () => {
      if (!sectionData) return;
      setIsClosingQr(true);
      try {
          const token = localStorage.getItem('token');
          if (!token) throw new Error('Authentication token not found');

          const payload = {
              sectionId: sectionData._id,
              dayNumber: sectionData.dayNumber,
              // codeId: qrCodeDetails?.codeId // Include if your API requires the specific code ID to close
          };
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || `${process.env.NEXT_PUBLIC_PROTOCOL}://${process.env.NEXT_PUBLIC_HOST ||process.env.NEXT_PUBLIC_NETWORK_HOST}:${process.env.NEXT_PUBLIC_PORT || process.env.NEXT_PUBLIC_NETWORK_PORT}`;
          const response = await axios.post(`${apiUrl}/api/qrcodes/close`, payload,
              { headers: { Authorization: `Bearer ${token}` } }
          );

          toast.success(response.data?.message || "Attendance closed successfully.");
          setIsQrDialogOpen(false);
          setQrCodeDetails(null);

      } catch (error) {
          console.error("Failed to close QR attendance:", error);
          const message = error instanceof AxiosError ? error.response?.data?.message || error.message : (error as Error).message;
          toast.error(`Failed to close attendance: ${message}`);
      } finally {
          setIsClosingQr(false);
      }
  };

  // --- Render Logic ---
  if (isLoadingUser || isLoadingSection) {
    return ( <div className="flex justify-center items-center min-h-screen"><Spinner size="lg" /></div> );
  }

  if (!sectionData && !isLoadingSection) {
    return (
      <div className="container mx-auto p-6 text-center">
         <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 absolute top-6 left-6">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <p className="text-xl text-muted-foreground mt-16">Section not found or access denied.</p>
      </div>
    );
  }
  if (!sectionData) return null;

  const getSelectedStudentsDisplay = () => {
    if (selectedStudentIds.size === 0) return "Select student(s)...";
    if (selectedStudentIds.size === 1) {
        const id = Array.from(selectedStudentIds)[0];
        const student = availableStudents.find(s => s._id === id);
        return student ? student.name : "1 student selected";
    }
    return `${selectedStudentIds.size} students selected`;
  };

  const dayMap: { [key: number]: string } = { 1: 'Sat', 2: 'Sun', 3: 'Mon', 4: 'Tue', 5: 'Wed', 6: 'Thu', 7: 'Fri' };
  const sectionDayName = dayMap[sectionData.dayNumber] || `Day ${sectionData.dayNumber}`;

  // Check if QR Code is expired for UI decisions
  const qrExpired = isQrCodeExpired();

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 relative pb-16">
       {/* Back Button */}
       <Button variant="outline" size="sm" onClick={() => router.back()} className="mb-4 absolute top-6 left-6 md:left-8 z-10">
            <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>

       {/* Header Card: Section Details */}
       <Card className="mb-8 mt-12 md:mt-16">
        <CardHeader>
          <CardTitle className="text-2xl md:text-3xl">
            Section {sectionData.sectionNumber} ({sectionDayName})
            {sectionData.className && ` - ${sectionData.className}`}
          </CardTitle>
          <CardDescription>
             Class ID: {sectionData.classId} | Section ID: {sectionData._id}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">Created At: {new Date(sectionData.createdAt).toLocaleDateString()}</p>
        </CardContent>
      </Card>

      {/* --- QR Code Section (Instructor/Admin Only) --- */}
       {canManage && (
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Attendance QR Code</CardTitle>
                    <CardDescription>Generate/view QR code. Location options available.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-4">

                    {/* --- Primary Actions (Conditional Rendering) --- */}

                    {/* 1. If QR is Active: Show View and Close Buttons */}
                    {qrCodeDetails && (
                        <div className="flex flex-wrap justify-center gap-2">
                            {/* View Button */}
                            <Button 
                                onClick={() => setIsQrDialogOpen(true)} 
                                className="w-full md:w-auto" 
                                variant="secondary"
                            >
                                <QrCode className="mr-2 h-4 w-4" /> View QR Code
                                {qrExpired && <span className="ml-2 text-red-500">(Expired)</span>}
                            </Button>
                            
                            {/* Close QR Button (outside dialog) */}
                            {!qrExpired && (
                                <Button
                                    onClick={handleCloseQr}
                                    disabled={isClosingQr}
                                    variant="destructive"
                                    className="w-full md:w-auto"
                                >
                                    {isClosingQr ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <PowerOff className="mr-2 h-4 w-4" />
                                    )}
                                    {isClosingQr ? 'Closing...' : 'Close QR Code'}
                                </Button>
                            )}
                            
                            {/* Regenerate Button (if expired) */}
                            {qrExpired && (
                                <Button
                                    onClick={handleRegenerateQr}
                                    disabled={isRegeneratingQr}
                                    className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white"
                                >
                                    {isRegeneratingQr ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <QrCode className="mr-2 h-4 w-4" />
                                    )}
                                    {isRegeneratingQr ? 'Generating...' : 'Generate New QR Code'}
                                </Button>
                            )}
                        </div>
                    )}

                    {/* 2. If Manual Input Form is Shown */}
                    {showManualLocationInput && !qrCodeDetails && (
                        <div className="w-full p-4 border rounded-md bg-secondary/30 flex flex-col gap-4 items-center shadow-inner">
                            <p className="text-sm font-medium text-center">Enter Location Manually:</p>
                            {/* Manual Lat/Lon Inputs */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                                 <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="latitude" className="text-xs">Latitude</Label>
                                    <Input type="number" id="latitude" placeholder="e.g., 40.7128" value={manualLatitude} onChange={(e) => setManualLatitude(e.target.value)} step="any" min="-90" max="90" disabled={isGeneratingQr} className="text-sm"/>
                                </div>
                                <div className="grid w-full items-center gap-1.5">
                                    <Label htmlFor="longitude" className="text-xs">Longitude</Label>
                                    <Input type="number" id="longitude" placeholder="e.g., -74.0060" value={manualLongitude} onChange={(e) => setManualLongitude(e.target.value)} step="any" min="-180" max="180" disabled={isGeneratingQr} className="text-sm"/>
                                </div>
                            </div>
                            {/* Manual Submit/Cancel Buttons */}
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                <Button onClick={handleManualLocationSubmit} disabled={isGeneratingQr || !manualLatitude || !manualLongitude} size="sm">
                                    {isGeneratingQr ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Use & Generate QR
                                </Button>
                                <Button variant="outline" onClick={() => {setShowManualLocationInput(false);}} disabled={isGeneratingQr} size="sm">
                                    Cancel Manual Entry
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* 3. If No QR Active and Not Showing Manual Input: Show Generation Options */}
                    {!qrCodeDetails && !showManualLocationInput && (
                        <div className="flex flex-wrap justify-center gap-2">
                             {/* Automatic Generation Button */}
                             <Button onClick={() => handleGenerateQr()} disabled={isGeneratingQr || isGettingLocation} className="">
                                 {(isGeneratingQr || isGettingLocation) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                 {isGettingLocation ? "Getting Location..." : isGeneratingQr ? "Generating..." : "Generate QR (Auto Location)"}
                             </Button>

                            {/* Use Stored Location Button (if available) */}
                            {storedManualLocation && (
                                <Button onClick={() => handleGenerateQr(storedManualLocation, 'stored')} disabled={isGeneratingQr || isGettingLocation} variant="secondary">
                                    {(isGeneratingQr || isGettingLocation) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                    Generate QR (Use Stored)
                                </Button>
                            )}

                             {/* Button to trigger manual input/edit */}
                             <Button onClick={handleEditStoredLocation} variant="outline" disabled={isGeneratingQr || isGettingLocation}>
                                <Edit className="mr-2 h-4 w-4" />
                                {storedManualLocation ? 'Edit Stored Location' : 'Enter Location Manually'}
                             </Button>
                        </div>
                    )}

                    {/* --- Helper Text & Stored Location Display/Clear --- */}
                    {isGettingLocation && <p className='text-sm text-muted-foreground flex items-center gap-1'><MapPin className='h-3 w-3'/> Requesting location...</p>}
                    {/* Display stored location info only when not actively editing/inputting */}
                    {storedManualLocation && !showManualLocationInput && (
                        <div className="text-xs text-muted-foreground mt-2 text-center border p-2 rounded-md bg-background w-full max-w-md">
                            Stored Location: Lat {storedManualLocation.latitude.toFixed(4)}, Lon {storedManualLocation.longitude.toFixed(4)}
                            <Button onClick={handleClearStoredLocation} variant="link" size="sm" className="ml-2 text-destructive h-auto p-0 align-middle" disabled={isGeneratingQr || isGettingLocation}>
                                <RotateCcw className="mr-1 h-3 w-3"/> Clear
                            </Button>
                        </div>
                    )}
                     <p className="text-xs text-muted-foreground mt-2 text-center">
                        QR requires location. Attendance radius is 500 meters.
                    </p>
                </CardContent>
            </Card>
       )}

      {/* --- Student Management Section --- */}
      <Card>
        <CardHeader>
          <CardTitle>Manage Students ({sectionData.students.length})</CardTitle>
          <CardDescription>Add or remove students from this section.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add Student Controls */}
          {canManage && (
            <div className="flex flex-col sm:flex-row items-center gap-2 mb-6">
              {/* Popover Trigger */}
              <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" aria-expanded={popoverOpen} className="flex-1 justify-between w-full sm:w-auto" disabled={isLoadingAvailableStudents || isAddingStudents}>
                     {isLoadingAvailableStudents ? "Loading..." : getSelectedStudentsDisplay()}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                {/* Popover Content */}
                <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[300px] overflow-y-auto p-0">
                  <Command>
                    <CommandInput placeholder="Search available students..." />
                    <CommandList>
                        <CommandEmpty>No students found or all added.</CommandEmpty>
                        <CommandGroup>
                        {availableStudents.map((student) => (
                            <CommandItem key={student._id} value={`${student.name} ${student.studentId}`} onSelect={() => {
                                setSelectedStudentIds(prev => {
                                    const newSet = new Set(prev);
                                    newSet.has(student._id) ? newSet.delete(student._id) : newSet.add(student._id);
                                    return newSet;
                                });
                            }}>
                            <Check className={cn("mr-2 h-4 w-4", selectedStudentIds.has(student._id) ? "opacity-100" : "opacity-0")} />
                            {student.name} ({student.studentId})
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {/* Add Button */}
              <Button onClick={handleAddStudents} disabled={selectedStudentIds.size === 0 || isAddingStudents || isLoadingAvailableStudents} className="w-full sm:w-auto">
                {isAddingStudents ? <Loader2 className="h-4 w-4 animate-spin" /> : `Add ${selectedStudentIds.size || ''} Selected`}
              </Button>
            </div>
          )}

          {/* Students Table */}
          {isLoadingSection && !sectionData ? (
             <div className="flex justify-center py-10"><Spinner size="lg" /></div>
           ) : sectionData.students && sectionData.students.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    {canManage && <TableHead className="w-[80px] text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sectionData.students.map((student) => (
                    <TableRow key={student._id}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.studentId}</TableCell>
                      <TableCell className="hidden md:table-cell">{student.email}</TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveStudent(student._id)} disabled={removingStudentId === student._id} aria-label={`Remove ${student.name}`}>
                            {removingStudentId === student._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 bg-muted/10 rounded-lg border border-dashed">
              <p className="text-muted-foreground">No students are currently enrolled in this section.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* --- QR Code Dialog (Modal) --- */}
      {qrCodeDetails && (
          <QrCodeDialog
              isOpen={isQrDialogOpen}
              onOpenChange={setIsQrDialogOpen}
              qrCodeDataUrl={qrCodeDetails.qrImage}
              expiresAt={qrCodeDetails.expiresAt}
              onCloseQr={handleCloseQr}
              isClosingQr={isClosingQr}
              onRegenerateQr={handleRegenerateQr}
              isRegeneratingQr={isRegeneratingQr}
          />
      )}
    </div>
  );
}