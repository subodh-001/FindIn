"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
  MessageSquare,
  Share2,
  User,
} from "lucide-react";

interface Comment {
  _id: string;
  content: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  createdAt: string;
  author?: {
    id?: string;
    firstName?: string;
    lastName?: string;
  };
}

interface ReportDetail {
  _id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  location: string;
  city?: string | null;
  state?: string | null;
  contactInfo: string;
  emergencyContact?: string | null;
  initialRadius: number;
  currentRadius: number;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  latitude?: number;
  longitude?: number;
  author: {
    id?: string;
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
  comments: Comment[];
  images: string[];
}

const statusVariants: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  RESOLVED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-yellow-100 text-yellow-800",
};

const categoryVariants: Record<string, string> = {
  MISSING_PERSON: "bg-red-100 text-red-800",
  LOST_CHILD: "bg-orange-100 text-orange-800",
  ELDERLY_LOST: "bg-orange-100 text-orange-800",
  CRIMINAL_ACTIVITY: "bg-purple-100 text-purple-800",
  TRAFFIC_VIOLATION: "bg-blue-100 text-blue-800",
  ANIMAL_CRUELTY: "bg-emerald-100 text-emerald-800",
  ENVIRONMENTAL_ISSUE: "bg-lime-100 text-lime-800",
  ROAD_ACCIDENT: "bg-rose-100 text-rose-800",
  THEFT: "bg-amber-100 text-amber-800",
  HARASSMENT: "bg-pink-100 text-pink-800",
};

