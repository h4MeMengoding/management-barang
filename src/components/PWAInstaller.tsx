'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PWAInstaller() {
  // This component is now deprecated as PWA install functionality
  // has been moved to the navbar dropdown. This component no longer
  // shows the install banner to avoid conflicts.
  return null;
}
