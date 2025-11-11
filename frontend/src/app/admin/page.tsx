"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Shield, Users, FileText, Check, X, Search, Eye, RefreshCcw, Plus } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type VerificationQueueItem = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  city?: string | null;
  state?: string | null;
  userType: string;
  documentId: string | null;
  notes: string | null;
  submittedAt: string;
};

type ReportRow = {
  id: string;
  title: string;
  category: string;
  status: string;
  author?: {
    firstName?: string;
    lastName?: string;
    userType?: string;
  };
  _count?: {
    comments: number;
  };
  createdAt: string;
  currentRadius?: number;
  radiusHistory?: Array<{
    radius: number;
    expandedAt: string;
  }>;
};

const reportStatusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800",
  RESOLVED: "bg-gray-100 text-gray-800",
  EXPIRED: "bg-yellow-100 text-yellow-800"
};

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"users" | "reports">("users");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [queue, setQueue] = useState<VerificationQueueItem[]>([]);
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("POLICE");
  const { sessionToken } = useAuth();

  useEffect(() => {
    if (!sessionToken) {
      return;
    }

    refreshQueue();
    refreshReports();
  }, [sessionToken]);

  const refreshQueue = async () => {
    if (!sessionToken) return;
    setLoadingQueue(true);
    try {
      const response = await apiFetch("/api/verification/queue", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to load queue");
      }

      const data = await response.json();
      if (data.success) {
        setQueue(data.queue);
      }
    } catch (error) {
      console.error("[admin] queue fetch failed", error);
      toast.error("Could not load verification queue");
    } finally {
      setLoadingQueue(false);
    }
  };

  const refreshReports = async () => {
    setLoadingReports(true);
    try {
      const response = await apiFetch("/api/reports");
      if (!response.ok) {
        throw new Error("Failed to fetch reports");
      }
      const data = await response.json();
      if (data.success) {
        setReports(data.reports ?? []);
      }
    } catch (error) {
      console.error("[admin] reports fetch failed", error);
      toast.error("Unable to load reports right now");
    } finally {
      setLoadingReports(false);
    }
  };

  const handleDecision = async (userId: string, status: "APPROVED" | "REJECTED") => {
    if (!sessionToken) return;

    try {
      const response = await apiFetch(`/api/verification/${userId}/decision`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          status,
          notes: status === "APPROVED" ? "Approved by admin" : "Verification rejected by admin",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit decision");
      }

      toast.success(`User ${status.toLowerCase()} successfully`);
      refreshQueue();
    } catch (error) {
      console.error("[admin] decision failed", error);
      toast.error("Failed to submit decision");
    }
  };

  const handleInviteCreate = async () => {
    if (!sessionToken) return;
    setCreatingInvite(true);
    try {
      const response = await apiFetch("/api/invites", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to create invite");
      }

      toast.success(`Invite created. Token: ${result.token}`);
      setInviteEmail("");
    } catch (error) {
      console.error("[admin] invite creation failed", error);
      toast.error("Could not create invite");
    } finally {
      setCreatingInvite(false);
    }
  };

  const handleViewDocument = async (documentId: string | null) => {
    if (!documentId || !sessionToken) {
      toast.info("No document uploaded");
      return;
    }

    try {
      const response = await apiFetch(`/api/verification/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch document");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch (error) {
      console.error("[admin] document preview failed", error);
      toast.error("Could not open document");
    }
  };

  const filteredQueue = useMemo(() => {
    return queue.filter((item) => {
      const matchesSearch =
        item.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || filterStatus === "PENDING";
      return matchesSearch && matchesStatus;
    });
  }, [queue, searchTerm, filterStatus]);

  const filteredReports = useMemo(() => {
    return reports.filter((report) => {
      const matchesSearch =
        report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (report.author?.firstName ?? "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || report.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [reports, searchTerm, filterStatus]);

  const totalVerified = useMemo(
    () => reports.filter((report) => report.status === "RESOLVED").length,
    [reports]
  );

  const activeReports = useMemo(
    () => reports.filter((report) => report.status === "ACTIVE").length,
    [reports]
  );

  const pendingVerifications = queue.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <Shield className="h-8 w-8 text-blue-600 mr-3" />
                <h1 className="text-2xl font-bold text-gray-900">TraceMe</h1>
              </Link>
              <span className="ml-4 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Admin Panel
              </span>
            </div>
            <nav className="flex space-x-8">
              <Link href="/" className="text-gray-700 hover:text-blue-600 transition-colors">
                Back to Site
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingVerifications}</div>
              <p className="text-xs text-muted-foreground">
                Respond quickly to keep the network trusted
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Reports</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {activeReports}
              </div>
              <p className="text-xs text-muted-foreground">Currently being tracked</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Users</CardTitle>
              <Check className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.max(0, reports.length - pendingVerifications)}
              </div>
              <p className="text-xs text-muted-foreground">
                Includes responders approved via invites
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved Cases</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalVerified}
              </div>
              <p className="text-xs text-muted-foreground">
                Resolved reports logged in the system
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab("users")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "users"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                User Management
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "reports"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Report Management
              </button>
            </nav>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={`Search ${activeTab === "users" ? "users" : "reports"}...`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {activeTab === "users" ? (
                    <>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="RESOLVED">Resolved</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        {activeTab === "users" ? (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and verification status
              </CardDescription>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mt-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshQueue}
                    disabled={loadingQueue}
                    className="flex items-center gap-2"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh queue
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    {loadingQueue ? "Updating…" : `Last loaded ${new Date().toLocaleTimeString()}`}
                  </span>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
                  <Input
                    placeholder="Responder email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger className="md:w-40">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POLICE">Police</SelectItem>
                      <SelectItem value="GOVERNMENT">Government</SelectItem>
                      <SelectItem value="NGO">NGO</SelectItem>
                      <SelectItem value="MEDICAL">Medical</SelectItem>
                      <SelectItem value="SECURITY">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleInviteCreate}
                    disabled={!inviteEmail || creatingInvite}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Send invite
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQueue.length === 0 && !loadingQueue ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                        No pending verifications. Invited responders appear here after onboarding.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredQueue.map((queueItem) => (
                      <TableRow key={queueItem.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {queueItem.firstName.charAt(0)}
                                {queueItem.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">
                                {queueItem.firstName} {queueItem.lastName}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {queueItem.city ?? "Unknown city"}, {queueItem.state ?? "India"}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{queueItem.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{queueItem.userType}</Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(queueItem.submittedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 px-3"
                              onClick={() => handleViewDocument(queueItem.documentId)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Document
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDecision(queueItem.id, "APPROVED")}
                              disabled={loadingQueue}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => handleDecision(queueItem.id, "REJECTED")}
                              disabled={loadingQueue}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Report Management</CardTitle>
              <CardDescription>
                Manage reports and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Comments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReports.length === 0 && !loadingReports ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                        No reports loaded. Encourage responders to file verified cases.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredReports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell>
                          <div className="font-medium">{report.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {(() => {
                              const latestRadius =
                                report.radiusHistory && report.radiusHistory.length > 0
                                  ? report.radiusHistory[report.radiusHistory.length - 1]?.radius
                                  : report.currentRadius;
                              return `${latestRadius ?? 0} km radius`;
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{report.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={reportStatusColors[report.status] ?? "bg-slate-100 text-slate-700"}>
                            {report.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {report.author
                            ? `${report.author.firstName ?? ""} ${report.author.lastName ?? ""}`.trim() ||
                              report.author.userType
                            : "Unknown"}
                        </TableCell>
                        <TableCell>{report._count?.comments ?? 0}</TableCell>
                        <TableCell>{new Date(report.createdAt).toLocaleString()}</TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0"
                              onClick={() => window.open(`/reports/${report.id}`, "_blank")}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}