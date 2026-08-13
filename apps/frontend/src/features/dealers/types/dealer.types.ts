import type {
  CreateDealerApplicationInput as SharedCreateDealerApplicationInput,
  DealerApplicationDto,
  DealerApplicationStatus as SharedDealerApplicationStatus,
} from '@motorx/shared-contracts';

export type DealerApplicationStatus = SharedDealerApplicationStatus;
export type DealerApplication = DealerApplicationDto;
export type CreateDealerApplicationInput = SharedCreateDealerApplicationInput;
