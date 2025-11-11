'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, ArrowRight, MapPin, Shield, Users } from 'lucide-react';

type ReportSummary = {
  id: string;
  title: string;
  category: string;
  status: string;
  city?: string | null;
  state?: string | null;
  createdAt: string;
};

type ReportResponse = {
  success: boolean;
  reports: {
    id: string;
    title: string;
    category: string;
    status: string;
    city?: string | null;
    state?: string | null;
    createdAt: string;
  }[];
};

const steps = [
  {
    title: 'Share what happened',
    description:
      'Create a report with a photo, last seen location, and how to contact you or the investigating officer.',
  },
  {
    title: 'Alert the right people',
    description:
      'Verified responders in the active search radius receive instant notifications and can coordinate on the case.',
  },
  {
    title: 'Track updates together',
    description:
      'Sightings, comments, and status changes show up in real time so everyone stays aligned and informed.',
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadReports() {
      try {
        setLoading(true);
        const response = await apiFetch('/api/reports');
        if (!response.ok) {
          throw new Error('Unable to load reports right now.');
        }
        const data = (await response.json()) as ReportResponse;
        if (isMounted && data.success) {
          const normalized = data.reports
            .slice(0, 4)
            .map((report) => ({
              id: report.id,
              title: report.title,
              category: report.category,
              status: report.status,
              city: report.city ?? null,
              state: report.state ?? null,
              createdAt: report.createdAt,
            }));
          setReports(normalized);
        }
      } catch (err) {
        console.error('Failed to fetch reports', err);
        if (isMounted) {
          setError('We could not load active reports. Please try again shortly.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadReports();
    const interval = setInterval(loadReports, 60_000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const stats = useMemo(() => {
    if (!reports.length) {
      return {
        total: 0,
        active: 0,
        resolved: 0,
      };
    }

    const total = reports.length;
    const resolved = reports.filter((report) => report.status === 'RESOLVED').length;
    const active = total - resolved;

    return { total, active, resolved };
  }, [reports]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-blue-600 p-2 text-white shadow-md">
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-900">FindIn</p>
              <p className="text-xs text-blue-600">Missing people & community safety network</p>
            </div>
          </div>

          <nav className="flex items-center gap-5 text-sm font-medium text-slate-600">
            <Link href="/reports" className="hover:text-blue-600">
              Reports
            </Link>
            <Link href="/create-report" className="hover:text-blue-600">
              Share a report
            </Link>
            <Link href="/admin" className="hover:text-blue-600">
              Admin
            </Link>
            {user ? (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                Signed in
              </span>
            ) : (
              <Link href="/login" className="hover:text-blue-600">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-500 p-10 text-white shadow-xl">
          <div className="space-y-6 md:space-y-4">
            <Badge className="bg-white/20 text-white">Start here</Badge>
            <h1 className="text-3xl font-bold sm:text-4xl">
              Get eyes on the ground in minutes.
            </h1>
            <p className="max-w-2xl text-sm sm:text-base text-blue-50">
              File a verified report, notify responders in the affected neighbourhood, and follow every
              sighting as it happens. FindIn keeps families, citizens, NGOs, and officials on the same page.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-slate-100">
                <Link href={user ? '/reports' : '/register'}>
                  {user ? 'See live reports' : 'Create free account'}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-white text-white hover:bg-white/10"
              >
                <Link href="/create-report">Report an incident</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <Card key={step.title} className="border-slate-200">
              <CardHeader className="space-y-3">
                <CardTitle className="text-lg text-slate-900">{step.title}</CardTitle>
                <CardDescription className="text-sm text-slate-600">
                  {step.description}
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Live report snapshot</h2>
              <p className="text-sm text-slate-500">
                Numbers refresh every minute to show what the community is working on right now.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-blue-50 text-blue-700">
                Total loaded: {stats.total}
              </Badge>
              <Badge className="bg-emerald-50 text-emerald-700">
                Active: {stats.active}
              </Badge>
              <Badge className="bg-slate-100 text-slate-700">
                Resolved: {stats.resolved}
              </Badge>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {loading && (
              <Card className="border-dashed border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base text-slate-500">Loading reports…</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="h-2 rounded bg-slate-200 animate-pulse" />
                  <div className="h-2 rounded bg-slate-200 animate-pulse" />
                  <div className="h-2 rounded bg-slate-200 animate-pulse" />
                </CardContent>
              </Card>
            )}

            {error && !loading && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base text-red-700">
                    <AlertTriangle className="h-4 w-4" />
                    Something went wrong
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-red-600">{error}</CardDescription>
                </CardContent>
              </Card>
            )}

            {!loading && !error && reports.length === 0 && (
              <Card className="md:col-span-2 border-slate-200">
                <CardHeader>
                  <CardTitle className="text-base text-slate-700">
                    No active reports yet
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-500">
                    Be the first to create a verified report and mobilise your local responders.
                  </CardDescription>
                </CardContent>
              </Card>
            )}

            {!loading &&
              !error &&
              reports.map((report) => (
                <Card key={report.id} className="border-slate-200">
                  <CardHeader className="space-y-2">
                    <Badge variant="outline" className="w-fit border-blue-200 text-blue-700">
                      {report.category}
                    </Badge>
                    <CardTitle className="text-lg text-slate-900">{report.title}</CardTitle>
                    <CardDescription className="text-xs text-slate-500">
                      {new Date(report.createdAt).toLocaleString()} •{' '}
                      {report.city || report.state ? (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {[report.city, report.state].filter(Boolean).join(', ')}
                        </span>
                      ) : (
                        'Location pending'
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <Badge
                      className={
                        report.status === 'RESOLVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }
                    >
                      {report.status === 'RESOLVED' ? 'Resolved' : 'Active'}
                    </Badge>
                    <Button asChild variant="ghost" size="sm" className="text-blue-600">
                      <Link href={`/reports/${report.id}`}>
                        View details
                        <ArrowRight className="ml-1 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Built with responders, families, and NGOs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                Every account is verified by admins to keep trolls out. Responders can be invited directly
                with ID proof, while citizens get guided templates that make it easy to submit complete,
                actionable reports.
              </p>
              <p>
                Admin tools include a moderation queue, audit logs for sensitive actions, and escalation to
                partner agencies when cases need urgent intervention.
              </p>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-slate-900">
                Ready for local language pilots
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                The interface uses a clean, responsive layout that works well on low-end Android phones and
                desktop command centres alike. Upcoming pilots will add regional language packs, offline
                data capture, and WhatsApp sharing for quick community reach.
              </p>
              <p>
                Want to help roll this out in your area? Reach out to the FindIn team for a guided pilot
                toolkit and training resources.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <p>© {new Date().getFullYear()} FindIn.</p>
            <p className="text-xs text-slate-400">
              Community-safety platform built in India for the world.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3 text-blue-600" />
              Verified responders
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3 text-emerald-600" />
              Radius tracking
            </span>
            <span className="inline-flex items-center gap-1">
              <Shield className="h-3 w-3 text-purple-600" />
              Privacy-first
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

