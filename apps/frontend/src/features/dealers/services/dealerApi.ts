import { apiClient } from '../../../shared/services/apiClient';
import { dealerListResponseSchema, dealerResponseSchema } from '../schemas/dealer.schema';
import type { CreateDealerApplicationInput, DealerApplication } from '../types/dealer.types';

export async function submitDealerApplication(input: CreateDealerApplicationInput): Promise<DealerApplication> {
  return dealerResponseSchema.parse((await apiClient.post('/dealers/applications', input)).data).data;
}
export async function getMyDealerApplication(): Promise<DealerApplication> {
  return dealerResponseSchema.parse((await apiClient.get('/dealers/me')).data).data;
}
export async function getPendingDealerApplications(): Promise<DealerApplication[]> {
  return dealerListResponseSchema.parse((await apiClient.get('/admin/dealer-applications')).data).data;
}
export async function approveDealerApplication(dealerId: string): Promise<DealerApplication> {
  return dealerResponseSchema.parse((await apiClient.patch(`/admin/dealer-applications/${dealerId}/approve`)).data).data;
}
export async function rejectDealerApplication(dealerId: string, reason: string): Promise<DealerApplication> {
  return dealerResponseSchema.parse((await apiClient.patch(`/admin/dealer-applications/${dealerId}/reject`, { reason })).data).data;
}
