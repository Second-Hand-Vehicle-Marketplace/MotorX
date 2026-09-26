import { Types } from 'mongoose';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ claim: vi.fn(), sent: vi.fn(), retry: vi.fn(), failed: vi.fn(), sendMail: vi.fn(), findUser: vi.fn() }));

vi.mock('../config/mailer.js', () => ({ mailer: { sendMail: mocks.sendMail }, mailerConfig: { from: 'MotorX <noreply@motorx.test>' } }));
vi.mock('../repositories/authUser.repository.js', () => ({ findAuthUserById: mocks.findUser }));
vi.mock('../repositories/notification.repository.js', () => ({ claimNextDueEmail: mocks.claim, markEmailSent: mocks.sent, scheduleEmailRetry: mocks.retry, markEmailFailed: mocks.failed }));

import { runEmailOutbox } from './emailOutbox.job.js';

const now = new Date('2026-09-25T10:00:00Z');
const notification = (emailAttempts: number) => ({ _id: new Types.ObjectId(), userId: new Types.ObjectId(), title: 'Listing removed', message: 'Your listing was removed.', details: { vehicle: '2020 Toyota Corolla' }, emailAttempts });

describe('email outbox', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    mocks.findUser.mockResolvedValue({ email: 'dealer@example.com' });
  });

  it('sends each due email once and marks it sent', async () => {
    const first = notification(1);
    mocks.claim.mockResolvedValueOnce(first).mockResolvedValueOnce(null);
    mocks.sendMail.mockResolvedValue({});

    const result = await runEmailOutbox(() => now);

    expect(result).toEqual({ sent: 1, retried: 0, failed: 0 });
    expect(mocks.sendMail).toHaveBeenCalledWith(expect.objectContaining({ to: 'dealer@example.com', subject: 'MotorX | Listing removed', text: expect.stringContaining('Vehicle: 2020 Toyota Corolla') }));
    expect(mocks.sent).toHaveBeenCalledWith(first._id);
  });

  it.each([[1, 60_000], [2, 5 * 60_000], [4, 2 * 60 * 60_000]])('after failed attempt %i it retries %i ms later', async (attempts, delay) => {
    const item = notification(attempts);
    mocks.claim.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    mocks.sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    const result = await runEmailOutbox(() => now);

    expect(result).toEqual({ sent: 0, retried: 1, failed: 0 });
    expect(mocks.retry).toHaveBeenCalledWith(item._id, new Date(now.getTime() + delay), 'SMTP unavailable');
  });

  it('gives up after the fifth failed attempt and marks the email failed', async () => {
    const item = notification(5);
    mocks.claim.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    mocks.sendMail.mockRejectedValue(new Error('SMTP unavailable'));

    expect(await runEmailOutbox(() => now)).toEqual({ sent: 0, retried: 0, failed: 1 });
    expect(mocks.failed).toHaveBeenCalledWith(item._id, 'SMTP unavailable');
  });

  it('marks an email failed at once when the recipient account no longer exists', async () => {
    const item = notification(1);
    mocks.claim.mockResolvedValueOnce(item).mockResolvedValueOnce(null);
    mocks.findUser.mockResolvedValue(null);

    await runEmailOutbox(() => now);

    expect(mocks.sendMail).not.toHaveBeenCalled();
    expect(mocks.failed).toHaveBeenCalledWith(item._id, expect.stringContaining('not found'));
  });

  it('processes a bounded number of emails per cycle', async () => {
    mocks.claim.mockImplementation(async () => notification(1));
    mocks.sendMail.mockResolvedValue({});

    const result = await runEmailOutbox(() => now);

    expect(result.sent).toBe(25);
  });
});
