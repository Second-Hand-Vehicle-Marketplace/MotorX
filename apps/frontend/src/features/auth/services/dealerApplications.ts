import type { DealerApplication, DealerApplicationInput } from '../types/auth.types';

const storageKey = 'motorx_dealer_applications';

const initialApplications: DealerApplication[] = [
  {
    id: 'del_001',
    applicantName: 'Robert Vance',
    email: 'robert@apexmotors.com',
    password: 'Demo123!',
    businessName: 'Apex Motor Group',
    businessLicense: 'BL-98234-CA',
    phone: '+1 (555) 234-5678',
    address: '1420 Auto Mall Pkwy, San Jose, CA',
    status: 'pending',
    appliedAt: '2026-08-08T10:00:00Z',
  },
  {
    id: 'del_002',
    applicantName: 'Elena Rostova',
    email: 'elena@metroselect.com',
    password: 'Demo123!',
    businessName: 'Metro Select Cars',
    businessLicense: 'BL-44129-TX',
    phone: '+1 (555) 876-5432',
    address: '88 Commerce St, Austin, TX',
    status: 'pending',
    appliedAt: '2026-08-09T14:30:00Z',
  },
];

function loadApplications(): DealerApplication[] {
  if (typeof window === 'undefined') {
    return initialApplications;
  }

  const stored = window.localStorage.getItem(storageKey);
  if (!stored) {
    window.localStorage.setItem(storageKey, JSON.stringify(initialApplications));
    return initialApplications;
  }

  try {
    const parsed = JSON.parse(stored) as DealerApplication[];
    return Array.isArray(parsed) ? parsed : initialApplications;
  } catch {
    return initialApplications;
  }
}

function saveApplications(applications: DealerApplication[]) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(applications));
}

export function listDealerApplications(): DealerApplication[] {
  return loadApplications();
}

export function findDealerApplicationByEmail(email: string): DealerApplication | undefined {
  return loadApplications().find(application => application.email.toLowerCase() === email.toLowerCase());
}

export function findDealerApplicationById(id: string): DealerApplication | undefined {
  return loadApplications().find(application => application.id === id);
}

export function registerDealerApplication(data: DealerApplicationInput): DealerApplication {
  const applications = loadApplications();
  const existing = applications.find(application => application.email.toLowerCase() === data.email.toLowerCase());

  const application: DealerApplication = existing
    ? {
        ...existing,
        ...data,
        status: existing.status === 'approved' ? 'approved' : 'pending',
        appliedAt: existing.appliedAt,
      }
    : {
        id: `del_${Date.now()}`,
        ...data,
        status: 'pending',
        appliedAt: new Date().toISOString(),
      };

  const nextApplications = existing
    ? applications.map(item => item.id === application.id ? application : item)
    : [application, ...applications];

  saveApplications(nextApplications);
  return application;
}

export function approveDealerApplication(id: string): DealerApplication | null {
  const applications = loadApplications();
  const nextApplications = applications.map(application => {
    if (application.id !== id) {
      return application;
    }

    return {
      ...application,
      status: 'approved' as const,
      reviewedAt: new Date().toISOString(),
      reviewNotes: 'Approved from admin console',
    };
  });

  saveApplications(nextApplications);
  return nextApplications.find(application => application.id === id) || null;
}

export function rejectDealerApplication(id: string): DealerApplication | null {
  const applications = loadApplications();
  const nextApplications = applications.map(application => {
    if (application.id !== id) {
      return application;
    }

    return {
      ...application,
      status: 'rejected' as const,
      reviewedAt: new Date().toISOString(),
      reviewNotes: 'Rejected from admin console',
    };
  });

  saveApplications(nextApplications);
  return nextApplications.find(application => application.id === id) || null;
}