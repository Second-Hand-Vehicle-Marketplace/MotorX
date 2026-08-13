import type { DealerApplication, DealerApplicationInput } from '../types/auth.types';
import { apiClient } from '../../../shared/services/apiClient';

export async function listDealerApplications(): Promise<DealerApplication[]> {
  const response = await apiClient.get<{ data: DealerApplication[] }>('/dealer/applications');
  return response.data.data ?? [];
}

export async function findDealerApplicationByEmail(email: string): Promise<DealerApplication | undefined> {
  const applications = await listDealerApplications();
  return applications.find((application) => application.email.toLowerCase() === email.toLowerCase());
}

export async function findDealerApplicationById(id: string): Promise<DealerApplication | undefined> {
  const applications = await listDealerApplications();
  return applications.find((application) => application.id === id);
}

export async function registerDealerApplication(data: DealerApplicationInput): Promise<DealerApplication> {
  const response = await apiClient.post<{ data: DealerApplication }>('/dealer/register', data as DealerApplicationInput & { idToken?: string });
  return response.data.data;
}

export async function approveDealerApplication(id: string): Promise<DealerApplication | null> {
  const response = await apiClient.patch<{ data: DealerApplication }>(`/dealer/applications/${id}/approve`);
  return response.data.data ?? null;
}

export async function rejectDealerApplication(id: string): Promise<DealerApplication | null> {
  const response = await apiClient.patch<{ data: DealerApplication }>(`/dealer/applications/${id}/reject`);
  return response.data.data ?? null;
}