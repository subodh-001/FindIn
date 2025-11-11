"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backgroundJobService = exports.BackgroundJobService = void 0;
const mongo_1 = require("../config/mongo");
const notificationService_1 = require("./notificationService");
class BackgroundJobService {
    constructor() {
        this.intervalId = null;
        this.intervalMs = 60 * 60 * 1000; // hourly
        this.running = false;
    }
    start() {
        if (this.intervalId) {
            return;
        }
        this.runCycle().catch((error) => {
            console.error('[background-jobs] initial run failed', error);
        });
        this.intervalId = setInterval(() => {
            void this.runCycle();
        }, this.intervalMs);
        console.log('[background-jobs] service started');
    }
    stop() {
        if (!this.intervalId) {
            return;
        }
        clearInterval(this.intervalId);
        this.intervalId = null;
        console.log('[background-jobs] service stopped');
    }
    async runCycle() {
        if (this.running) {
            console.warn('[background-jobs] previous cycle still running, skipping tick');
            return;
        }
        this.running = true;
        try {
            const reportsCollection = (0, mongo_1.getCollection)('reports');
            const activeReports = await reportsCollection.find({ status: 'ACTIVE' }).toArray();
            if (!activeReports.length) {
                return;
            }
            const now = new Date();
            for (const report of activeReports) {
                const lastExpand = report.lastRadiusExpand ?? report.createdAt;
                const hoursSinceLastExpand = (now.getTime() - new Date(lastExpand).getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastExpand < 24) {
                    continue;
                }
                const newRadius = report.currentRadius + 5;
                await reportsCollection.updateOne({ _id: report._id }, {
                    $set: {
                        currentRadius: newRadius,
                        lastRadiusExpand: now,
                        updatedAt: now,
                    },
                });
                await (0, notificationService_1.notifyRadiusExpansion)(report, newRadius);
                console.log(`[background-jobs] expanded radius for report ${report._id?.toString() ?? 'unknown'} to ${newRadius}km`);
            }
        }
        catch (error) {
            console.error('[background-jobs] cycle failed', error);
        }
        finally {
            this.running = false;
        }
    }
}
exports.BackgroundJobService = BackgroundJobService;
exports.backgroundJobService = new BackgroundJobService();
//# sourceMappingURL=backgroundJobs.js.map