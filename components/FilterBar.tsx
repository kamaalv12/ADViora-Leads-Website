'use client';

import React, { useState, useEffect } from 'react';
import { Search, Download, X } from 'lucide-react';
import { AttributionFilter, SortOrder } from '@/lib/types';
import { ALLOWED_DIGITAL_INTERESTS } from '@/lib/constants';

interface FilterBarProps {
  search: string;
  interest: string;
  attribution: AttributionFilter;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  sort: SortOrder;
  sources: string[];
  mediums: string[];
  campaigns: string[];
  onSearchChange: (val: string) => void;
  onInterestChange: (val: string) => void;
  onAttributionChange: (val: AttributionFilter) => void;
  onUtmSourceChange: (val: string) => void;
  onUtmMediumChange: (val: string) => void;
  onUtmCampaignChange: (val: string) => void;
  onSortChange: (val: SortOrder) => void;
  onClearFilters: () => void;
  onExportCsv: () => void;
  exporting: boolean;
  totalMatched: number;
}

export default function FilterBar({
  search,
  interest,
  attribution,
  utmSource,
  utmMedium,
  utmCampaign,
  sort,
  sources,
  mediums,
  campaigns,
  onSearchChange,
  onInterestChange,
  onAttributionChange,
  onUtmSourceChange,
  onUtmMediumChange,
  onUtmCampaignChange,
  onSortChange,
  onClearFilters,
  onExportCsv,
  exporting,
  totalMatched,
}: FilterBarProps) {
  const [searchInput, setSearchInput] = useState(search);

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== search) {
        onSearchChange(searchInput);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchInput, search, onSearchChange]);

  const hasActiveFilters =
    Boolean(search) ||
    interest !== 'all' ||
    attribution !== 'all' ||
    Boolean(utmSource) ||
    Boolean(utmMedium) ||
    Boolean(utmCampaign) ||
    sort !== 'latest';

  return (
    <div className="filter-card">
      <div className="filter-row">
        {/* Search */}
        <div className="search-input-wrap">
          <Search size={16} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by name, email, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label="Search leads"
          />
        </div>

        {/* Service Interest */}
        <select
          className="filter-select"
          value={interest}
          onChange={(e) => onInterestChange(e.target.value)}
          aria-label="Filter by Service Interest"
        >
          <option value="all">All Services</option>
          {ALLOWED_DIGITAL_INTERESTS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        {/* Attribution Filter */}
        <select
          className="filter-select"
          value={attribution}
          onChange={(e) => onAttributionChange(e.target.value as AttributionFilter)}
          aria-label="Filter by Attribution Status"
        >
          <option value="all">All Attribution</option>
          <option value="attributed">Attributed Only</option>
          <option value="unattributed">Unattributed Only</option>
        </select>

        {/* UTM Source */}
        {sources.length > 0 && (
          <select
            className="filter-select"
            value={utmSource}
            onChange={(e) => onUtmSourceChange(e.target.value)}
            aria-label="Filter by UTM Source"
          >
            <option value="">All Sources</option>
            {sources.map((src) => (
              <option key={src} value={src}>
                {src}
              </option>
            ))}
          </select>
        )}

        {/* UTM Medium */}
        {mediums.length > 0 && (
          <select
            className="filter-select"
            value={utmMedium}
            onChange={(e) => onUtmMediumChange(e.target.value)}
            aria-label="Filter by UTM Medium"
          >
            <option value="">All Mediums</option>
            {mediums.map((med) => (
              <option key={med} value={med}>
                {med}
              </option>
            ))}
          </select>
        )}

        {/* UTM Campaign */}
        {campaigns.length > 0 && (
          <select
            className="filter-select"
            value={utmCampaign}
            onChange={(e) => onUtmCampaignChange(e.target.value)}
            aria-label="Filter by UTM Campaign"
          >
            <option value="">All Campaigns</option>
            {campaigns.map((cmp) => (
              <option key={cmp} value={cmp}>
                {cmp}
              </option>
            ))}
          </select>
        )}

        {/* Sort */}
        <select
          className="filter-select"
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOrder)}
          aria-label="Sort leads by enquiry date"
        >
          <option value="latest">Newest Enquiry First</option>
          <option value="oldest">Oldest Enquiry First</option>
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            type="button"
            className="clear-filters-btn"
            onClick={() => {
              setSearchInput('');
              onClearFilters();
            }}
          >
            <X size={13} style={{ display: 'inline', marginRight: '3px' }} />
            Clear Filters
          </button>
        )}

        {/* CSV Export Button */}
        <button
          type="button"
          className="export-btn"
          onClick={onExportCsv}
          disabled={exporting || totalMatched === 0}
          title="Export active filtered leads as CSV"
        >
          <Download size={15} />
          <span>{exporting ? 'Exporting...' : `Export CSV (${totalMatched.toLocaleString()})`}</span>
        </button>
      </div>
    </div>
  );
}
