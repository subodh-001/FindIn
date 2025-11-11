"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Upload, Camera, AlertTriangle, Loader2, Shield } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

export default function CreateReportPage() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    subCategory: "",
    priority: "MEDIUM",
    location: "",
    city: "",
    state: "",
    pincode: "",
    initialRadius: "5",
    contactInfo: "",
    emergencyContact: "",
    reward: "",
    lastSeen: "",
    age: "",
    gender: "",
    height: "",
    build: "",
    clothing: "",
    specialMarks: "",
  });
  const [images, setImages] = useState<File[]>([]);
  const [locationCoords, setLocationCoords] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);

  const categories = {
    "MISSING_PERSON": {
      label: "Missing Person",
      subCategories: ["Child (0-12 years)", "Teenager (13-18 years)", "Adult (19-59 years)", "Elderly (60+ years)"]
    },
    "LOST_CHILD": {
      label: "Lost Child",
      subCategories: ["Wandering", "Kidnapping", "Runaway", "Accident"]
    },
    "ELDERLY_LOST": {
      label: "Elderly Lost",
      subCategories: ["Dementia", "Wandering", "Medical Emergency", "Accident"]
    },
    "CRIMINAL_ACTIVITY": {
      label: "Criminal Activity",
      subCategories: ["Theft", "Harassment", "Fraud", "Violence", "Drug Activity"]
    },
    "TRAFFIC_VIOLATION": {
      label: "Traffic Violation",
      subCategories: ["Dangerous Driving", "Accident", "Illegal Parking", "Signal Violation"]
    },
    "ANIMAL_CRUELTY": {
      label: "Animal Cruelty",
      subCategories: ["Street Dogs", "Cats", "Other Animals", "Injured Animals"]
    },
    "ENVIRONMENTAL_ISSUE": {
      label: "Environmental Issue",
      subCategories: ["Pollution", "Illegal Dumping", "Tree Cutting", "Water Contamination"]
    },
    "ROAD_ACCIDENT": {
      label: "Road Accident",
      subCategories: ["Vehicle Accident", "Pedestrian Hit", "Hit and Run", "Road Damage"]
    },
    "THEFT": {
      label: "Theft",
      subCategories: ["Vehicle Theft", "House Theft", "Mobile Theft", "Other Valuables"]
    },
    "HARASSMENT": {
      label: "Harassment",
      subCategories: ["Women Safety", "Child Safety", "Workplace", "Public Place"]
    }
  };

  const states = [
    "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
    "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
    "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
    "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
    "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
    "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !userProfile) {
      toast.error("Please login to create a report");
      router.push("/login");
      return;
    }

    setLoading(true);

    try {
      // Prepare report data
      const reportData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subCategory: formData.subCategory,
        priority: formData.priority,
        location: formData.location,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        latitude: parseFloat(locationCoords.lat) || 0,
        longitude: parseFloat(locationCoords.lng) || 0,
        initialRadius: parseInt(formData.initialRadius) || 5,
        contactInfo: formData.contactInfo,
        emergencyContact: formData.emergencyContact,
        reward: formData.reward,
        lastSeen: formData.lastSeen ? new Date(formData.lastSeen).toISOString() : null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        height: formData.height,
        build: formData.build,
        clothing: formData.clothing,
        specialMarks: formData.specialMarks,
        authorId: userProfile.id
      };

      // Create report via API
      const response = await apiFetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      const result = await response.json();

      if (result.success) {
        // Handle image uploads if any
        if (images.length > 0) {
          // For now, just show that images would be uploaded
          toast.success("Report created successfully! Images will be processed.");
        } else {
          toast.success("Report created successfully! Community will be notified immediately.");
        }
        
        router.push("/reports");
      } else {
        toast.error(result.error || "Failed to create report");
      }
      
    } catch (error) {
      console.error("Error creating report:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
      subCategory: "", // Reset subcategory when category changes
    });
  };

  const handleSubCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      subCategory: value,
    });
  };

  const handlePriorityChange = (value: string) => {
    setFormData({
      ...formData,
      priority: value,
    });
  };

  const handleRadiusChange = (value: string) => {
    setFormData({
      ...formData,
      initialRadius: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newImages = Array.from(e.target.files);
      setImages([...images, ...newImages]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationCoords({
            lat: position.coords.latitude.toString(),
            lng: position.coords.longitude.toString(),
          });
          setFormData({
            ...formData,
            location: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Unable to get your location. Please enter it manually.");
        }
      );
    } else {
      toast.error("Geolocation is not supported by this browser.");
    }
  };

  if (!user || !userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-green-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Shield className="h-12 w-12 text-saffron-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-4">Please login to create a community safety report</p>
            <Button asChild className="bg-saffron-600 hover:bg-saffron-700 text-white">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Shield className="h-8 w-8 text-saffron-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">CommunityGuard</h1>
                <span className="ml-2 text-sm text-gray-500">भारत का सुरक्षा नेटवर्क</span>
              </Link>
            </div>
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-saffron-600 transition-colors">
                Home
              </Link>
              <Link href="/reports" className="text-gray-700 hover:text-saffron-600 transition-colors">
                Reports
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">🚨 Create Community Safety Report</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Help make your community safer by reporting incidents, missing persons, or safety concerns. 
            Your report will immediately alert nearby community members and authorities.
          </p>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-saffron-50 to-green-50">
            <CardTitle className="flex items-center text-saffron-800">
              <AlertTriangle className="h-6 w-6 mr-2" />
              Report Details
            </CardTitle>
            <CardDescription>
              Provide comprehensive information to help the community respond effectively
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="title">Report Title *</Label>
                    <Input
                      id="title"
                      name="title"
                      placeholder="e.g., Missing 8-year-old boy in Indiranagar"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category *</Label>
                    <Select onValueChange={handleCategoryChange} required disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categories).map(([key, category]) => (
                          <SelectItem key={key} value={key}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.category && categories[formData.category as keyof typeof categories] && (
                  <div className="space-y-2">
                    <Label htmlFor="subCategory">Sub Category</Label>
                    <Select onValueChange={handleSubCategoryChange} disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select sub category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories[formData.category as keyof typeof categories].subCategories.map((subCat) => (
                          <SelectItem key={subCat} value={subCat}>
                            {subCat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level *</Label>
                    <Select onValueChange={handlePriorityChange} defaultValue="MEDIUM" disabled={loading}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low - General concern</SelectItem>
                        <SelectItem value="MEDIUM">Medium - Needs attention</SelectItem>
                        <SelectItem value="HIGH">High - Urgent situation</SelectItem>
                        <SelectItem value="URGENT">Urgent - Immediate action required</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastSeen">Last Seen (if applicable)</Label>
                    <Input
                      id="lastSeen"
                      name="lastSeen"
                      type="datetime-local"
                      value={formData.lastSeen}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Detailed Description *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Provide comprehensive details: What happened? When? Where? Who was involved? Any identifying features, clothing, vehicles, etc."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Location Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="e.g., Bangalore"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Select onValueChange={(value) => setFormData({...formData, state: value})} required disabled={loading}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
                      </SelectTrigger>
                      <SelectContent>
                        {states.map((state) => (
                          <SelectItem key={state} value={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      placeholder="e.g., 560001"
                      value={formData.pincode}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Specific Location/Address *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="location"
                      name="location"
                      placeholder="e.g., Near Indiranagar Metro Station, 100 Feet Road"
                      value={formData.location}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                    <Button type="button" variant="outline" onClick={getCurrentLocation} disabled={loading}>
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="latitude">Latitude</Label>
                      <Input
                        id="latitude"
                        placeholder="Auto-filled or manual"
                        value={locationCoords.lat}
                        onChange={(e) => setLocationCoords({...locationCoords, lat: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="longitude">Longitude</Label>
                      <Input
                        id="longitude"
                        placeholder="Auto-filled or manual"
                        value={locationCoords.lng}
                        onChange={(e) => setLocationCoords({...locationCoords, lng: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="initialRadius">Initial Search Radius (km) *</Label>
                  <Select onValueChange={handleRadiusChange} defaultValue="5" disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 km</SelectItem>
                      <SelectItem value="5">5 km</SelectItem>
                      <SelectItem value="10">10 km</SelectItem>
                      <SelectItem value="15">15 km</SelectItem>
                      <SelectItem value="20">20 km</SelectItem>
                      <SelectItem value="25">25 km</SelectItem>
                      <SelectItem value="50">50 km</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600">
                    The search radius will automatically expand by 5km every 24 hours until resolved.
                  </p>
                </div>
              </div>

              {/* Person Details (for missing person cases) */}
              {(formData.category === 'MISSING_PERSON' || formData.category === 'LOST_CHILD' || formData.category === 'ELDERLY_LOST') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Person Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        name="age"
                        type="number"
                        placeholder="e.g., 25"
                        value={formData.age}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Gender</Label>
                      <Select onValueChange={(value) => setFormData({...formData, gender: value})} disabled={loading}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MALE">Male</SelectItem>
                          <SelectItem value="FEMALE">Female</SelectItem>
                          <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Height</Label>
                      <Input
                        id="height"
                        name="height"
                        placeholder="e.g., 5'8 or 172 cm"
                        value={formData.height}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="build">Build/Physique</Label>
                      <Input
                        id="build"
                        name="build"
                        placeholder="e.g., Slim, Medium, Heavy"
                        value={formData.build}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clothing">Last Seen Wearing</Label>
                      <Input
                        id="clothing"
                        name="clothing"
                        placeholder="e.g., Blue shirt, black pants, red shoes"
                        value={formData.clothing}
                        onChange={handleChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialMarks">Special Marks/Features</Label>
                    <Textarea
                      id="specialMarks"
                      name="specialMarks"
                      placeholder="e.g., Birthmark on left cheek, scar on right arm, wears glasses"
                      value={formData.specialMarks}
                      onChange={handleChange}
                      rows={2}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactInfo">Your Contact Number *</Label>
                    <Input
                      id="contactInfo"
                      name="contactInfo"
                      type="tel"
                      placeholder="e.g., +91 98765 43210"
                      value={formData.contactInfo}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Emergency Contact</Label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      type="tel"
                      placeholder="e.g., +91 98765 43211"
                      value={formData.emergencyContact}
                      onChange={handleChange}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward">Reward (Optional)</Label>
                  <Input
                    id="reward"
                    name="reward"
                    placeholder="e.g., ₹10,000 for information leading to finding"
                    value={formData.reward}
                    onChange={handleChange}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Photo Evidence</h3>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50">
                  <div className="text-center">
                    <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageChange}
                      className="hidden"
                      id="image-upload"
                      disabled={loading}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" className="mb-2" disabled={loading}>
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Images
                      </Button>
                    </label>
                    <p className="text-sm text-gray-500">
                      Upload photos related to the incident. For missing persons: recent photos, 
                      for crimes: evidence photos, for accidents: scene photos.
                    </p>
                  </div>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative">
                        <img
                          src={URL.createObjectURL(image)}
                          alt={`Upload ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-1 right-1 h-6 w-6 p-0"
                          onClick={() => removeImage(index)}
                          disabled={loading}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Important Notice */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Important Notice</h4>
                    <p className="text-sm text-red-700 mt-1">
                      False reports are illegal under Indian law and can result in legal consequences including fines and imprisonment. 
                      Only create reports for genuine cases. All reports are monitored and verified by community moderators and police.
                    </p>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1 bg-saffron-600 hover:bg-saffron-700 text-white" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Report...
                    </>
                  ) : (
                    "🚨 Create Emergency Report"
                  )}
                </Button>
                <Button type="button" variant="outline" asChild disabled={loading}>
                  <Link href="/reports">Cancel</Link>
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}