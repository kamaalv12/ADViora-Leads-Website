'use client';

import React from 'react';
import { DashboardMetrics } from '@/lib/types';
import { Users, FileText, UserPlus, UserCheck } from 'lucide-react';

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

export default function MetricCards({ metrics, loading }: MetricCardsProps) {
  if (loading && !metrics) {
    return (
      <div className="metrics-grid">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="metric-card" style={{ height: '110px' }}>
            <div style={{ background: '#e2e8f0', height: '14px', width: '60%', borderRadius: '4px', marginBottom: '12px' }} />
            <div style={{ background: '#cbd5e1', height: '28px', width: '40%', borderRadius: '4px' }} />
          </div>
        ))}
      </div>
    );
  }

  const {
    uniqueLeads = 0,
    totalEnquiries = 0,
    newLeads = 0,
    returningLeads = 0,
    activeRangeLabel = '',
  } = metrics || {};

  return (
    <div className="metrics-grid">
      {/* 1. Unique Leads */}
      <div className="metric-card accent-navy">
        <div className="metric-header">
          <span className="metric-title">Unique Enquiring Leads</span>
          <div className="metric-icon-wrap">
            <Users size={18} />
          </div>
        </div>
        <div className="metric-value">{uniqueLeads.toLocaleString()}</div>
        <div className="metric-caption">Distinct leads with in-period enquiries</div>
      </div>

      {/* 2. Total Enquiries */}
      <div className="metric-card accent-red">
        <div className="metric-header">
          <span className="metric-title">Total Enquiries</span>
          <div className="metric-icon-wrap">
            <FileText size={18} />
          </div>
        </div>
        <div className="metric-value">{totalEnquiries.toLocaleString()}</div>
        <div className="metric-caption">Matching selected service interest</div>
      </div>

      {/* 3. New Leads */}
      <div className="metric-card accent-coral">
        <div className="metric-header">
          <span className="metric-title">New Leads Created</span>
          <div className="metric-icon-wrap">
            <UserPlus size={18} />
          </div>
        </div>
        <div className="metric-value">{newLeads.toLocaleString()}</div>
        <div className="metric-caption">User profile registered in period</div>
      </div>

      {/* 4. Returning Leads */}
      <div className="metric-card accent-slate">
        <div className="metric-header">
          <span className="metric-title">Returning Leads</span>
          <div className="metric-icon-wrap">
            <UserCheck size={18} />
          </div>
        </div>
        <div className="metric-value">
          {returningLeads === 'N/A' ? (
            <span style={{ fontSize: '1.4rem', color: 'var(--muted)' }}>N/A</span>
          ) : (
            returningLeads.toLocaleString()
          )}
        </div>
        <div className="metric-caption" title="Enquired in period, created prior to period">
          {returningLeads === 'N/A'
            ? 'Not applicable for All Time'
            : 'Created prior to active period'}
        </div>
      </div>
    </div>
  );
}
