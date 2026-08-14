import { apiClient } from '../../../shared/services/apiClient';
import { dealerListResponseSchema, dealerResponseSchema } from '../schemas/dealer.schema';
import type { CreateDealerApplicationInput, DealerApplication } from '../types/dealer.types';

export async function submitDealerApplication(input: CreateDealerApplicationInput, documents: {
  businessRegistration: File;
  identityProof: File;
  additionalDocument?: File;
}): Promise<DealerApplication> {
  const form = new FormData();
  Object.entries(input).forEach(([key, value]) => {
    if (value !== undefined) form.append(key, Array.isArray(value) ? value.join(',') : String(value));
  });
  form.append('businessRegistration', documents.businessRegistration);
  form.append('identityProof', documents.identityProof);
  if (documents.additionalDocument) form.append('additionalDocument', documents.additionalDocument);
  return dealerResponseSchema.parse((await apiClient.post('/dealers/applications', form)).data).data;
}
export const getDealerDocumentUrl = (dealerId: string, documentIndex: number) =>
  `/admin/dealer-applications/${dealerId}/documents/${documentIndex}`;
export async function openDealerDocument(dealerId: string, documentIndex: number): Promise<void> {
  const tab = window.open('', '_blank');
  try {
    const response = await apiClient.get(getDealerDocumentUrl(dealerId, documentIndex), { responseType: 'blob' });
    const url = URL.createObjectURL(response.data as Blob);
    if (tab) tab.location.href = url;
    else window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    tab?.close();
    throw error;
  }
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
