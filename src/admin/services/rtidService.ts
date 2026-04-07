// src/admin/services/rtidService.ts
// RTID lookup, lifecycle stage computation, and status transitions.

import { db } from '../../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { toDate } from './exportService';

// ─── RTID Lifecycle Stages ────────────────────────────────────────────────────

export type RTIDStage =
  | 'Donor'
  | 'Collection'
  | 'Testing'
  | 'Storage'
  | 'Hospital'
  | 'Patient';

export interface RTIDLifecycle {
  stage: RTIDStage;
  label: string;
  completed: boolean;
  timestamp?: string;
}

/**
 * Maps a raw blood request / donation status string to its lifecycle stage.
 */
export function computeLifecycle(status: string, type: 'request' | 'donation'): RTIDLifecycle[] {
  const norm = (status || '').toLowerCase();

  if (type === 'donation') {
    return [
      { stage: 'Donor', label: 'Donor Registered', completed: true },
      { stage: 'Collection', label: 'Blood Collected', completed: ['available', 'redeemed'].some((s) => norm.includes(s)) },
      { stage: 'Testing', label: 'Lab Tested', completed: ['available', 'redeemed'].some((s) => norm.includes(s)) },
      { stage: 'Storage', label: 'Stored at Blood Bank', completed: norm.includes('available') || norm.includes('redeemed') },
      { stage: 'Hospital', label: 'Dispatched to Hospital', completed: norm.includes('redeemed') },
      { stage: 'Patient', label: 'Transfused to Patient', completed: norm.includes('redeemed') },
    ];
  }

  // request
  return [
    { stage: 'Donor', label: 'Donor Assigned', completed: !['pending'].includes(norm) },
    { stage: 'Collection', label: 'Blood Collected', completed: ['completed', 'fulfilled', 'redeemed'].some((s) => norm.includes(s)) },
    { stage: 'Testing', label: 'Compatibility Test', completed: ['completed', 'fulfilled', 'redeemed'].some((s) => norm.includes(s)) },
    { stage: 'Storage', label: 'Reserved for Patient', completed: ['completed', 'fulfilled', 'redeemed'].some((s) => norm.includes(s)) },
    { stage: 'Hospital', label: 'Delivered to Hospital', completed: ['completed', 'fulfilled', 'redeemed'].some((s) => norm.includes(s)) },
    { stage: 'Patient', label: 'Patient Transfusion', completed: ['completed', 'redeemed'].some((s) => norm.includes(s)) },
  ];
}

// ─── RTID Lookup ──────────────────────────────────────────────────────────────

export interface RTIDRecord {
  id: string;
  rtid: string;
  type: 'request' | 'donation';
  bloodGroup: string;
  units: number;
  status: string;
  city: string;
  createdAt: Date | null;
  patientName?: string;
  donorName?: string;
  hospitalName?: string;
  bloodBankName?: string;
  lifecycle: RTIDLifecycle[];
  rawData: Record<string, unknown>;
}

/**
 * Look up an RTID from the in-memory national ledger (no extra Firestore call).
 * Pass in the already-fetched ledger array from adminDataService.
 */
export function lookupRTID(
  rtidInput: string,
  ledger: RTIDRecord[]
): RTIDRecord | null {
  const q = rtidInput.trim().toUpperCase();
  return (
    ledger.find(
      (item) =>
        item.rtid?.toUpperCase() === q ||
        item.rtid?.toUpperCase().includes(q) ||
        item.id === rtidInput.trim()
    ) ?? null
  );
}

/**
 * Build an RTIDRecord from a raw Firestore request document.
 */
export function buildRTIDFromRequest(doc: Record<string, unknown>, id: string): RTIDRecord {
  const status = (doc.status as string) || 'Unknown';
  return {
    id,
    rtid: (doc.rtid as string) || `REQ-${id.slice(0, 8)}`,
    type: 'request',
    bloodGroup: (doc.bloodGroup as string) || 'N/A',
    units: Number(doc.unitsRequired || doc.units) || 1,
    status,
    city: (doc.city as string) || (doc.district as string) || 'Unknown',
    createdAt: toDate(doc.createdAt),
    patientName: (doc.patientName as string) || 'Confidential',
    hospitalName: (doc.hospitalName as string) || 'Unknown',
    lifecycle: computeLifecycle(status, 'request'),
    rawData: doc,
  };
}

/**
 * Build an RTIDRecord from a raw Firestore donation document.
 */
export function buildRTIDFromDonation(
  doc: Record<string, unknown>,
  id: string,
  cityMap: Record<string, string>
): RTIDRecord {
  const donorId = (doc.donorId as string) || '';
  const status = (doc.status as string) || 'Unknown';
  return {
    id,
    rtid: (doc.rtid as string) || `DON-${id.slice(0, 8)}`,
    type: 'donation',
    bloodGroup: (doc.bloodGroup as string) || 'N/A',
    units: Number(doc.units) || 1,
    status,
    city: (doc.city as string) || (doc.district as string) || cityMap[donorId] || 'Unknown',
    createdAt: toDate(doc.createdAt),
    donorName: (doc.donorName as string) || 'Anonymous',
    bloodBankName: (doc.bloodBankName as string) || 'Unknown',
    lifecycle: computeLifecycle(status, 'donation'),
    rawData: doc,
  };
}
