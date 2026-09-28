'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MAX_CSV_EXPORT_LIMIT } from '@/lib/constants';

interface TruncationBannerProps {
  totalMatched: number;
}

export default function TruncationBanner({ totalMatched }: TruncationBannerProps) {
  if (totalMatched <= MAX_CSV_EXPORT_LIMIT) {
    return null;
  }

  return (
    <div className="alert-banner" role="status">
      <AlertTriangle size={18} style={{ flexShrink: 0, color: '#b45309' }} />
      <div>
        <strong>Export Notice:</strong> Found {totalMatched.toLocaleString()} matching leads. CSV export is strictly capped at the first {MAX_CSV_EXPORT_LIMIT.toLocaleString()} records. Please narrow your date range or filters to export specific subsets.
      </div>
    </div>
  );
}