export default function ReportDetailPage({ params }: { params: { id: string } }) {
  const { userProfile } = useAuth();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentLocation, setCommentLocation] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiFetch(`/api/reports/${params.id}`);
        if (!response.ok) {
          throw new Error("Failed to load report");
        }
        const data = await response.json();
        setReport(data.report);
      } catch (err) {
        console.error("Error fetching report", err);
        setError("Unable to load report details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [params.id]);

  const daysActive = useMemo(() => {
    if (!report?.createdAt) return 0;
    const created = new Date(report.createdAt).getTime();
    const now = report.resolvedAt ? new Date(report.resolvedAt).getTime() : Date.now();
    return Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
  }, [report]);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCommentLocation(
          `Lat: ${position.coords.latitude.toFixed(5)}, Lng: ${position.coords.longitude.toFixed(5)}`
        );
      },
      (geoError) => {
        console.error(geoError);
        setError("Unable to get your location. Please enter it manually.");
      }
    );
  };

  const handleSubmitComment = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!report) return;

    if (!userProfile?.id) {
      setError("Please log in with a verified account to post sightings.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await apiFetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          location: commentLocation,
          authorId: userProfile.id,
          reportId: report._id,
        }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.error || "Failed to post comment");
      }

      const payload = await response.json();
      setReport({
        ...report,
        comments: [
          {
            _id: payload.comment._id,
            content: payload.comment.content,
            location: payload.comment.location,
            createdAt: payload.comment.createdAt ?? new Date().toISOString(),
            author: payload.comment.author,
          },
          ...report.comments,
        ],
      });

      setNewComment("");
      setCommentLocation("");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Unable to submit comment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading report details…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Something went wrong</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/reports">Back to reports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  const categoryBadge = categoryVariants[report.category] ?? "bg-slate-100 text-slate-700";
  const statusBadge = statusVariants[report.status] ?? "bg-slate-100 text-slate-700";
  const authorName = `${report.author?.firstName ?? ""} ${report.author?.lastName ?? ""}`.trim() || "Unknown";

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Link href="/" className="text-xl font-bold text-blue-600">
                TraceMe
              </Link>
              <Badge variant="secondary">Community Safety Network</Badge>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="text-gray-600 hover:text-blue-600 transition-colors">
                Home
              </Link>
              <Link href="/reports" className="text-gray-600 hover:text-blue-600 transition-colors">
                Reports
              </Link>
              <Link href="/create-report" className="text-gray-600 hover:text-blue-600 transition-colors">
                Create Report
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button variant="outline" asChild>
            <Link href="/reports">← Back to Reports</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-3xl font-semibold text-gray-900">{report.title}</CardTitle>
                    <CardDescription className="mt-2 text-base text-gray-600">{report.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={categoryBadge}>{report.category.replace(/_/g, " ")}</Badge>
                    <Badge className={statusBadge}>{report.status}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={<MapPin className="h-4 w-4" />} label="Location">
                    {report.location}
                    {report.city && report.state ? `, ${report.city}, ${report.state}` : ""}
                  </InfoRow>
                  <InfoRow icon={<Calendar className="h-4 w-4" />} label="Reported On">
                    {new Date(report.createdAt).toLocaleString()}
                  </InfoRow>
                  <InfoRow icon={<User className="h-4 w-4" />} label="Reported By">
                    {authorName || "Unknown"} {report.author?.userType ? `(${report.author.userType})` : ""}
                  </InfoRow>
                  <InfoRow icon={<Clock className="h-4 w-4" />} label="Days Active">
                    {daysActive} day{daysActive > 1 ? "s" : ""}
                  </InfoRow>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Contact Information</h4>
                    <p className="text-sm text-blue-800">Primary: {report.contactInfo}</p>
                    {report.emergencyContact && (
                      <p className="text-sm text-blue-800 mt-1">Emergency: {report.emergencyContact}</p>
                    )}
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <h4 className="font-semibold text-emerald-900 mb-2">Search Radius</h4>
                    <p className="text-sm text-emerald-800">
                      Current radius: <strong>{report.currentRadius} km</strong>
                    </p>
                    <p className="text-xs text-emerald-700 mt-1">
                      Initial radius: {report.initialRadius} km (expands by 5 km every 24 hours)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5" />
                  Community Sightings ({report.comments.length})
                </CardTitle>
                <CardDescription>Your sightings help authorities respond faster.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitComment} className="space-y-4 bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <div className="space-y-2">
                    <Label htmlFor="comment">What did you see?</Label>
                    <Textarea
                      id="comment"
                      rows={3}
                      placeholder="Share details about the sighting, time, and any helpful information."
                      value={newComment}
                      onChange={(event) => setNewComment(event.target.value)}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="comment-location">Location</Label>
                    <div className="flex gap-2">
                      <Input
                        id="comment-location"
                        placeholder="e.g., Near MG Road Metro Station"
                        value={commentLocation}
                        onChange={(event) => setCommentLocation(event.target.value)}
                        required
                        disabled={submitting}
                      />
                      <Button type="button" variant="outline" onClick={handleUseCurrentLocation} disabled={submitting}>
                        <MapPin className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? "Posting…" : "Post Sighting"}
                  </Button>
                </form>

                <div className="space-y-4">
                  {report.comments.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">
                      No sightings yet. Be the first to report new information.
                    </p>
                  )}

                  {report.comments.map((comment) => (
                    <div key={comment._id} className="border border-gray-200 rounded-lg p-4 bg-white">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {comment.author?.firstName?.[0]?.toUpperCase() ??
                                comment.author?.lastName?.[0]?.toUpperCase() ??
                                "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">
                              {comment.author
                                ? `${comment.author.firstName ?? ""} ${comment.author.lastName ?? ""}`.trim() ||
                                  "Community Member"
                                : "Community Member"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(comment.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {comment.location && (
                          <Badge variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {comment.location}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Share This Alert</CardTitle>
                <CardDescription>Spread the word to help the community respond faster.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                  <Share2 className="h-4 w-4" />
                  Copy Shareable Link
                </Button>
                <p className="text-xs text-gray-500 mt-3">
                  Sharing this report with trusted groups and local authorities increases the chance of quick response.
                </p>
              </CardContent>
            </Card>

            <Card className="border-amber-200 bg-amber-50">
              <CardHeader>
                <CardTitle className="text-lg text-amber-800 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Safety Reminder
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-amber-900">
                  If you see the individual described in this report, do not confront alone. Contact the authorities or the emergency contact listed above immediately.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
      <div className="text-gray-500">{icon}</div>
      <div>
        <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
        <p className="font-medium text-gray-900">{children}</p>
      </div>
    </div>
  );
}