export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UserRole =
  | 'CITIZEN'
  | 'POLICE'
  | 'GOVERNMENT'
  | 'SECURITY'
  | 'NGO'
  | 'MEDICAL'
  | 'TEACHER'
  | 'LOCAL_LEADER';

export type ReportStatus = 'ACTIVE' | 'RESOLVED' | 'EXPIRED';

import { ObjectId } from 'mongodb';

export interface UserDocument {
  _id?: ObjectId;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  userType: UserRole;
  isVerified: boolean;
  verificationStatus: VerificationStatus;
  verificationNotes?: string | null;
  idDocumentId?: ObjectId | null;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string | null;
  preferredChannels?: {
    sms: boolean;
    email: boolean;
    push: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface ReportDocument {
  _id?: ObjectId;
  title: string;
  description: string;
  category: string;
  subCategory?: string | null;
  priority?: string | null;
  status: ReportStatus;
  location: string;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  latitude: number;
  longitude: number;
  initialRadius: number;
  currentRadius: number;
  contactInfo: string;
  emergencyContact?: string | null;
  reward?: string | null;
  lastSeen?: Date | null;
  age?: number | null;
  gender?: string | null;
  height?: string | null;
  build?: string | null;
  clothing?: string | null;
  specialMarks?: string | null;
  authorId: string;
  authorName: string;
  authorType: string;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  lastRadiusExpand?: Date | null;
  radiusHistory?: Array<{
    radius: number;
    expandedAt: Date;
    expandedBy: 'SYSTEM' | 'ADMIN';
    reason?: string | null;
  }>;
}

export interface CommentDocument {
  _id?: ObjectId;
  reportId: string;
  authorId: string;
  content: string;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  imagePath?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationDocument {
  _id?: ObjectId;
  type: 'REPORT_CREATED' | 'RADIUS_EXPANDED' | 'NEW_COMMENT' | 'REPORT_RESOLVED' | 'VERIFICATION_STATUS';
  title: string;
  message: string;
  userId?: string | null;
  reportId?: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLogDocument {
  _id?: ObjectId;
  actorId: string;
  action: string;
  entityType: 'USER' | 'REPORT' | 'COMMENT' | 'SYSTEM';
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface InviteDocument {
  _id?: ObjectId;
  email: string;
  role: UserRole;
  createdBy: string;
  expiresAt: Date;
  redeemedAt?: Date | null;
  token: string;
  message?: string | null;
}

export interface AbuseReportDocument {
  _id?: ObjectId;
  reportId: string;
  reporterId: string;
  reason: string;
  details?: string | null;
  status: 'OPEN' | 'REVIEWED' | 'DISMISSED';
  createdAt: Date;
  reviewedAt?: Date | null;
  reviewedBy?: string | null;
  resolutionNotes?: string | null;
}

