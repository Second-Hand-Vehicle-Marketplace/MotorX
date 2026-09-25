import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, type AdminAuditLog, type AdminStats, type AdminUpload } from '@/features/admin/services/adminApi';
import { getPendingDealerApplications } from '@/features/dealers/services/dealerApi';
import type { DealerApplication } from '@/features/dealers/types/dealer.types';

const emptyStats: AdminStats = { totalUsers: 0, activeDealers: 0, registeredDealers: 0, totalListings: 0, activeListings: 0, pendingDealerApplications: 0 };

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState(emptyStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState<AdminUpload[]>([]);
  const [activity, setActivity] = useState<AdminAuditLog[]>([]);
  const [applications, setApplications] = useState<DealerApplication[]>([]);
  const [expanded, setExpanded] = useState<'attention' | 'inventory' | 'activity' | null>(null);
  // Sections whose data could not be loaded: shown as "unavailable", never as a misleading zero or empty list.
  const [unavailable, setUnavailable] = useState<Set<'stats' | 'uploads' | 'activity' | 'applications'>>(new Set());

  const attentionUploads = uploads.filter((upload) => upload.status === 'failed' || upload.rejectedRecords > 0);
  const attentionItems = [
    ...applications.map((application) => ({ id: `application-${application.id}`, title: application.businessName, detail: `${application.reviewHistory.length ? 'Resubmitted application' : 'Application'} waiting ${formatWaitingTime(application.submittedAt || application.createdAt)}`, href: `/admin/dealers?status=pending&applicationId=${application.id}`, tone: 'warning' })),
    ...attentionUploads.map((upload) => ({ id: `upload-${upload.id}`, title: upload.fileName, detail: upload.status === 'failed' ? 'Upload failed and needs review' : `${upload.rejectedRecords} rejected records need review`, href: `/admin/uploads?uploadId=${upload.id}`, tone: upload.status === 'failed' ? 'danger' : 'warning' })),
  ];
  const visibleAttention = expanded === 'attention' ? attentionItems : attentionItems.slice(0, 4);
  const visibleUploads = expanded === 'inventory' ? uploads : uploads.slice(0, 4);
  const visibleActivity = expanded === 'activity' ? activity : activity.slice(0, 4);
  const toggleExpanded = (section: 'attention' | 'inventory' | 'activity') => setExpanded((current) => current === section ? null : section);

  useEffect(() => {
    let active = true;
    // Ignore late responses after navigation away from the dashboard.
    void Promise.allSettled([adminApi.getStats(), adminApi.listUploads({ limit: 20 }), adminApi.listAuditLogs({ limit: 20 }), getPendingDealerApplications()]).then(([statsResult, uploadsResult, activityResult, applicationsResult]) => {
      if (!active) return;
      const failed = new Set<'stats' | 'uploads' | 'activity' | 'applications'>();
      if (statsResult.status === 'fulfilled') setStats(statsResult.value); else failed.add('stats');
      if (uploadsResult.status === 'fulfilled') setUploads(uploadsResult.value.uploads); else failed.add('uploads');
      if (activityResult.status === 'fulfilled') setActivity(activityResult.value.logs); else failed.add('activity');
      if (applicationsResult.status === 'fulfilled') setApplications(applicationsResult.value); else failed.add('applications');
      setUnavailable(failed);
      if (failed.size) setError('Some dashboard information could not be loaded. The affected sections are marked below; refresh the page to try again.');
    })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="admin-dashboard">
    <div className="admin-dashboard-hero"><div><span className="admin-dashboard-kicker">Marketplace operations</span><h1 className="page-title">Good evening, {stats.activeDealers ? 'team' : 'administrator'}</h1><p className="page-subtitle">A focused view of the work that needs a decision today.</p></div><Link to="/admin/dealers" className="admin-primary-action">Review applications</Link></div>
    {error && <div className="alert alert-error" role="alert" style={{ marginBottom: '1rem' }}>{error}</div>}
    <div className="admin-metric-grid">
      <Link to="/admin/dealers?status=pending" className="admin-metric admin-metric-amber"><span>Needs review</span><strong>{loading || unavailable.has('stats') ? '—' : stats.pendingDealerApplications}</strong><small>Pending applications</small></Link>
      <Link to="/admin/listings?status=active" className="admin-metric admin-metric-blue"><span>Marketplace</span><strong>{loading || unavailable.has('stats') ? '—' : stats.activeListings}</strong><small>Active listings</small></Link>
      <Link to="/admin/dealers?status=approved" className="admin-metric admin-metric-green"><span>Dealers</span><strong>{loading || unavailable.has('stats') ? '—' : stats.activeDealers}</strong><small>Currently active</small></Link>
      <Link to="/admin/users" className="admin-metric admin-metric-slate"><span>Community</span><strong>{loading || unavailable.has('stats') ? '—' : stats.totalUsers}</strong><small>Registered users</small></Link>
    </div>
    <div className="admin-dashboard-grid">
      <section className="admin-section admin-section-attention"><SectionHeader title="Needs attention" count={attentionItems.length} expanded={expanded === 'attention'} onToggle={() => toggleExpanded('attention')} /><div className="admin-feed">{visibleAttention.map((item) => <Link key={item.id} to={item.href} className="admin-feed-item"><span className={`admin-feed-dot ${item.tone}`} /><span className="admin-feed-copy"><strong>{item.title}</strong><small>{item.detail}</small></span><span className="admin-feed-arrow">→</span></Link>)}{(unavailable.has('applications') || unavailable.has('uploads')) && <UnavailableMessage text={visibleAttention.length ? 'Some items needing attention could not be loaded.' : 'Items needing attention could not be loaded.'} />}{!loading && !visibleAttention.length && !unavailable.has('applications') && !unavailable.has('uploads') && <EmptyMessage text="Everything is up to date." />}</div></section>
      <section className="admin-section"><SectionHeader title="Inventory activity" count={uploads.length} expanded={expanded === 'inventory'} onToggle={() => toggleExpanded('inventory')} /><div className="admin-feed">{visibleUploads.map((upload) => <Link key={upload.id} to={`/admin/uploads?uploadId=${upload.id}`} className="admin-feed-item"><span className={`admin-status-pill ${upload.status === 'failed' ? 'danger' : upload.status === 'completedWithErrors' ? 'warning' : upload.status === 'completed' ? 'success' : 'info'}`}>{formatUploadStatus(upload.status)}</span><span className="admin-feed-copy"><strong>{upload.fileName}</strong><small>{upload.dealerName} · {upload.validRecords} accepted · {upload.rejectedRecords} rejected</small></span><span className="admin-feed-arrow">→</span></Link>)}{unavailable.has('uploads') ? <UnavailableMessage text="Inventory activity could not be loaded." /> : !loading && !visibleUploads.length && <EmptyMessage text="No inventory uploads yet." />}</div></section>
    </div>
    <section className="admin-section admin-section-wide"><SectionHeader title="Recent administrative activity" count={activity.length} expanded={expanded === 'activity'} onToggle={() => toggleExpanded('activity')} /><div className="admin-audit-list">{visibleActivity.map((record) => <div key={record.id} className="admin-audit-item"><span className="admin-audit-icon">{record.eventType === 'listing_removed' ? 'L' : record.eventType.startsWith('dealer_') ? 'D' : 'U'}</span><span className="admin-feed-copy"><strong>{formatAuditEvent(record.eventType, record.targetName)}</strong><small>{record.details} · by {record.actorName} · {new Date(record.timestamp).toLocaleString()}</small></span></div>)}{unavailable.has('activity') ? <UnavailableMessage text="Administrative activity could not be loaded." /> : !loading && !visibleActivity.length && <EmptyMessage text="No administrative activity yet." />}</div></section>
  </div>;
};

function formatWaitingTime(createdAt: string) { const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000); return days > 0 ? `${days}d` : `${Math.max(1, Math.floor((Date.now() - new Date(createdAt).getTime()) / 3_600_000))}h`; }
function formatUploadStatus(status: AdminUpload['status']) { return status === 'pending' ? 'Waiting' : status === 'processing' ? 'Processing' : status === 'completedWithErrors' ? 'Needs review' : status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : status; }
function formatAuditEvent(event: AdminAuditLog['eventType'], target: string) { return event === 'dealer_approved' ? `Dealer approved · ${target}` : event === 'dealer_rejected' ? `Dealer rejected · ${target}` : event === 'user_suspended' ? `Account suspended · ${target}` : event === 'user_activated' ? `Account reactivated · ${target}` : event === 'dealer_document_viewed' ? `Verification document viewed · ${target}` : `Listing removed · ${target}`; }
function SectionHeader({ title, count, expanded, onToggle }: { title: string; count: number; expanded: boolean; onToggle: () => void }) { return <div className="admin-section-header"><div><h2>{title}</h2><span>{count} {count === 1 ? 'item' : 'items'}</span></div>{count > 4 && <button type="button" className="admin-expand-button" onClick={onToggle}>{expanded ? 'Show less' : 'View all'} <span>{expanded ? '↑' : '↓'}</span></button>}</div>; }
function EmptyMessage({ text }: { text: string }) { return <p className="admin-empty-message">{text}</p>; }
function UnavailableMessage({ text }: { text: string }) { return <p className="admin-empty-message" role="status" style={{ color: 'var(--color-error)' }}>Unavailable right now. {text}</p>; }
