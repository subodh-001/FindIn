'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, MapPin, Search, Shield, Smartphone, Users } from 'lucide-react';

const heroStats = [
  { label: 'Verified Responders', value: '8.2k+' },
  { label: 'Recoveries Accelerated', value: '3.4k' },
  { label: 'Cities Covered', value: '120+' },
  { label: 'Avg. Response', value: '24 hrs' },
];

const coreFeatures = [
  {
    title: 'Verified Users Only',
    copy: 'Strict government-ID checks and admin approval keep prank or duplicate reports out of the system.',
  },
  {
    title: 'Radius-Based Alerts',
    copy: 'FindIn expands the search radius every 24 hours so new neighbourhoods receive fresh alerts automatically.',
  },
  {
    title: 'Geo-tagged Evidence',
    copy: 'Reports, sightings, and comments carry precise GPS locations, photos, and optional field notes.',
  },
];

const modules = [
  {
    title: 'Auth & Verification',
    copy: 'Government ID upload, admin workflow, role-based permissions (citizen, police, NGO, medical).',
  },
  {
    title: 'Report Management',
    copy: 'Categorised cases—Lost Persons, Criminal Activity, Traffic, Animal Welfare, Environmental hazards.',
  },
  {
    title: 'Notifications & Radius Engine',
    copy: 'Background jobs expand search radius and trigger push/SMS/Email/Firebase Cloud Messaging alerts.',
  },
  {
    title: 'Community Sightings',
    copy: 'Witnesses add comments with photos and coordinates; admins can escalate or dismiss quickly.',
  },
  {
    title: 'Admin Control Room',
    copy: 'Review pending users, moderate reports, view analytics, and coordinate cross-agency actions.',
  },
  {
    title: 'Mobile + Web Access',
    copy: 'React web, React Native mobile, shared API, and shared notification pipeline for complete coverage.',
  },
];

const milestones = [
  { phase: 'Backend Setup', description: 'Node.js + Express + MongoDB + JWT auth', priority: 'High' },
  { phase: 'ID Verification', description: 'Upload, review, approval workflow', priority: 'High' },
  { phase: 'Radius Logic', description: 'Geo distance, scheduled radius expansion, notifications', priority: 'High' },
  { phase: 'Web Frontend', description: 'Next.js UI for login, feed, report creation', priority: 'Medium' },
  { phase: 'Mobile App', description: 'React Native app with camera + push notifications', priority: 'Medium' },
  { phase: 'Admin Console', description: 'User/report moderation, dashboards', priority: 'Medium' },
  { phase: 'Testing & Deploy', description: 'Automated tests, CI/CD to Vercel + AWS/Heroku', priority: 'High' },
];

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-600 p-2 text-white shadow-md">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">FindIn</p>
              <p className="text-xs font-semibold text-blue-600">Trace faster. Alert smarter.</p>
            </div>
          </div>
          <nav className="flex items-center gap-5 text-sm font-semibold text-slate-600">
            <Link href="/reports" className="hover:text-blue-600">
              Reports
            </Link>
            <Link href="/login" className="hover:text-blue-600">
              Login
            </Link>
            <Link href="/register" className="hover:text-blue-600">
              Register
            </Link>
            <Link href="/admin" className="hover:text-blue-600">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 p-10 text-white shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white">Lost People & Criminal Finder</Badge>
              <h1 className="text-3xl font-black sm:text-4xl">
                India&apos;s community safety platform for rapid recoveries and safer neighbourhoods.
              </h1>
              <p className="max-w-2xl text-base text-blue-50 sm:text-lg">
                Every verified report is geo-tagged, approved by authorities, and automatically expands its alert radius every 24
                hours. FindIn keeps citizens, police, NGOs, and medical responders aligned on the same timeline.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-blue-700 hover:bg-slate-100">
                  <Link href={user ? '/reports' : '/register'}>
                    {user ? 'View Active Reports' : 'Join the Network'}
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  <Link href="/create-report">Report an Incident</Link>
                </Button>
              </div>
            </div>
            <div className="grid w-full max-w-xs grid-cols-2 gap-4">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-2xl bg-white/15 p-4 text-center shadow-inner">
                  <p className="text-2xl font-black">{stat.value}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-100">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {coreFeatures.map((feature) => (
            <Card key={feature.title} className="h-full border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-blue-600" />
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-600">{feature.copy}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-900">Designed Modules</h2>
            <Badge variant="secondary" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Web & Mobile parity
            </Badge>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {modules.map((module) => (
              <Card key={module.title} className="border-slate-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                    <Users className="h-5 w-5 text-blue-500" />
                    {module.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-600">{module.copy}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 flex items-center gap-3">
            <Badge variant="outline" className="border-blue-200 text-blue-700">
              Roadmap
            </Badge>
            <p className="text-sm text-slate-500">
              Implementation order aligned with FindIn specification—backend first, then radius automation, then UX.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {milestones.map((item) => (
              <Card key={item.phase} className="border-slate-200 bg-slate-50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold text-slate-900">{item.phase}</CardTitle>
                </CardHeader>
                <CardContent className="flex items-start justify-between gap-4">
                  <CardDescription className="text-sm text-slate-600">{item.description}</CardDescription>
                  <Badge
                    className={
                      item.priority === 'High'
                        ? 'bg-red-500/10 text-red-600'
                        : 'bg-yellow-400/10 text-yellow-600'
                    }
                  >
                    {item.priority}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-slate-200 bg-slate-900 text-slate-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Bell className="h-5 w-5 text-amber-400" />
                Notification Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-200">
                Alerts target only users inside the active radius. When the radius expands, only newly included users are notified,
                keeping the signal strong without desensitising previous recipients.
              </p>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• Push notifications via Firebase Cloud Messaging</li>
                <li>• SMS for urgent cases and low-connectivity users</li>
                <li>• Email summaries for admin and agency partners</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <MapPin className="h-5 w-5 text-blue-600" />
                India-first Scenarios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-slate-600">
              <p>
                FindIn focuses on the realities of Indian cities: missing children and elderly, women&apos;s safety, traffic/road
                incidents, animal welfare, and environmental hazards.
              </p>
              <p>
                Interfaces support English and major regional languages, WhatsApp sharing, and landmark-based address capture to
                suit how people describe locations locally.
              </p>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-3xl border border-blue-200 bg-blue-50 p-8 text-blue-900 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold">Security & Privacy Commitments</h2>
              <p className="text-sm text-blue-800">
                HTTPS everywhere, hashed credentials, signed JWTs, S3 object ACLs, audit logs, and compliance with Indian data
                residency guidelines.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Badge variant="secondary" className="bg-white text-blue-600">
                Zero trust access
              </Badge>
              <Badge variant="secondary" className="bg-white text-blue-600">
                Role-based scopes
              </Badge>
              <Badge variant="secondary" className="bg-white text-blue-600">
                Activity logs retained
              </Badge>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} FindIn. Built for safer Indian neighbourhoods.</p>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Citizen + Agency collaboration
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-green-600" />
              Geo intelligence
            </span>
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4 text-purple-600" />
              Automated radius expansion
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}

