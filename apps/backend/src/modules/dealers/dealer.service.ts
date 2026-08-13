import { sendMail } from '../../config/mailer.js';
import type { DealerApplicationModel, DealerStatus } from './dealer.model.js';
import { DealerApplicationModel as DealerApplicationCollection, type DealerApplicationDocument } from './dealer-application.model.js';

function toDomain(document: DealerApplicationDocument | null): DealerApplicationModel | null {
  if (!document) {
    return null;
  }

  return {
    id: String(document._id),
    firebaseUid: document.firebaseUid ?? undefined,
    applicantName: document.applicantName,
    email: document.email,
    businessName: document.businessName,
    businessLicense: document.businessLicense,
    phone: document.phone,
    address: document.address,
    status: document.status,
    appliedAt: document.appliedAt.toISOString(),
    reviewedAt: document.reviewedAt?.toISOString(),
    reviewNotes: document.reviewNotes ?? undefined,
  };
}

export const dealerService = {
  listApplications: async (): Promise<DealerApplicationModel[]> => {
    const applications = await DealerApplicationCollection.find().sort({ appliedAt: -1 }).lean();
    return applications.map((application) => ({
      id: String(application._id),
      firebaseUid: application.firebaseUid ?? undefined,
      applicantName: application.applicantName,
      email: application.email,
      businessName: application.businessName,
      businessLicense: application.businessLicense,
      phone: application.phone,
      address: application.address,
      status: application.status,
      appliedAt: new Date(application.appliedAt).toISOString(),
      reviewedAt: application.reviewedAt ? new Date(application.reviewedAt).toISOString() : undefined,
      reviewNotes: application.reviewNotes ?? undefined,
    }));
  },

  findApplicationByEmail: async (email: string): Promise<DealerApplicationModel | null> => {
    const application = await DealerApplicationCollection.findOne({ email: email.toLowerCase() });
    return toDomain(application);
  },

  findApplicationById: async (id: string): Promise<DealerApplicationModel | null> => {
    const application = await DealerApplicationCollection.findById(id);
    return toDomain(application);
  },

  createApplication: async (
    payload: Omit<DealerApplicationModel, 'id' | 'status' | 'appliedAt' | 'reviewedAt' | 'reviewNotes'>,
  ): Promise<DealerApplicationModel> => {
    const existing = await DealerApplicationCollection.findOne({ email: payload.email.toLowerCase() });

    const nextStatus: DealerStatus = existing?.status === 'approved' ? 'approved' : 'pending';
    const updated = await DealerApplicationCollection.findOneAndUpdate(
      { email: payload.email.toLowerCase() },
      {
        $set: {
          firebaseUid: payload.firebaseUid,
          applicantName: payload.applicantName,
          email: payload.email.toLowerCase(),
          businessName: payload.businessName,
          businessLicense: payload.businessLicense,
          phone: payload.phone,
          address: payload.address,
          status: nextStatus,
          reviewNotes: undefined,
          reviewedAt: undefined,
        },
        $setOnInsert: {
          appliedAt: new Date(),
        },
      },
      { upsert: true, new: true },
    );

    const app = toDomain(updated);
    if (!app) {
      throw new Error('Failed to persist dealer application.');
    }

    void sendMail({
      to: app.email,
      subject: 'MotorX dealer registration received',
      text: `Hello ${app.applicantName}, your dealership registration for ${app.businessName} was received and is pending admin approval.`,
      html: `<p>Hello ${app.applicantName},</p><p>Your registration for <strong>${app.businessName}</strong> has been received and is pending admin approval.</p>`,
    });

    return app;
  },

  updateStatus: async (id: string, status: DealerStatus): Promise<DealerApplicationModel | null> => {
    const application = await DealerApplicationCollection.findByIdAndUpdate(
      id,
      {
        $set: {
          status,
          reviewedAt: new Date(),
          reviewNotes: status === 'approved' ? 'Approved from admin console' : 'Rejected from admin console',
        },
      },
      { new: true },
    );

    const normalized = toDomain(application);
    if (!normalized) {
      return null;
    }

    if (status === 'approved') {
      void sendMail({
        to: normalized.email,
        subject: 'MotorX dealer approval confirmed',
        text: `Congratulations ${normalized.applicantName}, your dealership ${normalized.businessName} has been approved and you can now sign in to the dealer portal.`,
        html: `<p>Congratulations ${normalized.applicantName},</p><p>Your dealership <strong>${normalized.businessName}</strong> has been approved and you can now sign in to the dealer portal.</p>`,
      });
    }

    return normalized;
  },
};
