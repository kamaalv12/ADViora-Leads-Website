'use client';

import React from 'react';
import { LeadTableRow } from '@/lib/types';
import { formatISTDateTime } from '@/server/utils/timezone';
import { Eye } from 'lucide-react';

interface LeadTableProps {
  leads: LeadTableRow[];
  loading: boolean;
  onSelectLead: (userId: string) => void;
}

export default function LeadTable({ leads, loading, onSelectLead }: LeadTableProps) {
  if (loading && leads.length === 0) {
    return (
      <div className="table-card">
        <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>
          Loading lead records from database...
        </div>
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="table-card">
        <div style={{ padding: '3.5rem 1rem', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--ink)' }}>No Leads Found</h3>
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.88rem' }}>
            No lead enquiries match the selected date range and filter criteria.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="table-card">
      <div className="table-scroll-container">
        <table className="lead-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S.No</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Latest Service Interest</th>
              <th>First Enquiry</th>
              <th>Latest Enquiry</th>
              <th>Attribution</th>
              <th style={{ textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => {
              const isAttr = lead.primaryAttribution.status === 'attributed';
              return (
                <tr key={lead.userId}>
                  <td style={{ color: 'var(--muted)', fontWeight: 600 }}>{lead.serialNumber}</td>
                  <td>
                    <div className="lead-name">{lead.name}</div>
                  </td>
                  <td>
                    <span className="phone-badge" title="Phone masked for overview privacy">
                      {lead.maskedPhone}
                    </span>
                  </td>
                  <td>
                    <span className="lead-email">{lead.email}</span>
                  </td>
                  <td>
                    <span className="interest-tag" title={lead.latestInterest}>
                      {lead.latestInterest}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                    {formatISTDateTime(lead.firstEnquiryDate)}
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--ink)', fontWeight: 500 }}>
                    {formatISTDateTime(lead.latestEnquiryDate)}
                  </td>
                  <td>
                    <span
                      className={`attribution-badge ${isAttr ? 'attributed' : 'unattributed'}`}
                      title={
                        lead.primaryAttribution.timestamp
                          ? `Tracked on ${formatISTDateTime(lead.primaryAttribution.timestamp)}`
                          : 'No marketing attribution recorded'
                      }
                    >
                      {lead.primaryAttribution.badgeLabel}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      className="details-action-btn"
                      onClick={() => onSelectLead(lead.userId)}
                      aria-label={`View details for ${lead.name}`}
                    >
                      <Eye size={13} style={{ display: 'inline', marginRight: '4px' }} />
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
