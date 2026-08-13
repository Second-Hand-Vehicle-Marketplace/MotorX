export type DealerStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface DealerApplicationModel {
  id: string;
  firebaseUid?: string;
  applicantName: string;
  email: string;
  password?: string;
  businessName: string;
  businessLicense: string;
  phone: string;
  address: string;
  status: DealerStatus;
  appliedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export interface DealerProfileModel {
  id: string;
  userId: string;
  businessName: string;
  contactPhone: string;
  address: string;
  status: DealerStatus;
  approvedAt?: string;
  totalListings: number;
}
