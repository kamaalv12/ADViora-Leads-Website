'use client';

import React, { useState, useEffect } from 'react';
import { LeadDetailResponse } from '@/lib/types';
import { formatISTDateTime } from '@/server/utils/timezone';
import { X, ChevronLeft, ChevronRight, User, MessageSquare, Compass, Info } from 'lucide-react';

interface LeadDetailDrawerProps {
  userId: string | null;
  onClose: () => void;
}

export default function LeadDetailDrawer({ userId, onClose }: LeadDetailDrawerProps) {
  const [data, setData] = useState<LeadDetailResponse['data'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [enquiriesPage, setEnquiriesPage] = useState(1);
  const [touchpointsPage, setTouchpointsPage] = useState(1);

  // Fetch lead details whenever userId or page changes
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    const fetchDetails = async () => {
      try {
        const queryParams = new URLSearchParams({
          enquiriesPage: String(enquiriesPage),
          enquiriesLimit: '10',
          touchpointsPage: String(touchpointsPage),
          touchpointsLimit: '10',
        });

        const res = await fetch(`/api/leads/${userId}?${queryParams.toString()}`);
        const json = await res.json();

        if (!isMounted) return;

        if (res.ok && json.success) {
          setData(json.data);
        } else {
          setError(json.message || 'Failed to retrieve lead details');
        }
      } catch {
        if (isMounted) setError('Network error loading lead details');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [userId, enquiriesPage, touchpointsPage]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!userId) return null;

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div>
            <h2 className="drawer-title">{data?.user.name || 'Lead Details'}</h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
              ID: {userId}
            </span>
          </div>
          <button
            type="button"
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close details panel"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {error && (
            <div className="alert-banner error" role="alert">
              {error}
            </div>
          )}

          {loading && !data && (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)' }}>
              Loading lead details...
            </div>
          )}

          {data && (
            <>
              {/* 1. Verified Contact Information */}
              <div>
                <h3 className="detail-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <User size={15} />
                  <span>Contact Information</span>
                </h3>
                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-label">Full Name</div>
                    <div className="info-val">{data.user.name}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Phone Number</div>
                    <div className="info-val">{data.user.countryCode} {data.user.phone}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Email Address</div>
                    <div className="info-val">{data.user.email}</div>
                  </div>
                  <div className="info-item">
                    <div className="info-label">Registered Since</div>
                    <div className="info-val">{formatISTDateTime(data.user.createdAt)}</div>
                  </div>
                </div>
              </div>

              {/* Attribution Relationship Disclaimer */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '0.75rem 1rem',
                  fontSize: '0.8rem',
                  color: 'var(--muted)',
                  display: 'flex',
                  gap: '0.5rem',
                }}
              >
                <Info size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#64748b' }} />
                <div>
                  <strong>Attribution Notice:</strong> Service enquiries and marketing touchpoints are linked at the user level through the database profile. They represent the lead’s comprehensive history rather than an isolated 1:1 pairing.
                </div>
              </div>

              {/* 2. Service Enquiry History */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 className="detail-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MessageSquare size={15} />
                    <span>Service Enquiries ({data.enquiries.total})</span>
                  </h3>
                  {data.enquiries.totalPages > 1 && (
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setEnquiriesPage((p) => Math.max(p - 1, 1))}
                        disabled={enquiriesPage === 1}
                        aria-label="Previous Enquiries Page"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {enquiriesPage}/{data.enquiries.totalPages}
                      </span>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setEnquiriesPage((p) => Math.min(p + 1, data.enquiries.totalPages))}
                        disabled={enquiriesPage === data.enquiries.totalPages}
                        aria-label="Next Enquiries Page"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {data.enquiries.items.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No enquiries recorded.</div>
                ) : (
                  data.enquiries.items.map((enq) => (
                    <div key={enq._id} className="timeline-card">
                      <div className="timeline-meta">
                        <span className="interest-tag">{enq.interest}</span>
                        <span>{formatISTDateTime(enq.createdAt)}</span>
                      </div>
                      <div className="timeline-message">{enq.message}</div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. Campaign & Touchpoint History */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <h3 className="detail-section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Compass size={15} />
                    <span>Attribution Touchpoints ({data.touchpoints.total})</span>
                  </h3>
                  {data.touchpoints.totalPages > 1 && (
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setTouchpointsPage((p) => Math.max(p - 1, 1))}
                        disabled={touchpointsPage === 1}
                        aria-label="Previous Touchpoints Page"
                      >
                        <ChevronLeft size={13} />
                      </button>
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                        {touchpointsPage}/{data.touchpoints.totalPages}
                      </span>
                      <button
                        type="button"
                        className="page-btn"
                        onClick={() => setTouchpointsPage((p) => Math.min(p + 1, data.touchpoints.totalPages))}
                        disabled={touchpointsPage === data.touchpoints.totalPages}
                        aria-label="Next Touchpoints Page"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {data.touchpoints.items.length === 0 ? (
                  <div style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>No touchpoint records.</div>
                ) : (
                  data.touchpoints.items.map((tp) => (
                    <div key={tp._id} className="timeline-card">
                      <div className="timeline-meta">
                        <span
                          className={`attribution-badge ${tp.hasAttributionEvidence ? 'attributed' : 'unattributed'}`}
                        >
                          {tp.hasAttributionEvidence ? 'Attributed Visit' : 'Direct / Unattributed'}
                        </span>
                        <span>{formatISTDateTime(tp.createdAt)}</span>
                      </div>

                      {tp.route && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--ink)', marginBottom: '0.4rem' }}>
                          <strong>Route:</strong> {tp.route}
                        </div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem', fontSize: '0.78rem' }}>
                        {tp.utm_source && <div><strong>Source:</strong> {tp.utm_source}</div>}
                        {tp.utm_medium && <div><strong>Medium:</strong> {tp.utm_medium}</div>}
                        {tp.utm_campaign && <div><strong>Campaign:</strong> {tp.utm_campaign}</div>}
                        {tp.utm_content && <div><strong>Content:</strong> {tp.utm_content}</div>}
                        {tp.utm_term && <div><strong>Term:</strong> {tp.utm_term}</div>}
                        {tp.platform && <div><strong>Platform:</strong> {tp.platform}</div>}
                        {tp.gclid && <div><strong>Google Click ID:</strong> <span style={{ wordBreak: 'break-all' }}>{tp.gclid}</span></div>}
                        {tp.fbclid && <div><strong>Meta Click ID:</strong> <span style={{ wordBreak: 'break-all' }}>{tp.fbclid}</span></div>}
                        {tp.fbc && <div><strong>Meta fbc:</strong> <span style={{ wordBreak: 'break-all' }}>{tp.fbc}</span></div>}
                        {tp.fbp && <div><strong>Meta fbp (browser cookie):</strong> <span style={{ wordBreak: 'break-all' }}>{tp.fbp}</span></div>}
                        {tp.device && <div><strong>Device (hardware):</strong> {tp.device}</div>}
                        {tp.keyword && <div><strong>Keyword:</strong> {tp.keyword}</div>}
                        {tp.matchtype && <div><strong>Matchtype:</strong> {tp.matchtype}</div>}
                        {tp.network && <div><strong>Network:</strong> {tp.network}</div>}
                        {tp.placement && <div><strong>Placement:</strong> {tp.placement}</div>}
                        {tp.campaignid && <div><strong>Campaign ID:</strong> {tp.campaignid}</div>}
                        {tp.adgroupid && <div><strong>Adgroup ID:</strong> {tp.adgroupid}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
