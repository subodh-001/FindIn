"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeUser = serializeUser;
exports.serializeReport = serializeReport;
exports.serializeComment = serializeComment;
function serializeUser(user) {
    if (!user)
        return null;
    const { password, ...rest } = user;
    return {
        ...rest,
        _id: user._id,
        createdAt: user.createdAt instanceof Date ? user.createdAt.toISOString() : user.createdAt,
        updatedAt: user.updatedAt instanceof Date ? user.updatedAt.toISOString() : user.updatedAt,
    };
}
function serializeReport(report, extras) {
    return {
        ...report,
        _id: report._id?.toString(),
        id: report._id?.toString(),
        createdAt: report.createdAt instanceof Date ? report.createdAt.toISOString() : report.createdAt,
        updatedAt: report.updatedAt instanceof Date ? report.updatedAt.toISOString() : report.updatedAt,
        resolvedAt: report.resolvedAt instanceof Date ? report.resolvedAt.toISOString() : report.resolvedAt ?? null,
        lastRadiusExpand: report.lastRadiusExpand instanceof Date
            ? report.lastRadiusExpand.toISOString()
            : report.lastRadiusExpand ?? null,
        ...extras,
    };
}
function serializeComment(comment, author) {
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
//# sourceMappingURL=serializers.js.map