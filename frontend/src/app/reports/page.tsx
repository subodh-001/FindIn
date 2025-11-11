"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  User, 
  AlertTriangle, 
  Eye,
  Phone,
  Calendar,
  Map,
  Shield
} from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";

interface Report {
  id: string;
  title: string;
  description: string;
  category: string;
  subCategory?: string;
  priority: string;
  status: string;
  location: string;
  city?: string;
  state?: string;
  pincode?: string;
  latitude: number;
  longitude: number;
  initialRadius: number;
  contactInfo: string;
  emergencyContact?: string;
  reward?: string;
  lastSeen?: string;
  age?: number;
  gender?: string;
  height?: string;
  build?: string;
  clothing?: string;
  specialMarks?: string;
  createdAt: string;
  author: {
    firstName: string;
    lastName: string;
    userType: string;
    city?: string;
    state?: string;
  };
  _count: {
    comments: number;
    images: number;
  };
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [reports, searchTerm, categoryFilter, priorityFilter]);

  const fetchReports = async () => {
    try {
      const response = await apiFetch('/api/reports');
      const data = await response.json();
      
      if (data.success) {
        setReports(data.reports);
      } else {
        console.error('Failed to fetch reports:', data.error);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = reports;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(report =>
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.state?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(report => report.category === categoryFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter(report => report.priority === priorityFilter);
    }

    setFilteredReports(filtered);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'MISSING_PERSON':
      case 'LOST_CHILD':
      case 'ELDERLY_LOST':
        return <User className="h-4 w-4" />;
      case 'CRIMINAL_ACTIVITY':
      case 'THEFT':
      case 'HARASSMENT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'TRAFFIC_VIOLATION':
      case 'ROAD_ACCIDENT':
        return <Map className="h-4 w-4" />;
      case 'ANIMAL_CRUELTY':
      case 'ENVIRONMENTAL_ISSUE':
        return <Shield className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-saffron-50 to-green-50 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-saffron-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading community reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-100 to-green-100 rounded-full mb-6">
            <AlertTriangle className="h-6 w-6 text-blue-600 mr-3" />
            <span className="text-lg font-bold text-blue-800">🔍 COMMUNITY SAFETY REPORTS</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-4">
            Community Safety Reports
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Stay informed about safety issues in your community. Real-time updates from verified community members across India.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-green-50">
            <CardTitle className="flex items-center gap-3 text-xl">
              <div className="bg-gradient-to-r from-blue-600 to-green-600 p-2 rounded-lg">
                <Filter className="h-5 w-5 text-white" />
              </div>
              Search & Filter Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search reports, locations, people..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300"
                />
              </div>

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="MISSING_PERSON">Missing Person</SelectItem>
                  <SelectItem value="LOST_CHILD">Lost Child</SelectItem>
                  <SelectItem value="ELDERLY_LOST">Elderly Lost</SelectItem>
                  <SelectItem value="CRIMINAL_ACTIVITY">Criminal Activity</SelectItem>
                  <SelectItem value="TRAFFIC_VIOLATION">Traffic Violation</SelectItem>
                  <SelectItem value="ANIMAL_CRUELTY">Animal Cruelty</SelectItem>
                  <SelectItem value="ENVIRONMENTAL_ISSUE">Environmental Issue</SelectItem>
                  <SelectItem value="ROAD_ACCIDENT">Road Accident</SelectItem>
                  <SelectItem value="THEFT">Theft</SelectItem>
                  <SelectItem value="HARASSMENT">Harassment</SelectItem>
                </SelectContent>
              </Select>

              {/* Priority Filter */}
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-12 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-xl transition-all duration-300">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              {/* Create Report Button */}
              <Button asChild className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                <Link href="/create-report">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Report Emergency
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Count */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-100 to-green-100 rounded-xl p-4 border border-blue-200">
            <p className="text-lg font-semibold text-gray-800 text-center">
              📊 Showing <span className="text-blue-600 font-bold">{filteredReports.length}</span> of <span className="text-green-600 font-bold">{reports.length}</span> reports
            </p>
          </div>
        </div>

        {/* Reports Grid */}
        {filteredReports.length === 0 ? (
          <Card className="text-center py-16 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="bg-gradient-to-r from-gray-100 to-blue-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No reports found</h3>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                {searchTerm || categoryFilter !== "all" || priorityFilter !== "all"
                  ? "Try adjusting your search or filters to find what you're looking for."
                  : "Be the first to create a community safety report and help make your neighborhood safer!"
                }
              </p>
              {!searchTerm && categoryFilter === "all" && priorityFilter === "all" && (
                <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl">
                  <Link href="/create-report">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Create First Report
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredReports.map((report) => (
              <Card key={report.id} className="group hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border-2 border-transparent hover:border-blue-200 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="bg-gradient-to-r from-blue-100 to-green-100 p-3 rounded-xl">
                        {getCategoryIcon(report.category)}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                          {report.title}
                        </CardTitle>
                        <CardDescription className="text-sm text-gray-600 mt-1">
                          {report.category.replace('_', ' ')} • {report.subCategory || 'General'}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={`ml-4 px-3 py-1 text-sm font-bold ${getPriorityColor(report.priority)}`}>
                      {report.priority}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-5 pt-0">
                  {/* Description */}
                  <p className="text-gray-700 line-clamp-3 leading-relaxed">
                    {report.description}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="font-medium">{report.location}</span>
                    {report.city && report.state && (
                      <span className="text-gray-500">• {report.city}, {report.state}</span>
                    )}
                  </div>

                  {/* Person Details (if applicable) */}
                  {(report.age || report.gender || report.height) && (
                    <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-bold text-sm mb-3 text-blue-800 flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Person Details:
                      </h4>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {report.age && <div className="bg-white px-3 py-2 rounded-lg"><span className="font-medium">Age:</span> {report.age} years</div>}
                        {report.gender && <div className="bg-white px-3 py-2 rounded-lg"><span className="font-medium">Gender:</span> {report.gender}</div>}
                        {report.height && <div className="bg-white px-3 py-2 rounded-lg"><span className="font-medium">Height:</span> {report.height}</div>}
                        {report.build && <div className="bg-white px-3 py-2 rounded-lg"><span className="font-medium">Build:</span> {report.build}</div>}
                      </div>
                    </div>
                  )}

                  {/* Contact & Reward */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                      <Phone className="h-4 w-4 text-green-500" />
                      <span className="font-medium">{report.contactInfo}</span>
                    </div>
                    {report.reward && (
                      <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1 text-sm font-bold">
                        ₹{report.reward} Reward
                      </Badge>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm border-t pt-4">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <span className="font-medium text-gray-900">{report.author.firstName} {report.author.lastName}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {report.author.userType}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">{formatDate(report.createdAt)}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-500 bg-gray-50 px-4 py-3 rounded-lg">
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      {report._count.comments} comments
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {report._count.images} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      {report.initialRadius}km radius
                    </span>
                  </div>

                  {/* View Details Button */}
                  <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white h-12 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
                    <Link href={`/reports/${report.id}`}>
                      <Eye className="h-5 w-5 mr-2" />
                      View Full Details
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}