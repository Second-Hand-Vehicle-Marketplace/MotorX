import type { DealerApplicationInput } from '../../auth/types/auth.types';

// Maps the dealer application form to the API payload. Shared by the new-account flow and by
// signed-in buyers applying (or correcting a rejected application) from their existing account.
export function toDealerApplicationPayload(data: Omit<DealerApplicationInput, 'password' | 'businessRegistration' | 'identityProof' | 'additionalDocument'>) {
  return {
    representativeName: data.applicantName,
    businessName: data.businessName,
    registrationNumber: data.businessLicense,
    phone: data.phone,
    address: data.address,
    city: data.city ?? '',
    province: data.province ?? '',
    businessPhone: data.businessContact ?? data.phone,
    businessEmail: data.businessEmail ?? data.email,
    website: data.website || undefined,
    dealershipType: data.dealershipType ?? 'both',
    brands: data.brandFocus ? data.brandFocus.split(',').map((brand) => brand.trim()).filter(Boolean) : [],
    description: data.businessDescription ?? '',
    inventoryCount: data.inventoryCount ? Number(data.inventoryCount) : undefined,
  };
}
