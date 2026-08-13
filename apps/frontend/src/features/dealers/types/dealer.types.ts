export type DealerApplicationStatus = 'pending' | 'approved' | 'rejected';
export interface DealerApplication {
  id: string; userId: string; businessName: string; registrationNumber: string;
  phone: string; address: string; status: DealerApplicationStatus;
  rejectionReason: string | null; reviewedBy: string | null; reviewedAt: string | null;
  createdAt: string; updatedAt: string;
}
export interface CreateDealerApplicationInput {
  businessName: string; registrationNumber: string; phone: string; address: string;
}
