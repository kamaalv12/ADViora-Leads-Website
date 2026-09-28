'use client';

import React from 'react';
import { PaginationMeta } from '@/lib/types';
import { ALLOWED_PAGE_SIZES } from '@/lib/constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
}

export default function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = pagination;

  if (total === 0) {
    return null;
  }

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, total);

  return (
    <div className="pagination-bar">
      <div>
        Showing <strong>{startRecord}</strong> to <strong>{endRecord}</strong> of{' '}
        <strong>{total.toLocaleString()}</strong> leads
      </div>

      <div className="pagination-controls">
        <label htmlFor="limit-select" style={{ fontSize: '0.82rem', marginRight: '0.25rem' }}>
          Rows per page:
        </label>
        <select
          id="limit-select"
          value={limit}
          onChange={(e) => onLimitChange(Number(e.target.value))}
          style={{
            padding: '0.25rem 0.5rem',
            borderRadius: '4px',
            border: '1px solid var(--line)',
            background: 'var(--paper)',
            fontSize: '0.82rem',
            marginRight: '1rem',
          }}
        >
          {ALLOWED_PAGE_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={!hasPrevPage}
          aria-label="Previous Page"
        >
          <ChevronLeft size={14} style={{ display: 'inline' }} />
          <span>Prev</span>
        </button>

        <span style={{ margin: '0 0.5rem', fontSize: '0.85rem', fontWeight: 600 }}>
          {page} / {totalPages}
        </span>

        <button
          type="button"
          className="page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={!hasNextPage}
          aria-label="Next Page"
        >
          <span>Next</span>
          <ChevronRight size={14} style={{ display: 'inline' }} />
        </button>
      </div>
    </div>
  );
}
