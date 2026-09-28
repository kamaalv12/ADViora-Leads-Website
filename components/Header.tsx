'use client';

import React from 'react';
import Image from 'next/image';
import { RotateCw } from 'lucide-react';

interface HeaderProps {
  lastUpdated: string | null;
  refreshing: boolean;
  onRefresh: () => void;
}

export default function Header({ lastUpdated, refreshing, onRefresh }: HeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-inner">
        <div className="brand-wrapper">
          <Image
            src="/images/adviora-logo.webp"
            alt="ADViora Consulting Logo"
            width={160}
            height={38}
            className="brand-logo-img"
            priority
          />
          <div className="brand-title-group">
            <h1 className="dashboard-title">Leads Operations Dashboard</h1>
            <span className="dashboard-subtitle">Internal Read-Only Operations & Attribution</span>
          </div>
        </div>

        <div className="header-actions">
          <span className="update-indicator">
            {lastUpdated ? `Last updated: ${lastUpdated}` : 'Not updated yet'}
          </span>
          <button
            type="button"
            className="refresh-button"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh lead data"
          >
            <RotateCw size={15} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
