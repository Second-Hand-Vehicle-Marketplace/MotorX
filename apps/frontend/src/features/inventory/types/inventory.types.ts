import type { VehicleCategory } from '@motorx/shared-contracts';

export type UploadJobStatus = 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';
export type ImageProcessingStatus = 'none' | 'pending' | 'processing' | 'completed' | 'completedWithErrors' | 'failed';

export interface UploadJob {
  id: string;
  dealerId: string;
  fileName: string;
  fileSize: number;
  category: VehicleCategory;
  status: UploadJobStatus;
  totalRecords: number;
  processedRecords: number;
  validRecords: number;
  rejectedRecords: number;
  duplicateRecords: number;
  failureReason: string | null;
  createdAt: string;
  completedAt: string | null;

  // Vehicle photos are a second, optional step: a zip (one folder per registration number)
  // uploaded once the CSV above has finished, matched against the listings it created.
  imageProcessingStatus: ImageProcessingStatus;
  imageZipFileName: string | null;
  imagesAttached: number;
  matchedListings: number;
  unmatchedFolders: string[];
  imageFailureReason: string | null;
  imageCompletedAt: string | null;
}

export type RejectedRecordReason = 'validation' | 'duplicate';

export interface RejectedRecord {
  id: string;
  uploadJobId: string;
  rowNumber: number;
  originalData: Record<string, unknown>;
  errors: string[];
  reason: RejectedRecordReason;
  createdAt: string;
}
