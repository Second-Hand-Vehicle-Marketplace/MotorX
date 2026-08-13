import React, { useState } from 'react';
import { mockAuditLogs, formatDateTime } from '../../../shared/mockData';

export const AuditLogs: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredLogs = mockAuditLogs.filter(log => {
    if (filterType !== 'all' && log.eventType !== filterType) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Audit Logs</h1>
          <p className="page-subtitle">Immutable log of security, dealer approval, and administrative actions</p>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem' }}>
        <select
          className="form-select"
          style={{ maxWidth: 240 }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="all">All Event Types</option>
          <option value="dealer_approved">Dealer Approved</option>
          <option value="dealer_rejected">Dealer Rejected</option>
          <option value="user_suspended">User Suspended</option>
          <option value="user_activated">User Activated</option>
          <option value="listing_removed">Listing Removed</option>
          <option value="upload_completed">Upload Completed</option>
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Details</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => (
                <tr key={log.id}>
                  <td>
                    <span className="badge badge-warning" style={{ fontFamily: 'monospace' }}>
                      {log.eventType}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{log.actorName}</td>
                  <td>{log.targetName}</td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{log.details}</td>
                  <td style={{ fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>{formatDateTime(log.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};