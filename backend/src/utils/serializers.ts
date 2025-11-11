import { ReportDocument, UserDocument, CommentDocument } from '../types';

export function serializeUser(user: UserDocument | null | undefined) {
  if (!user) return null;

  const { password, twoFactorSecret, ...rest } = user;

  return {
    ...rest,
    _id: user._id,
    idDocumentId: user.idDocumentId ? user.idDocumentId.toString() : null,
    twoFactorEnabled: Boolean(user.twoFactorEnabled),
    createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
    updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
  };
}

export function serializeReport(
  report: ReportDocument,
  extras?: Partial<Record<'_count', any | null>>
) {
  return {
    ...report,
    _id: report._id?.toString(),
    id: report._id?.toString(),
    createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
    updatedAt: report.updatedAt instanceof Date ? report.updatedAt.toISOString() : report.updatedAt,
    resolvedAt:
      report.resolvedAt instanceof Date ? report.resolvedAt.toISOString() : report.resolvedAt ?? null,
    lastRadiusExpand:
      report.lastRadiusExpand instanceof Date
        ? report.lastRadiusExpand.toISOString()
        : report.lastRadiusExpand ?? null,
    ...extras,
  };
}

export function serializeComment(
  comment: CommentDocument,
  author?: Pick<UserDocument, '_id' | 'firstName' | 'lastName'> | null
) {
  return {
    ...comment,
    _id: comment._id?.toString(),
    id: comment._id?.toString(),
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
    updatedAt: comment.updatedAt instanceof Date ? comment.updatedAt.toISOString() : comment.updatedAt,
    author: author
      ? {
          id: author._id,
          firstName: author.firstName,
          lastName: author.lastName,
        }
      : undefined,
  };
}

