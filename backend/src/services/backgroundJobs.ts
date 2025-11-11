import { getCollection } from '../config/mongo';
import { notifyRadiusExpansion } from './notificationService';
import { ReportDocument } from '../types';

export class BackgroundJobService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly intervalMs = 60 * 60 * 1000; // hourly
  private running = false;

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

  private async runCycle() {
    if (this.running) {
      console.warn('[background-jobs] previous cycle still running, skipping tick');
      return;
    }

    this.running = true;

    try {
      const reportsCollection = getCollection<ReportDocument>('reports');
      const activeReports = await reportsCollection.find({ status: 'ACTIVE' }).toArray();

      if (!activeReports.length) {
        return;
      }

      const now = new Date();

      for (const report of activeReports) {
        const lastExpand = report.lastRadiusExpand ?? report.createdAt;
        const hoursSinceLastExpand =
          (now.getTime() - new Date(lastExpand).getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastExpand < 24) {
          continue;
        }

        const newRadius = report.currentRadius + 5;

        await reportsCollection.updateOne(
          { _id: report._id },
          {
            $set: {
              currentRadius: newRadius,
              lastRadiusExpand: now,
              updatedAt: now,
            },
          }
        );

        await notifyRadiusExpansion(report, newRadius);
        console.log(
          `[background-jobs] expanded radius for report ${report._id?.toString() ?? 'unknown'} to ${newRadius}km`
        );
      }
    } catch (error) {
      console.error('[background-jobs] cycle failed', error);
    } finally {
      this.running = false;
    }
  }
}

export const backgroundJobService = new BackgroundJobService();

