'use client';

import React, { useState } from 'react';
import { DateRangePreset } from '@/lib/types';
import { Calendar } from 'lucide-react';

interface DateRangeBarProps {
  range: DateRangePreset;
  startDate?: string;
  endDate?: string;
  onRangeChange: (preset: DateRangePreset, start?: string, end?: string) => void;
}

export default function DateRangeBar({
  range,
  startDate,
  endDate,
  onRangeChange,
}: DateRangeBarProps) {
  const [customStart, setCustomStart] = useState<string>(startDate || '');
  const [customEnd, setCustomEnd] = useState<string>(endDate || '');
  const [dateError, setDateError] = useState<string | null>(null);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setDateError(null);

    if (!customStart || !customEnd) {
      setDateError('Both start and end dates are required.');
      return;
    }

    if (customStart > customEnd) {
      setDateError('Start date must be before or equal to end date.');
      return;
    }

    onRangeChange('custom', customStart, customEnd);
  };

  return (
    <div className="control-bar">
      <div className="date-presets" role="group" aria-label="Date range presets">
        <button
          type="button"
          className={`date-preset-btn ${range === 'today' ? 'active' : ''}`}
          onClick={() => onRangeChange('today')}
        >
          Today
        </button>
        <button
          type="button"
          className={`date-preset-btn ${range === '7days' ? 'active' : ''}`}
          onClick={() => onRangeChange('7days')}
        >
          Last 7 Days
        </button>
        <button
          type="button"
          className={`date-preset-btn ${range === 'all' ? 'active' : ''}`}
          onClick={() => onRangeChange('all')}
        >
          All Time
        </button>
        <button
          type="button"
          className={`date-preset-btn ${range === 'custom' ? 'active' : ''}`}
          onClick={() => onRangeChange('custom', customStart, customEnd)}
        >
          Custom Range
        </button>
      </div>

      {range === 'custom' && (
        <form onSubmit={handleApplyCustom} className="custom-range-card">
          <Calendar size={16} className="text-muted" />
          <input
            type="date"
            aria-label="Start Date"
            value={customStart}
            onChange={(e) => setCustomStart(e.target.value)}
            className="custom-date-input"
            required
          />
          <span style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>to</span>
          <input
            type="date"
            aria-label="End Date"
            value={customEnd}
            onChange={(e) => setCustomEnd(e.target.value)}
            className="custom-date-input"
            required
          />
          <button type="submit" className="apply-btn">
            Apply
          </button>
          {dateError && (
            <span style={{ color: '#b91c1c', fontSize: '0.78rem', marginLeft: '0.5rem' }}>
              {dateError}
            </span>
          )}
        </form>
      )}
    </div>
  );
}
