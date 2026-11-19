import {
  validateAdminApplication,
  getAccountRoute,
  EMPTY_ADMIN_DETAILS,
} from '../adminValidators';
import { getInitials, timeAgo, formatCount, describeAction } from '../adminFormat';

const file = { uri: 'file://a.jpg', name: 'a.jpg', size: 1000, mimeType: 'image/jpeg' };

const valid = {
  fullName: 'Thabo Mokoena',
  idNumber: '9001015800087',
  phone: '0821234567',
  organisation: 'University of Johannesburg',
  jobTitle: 'Systems administrator',
  reason: 'I manage the student systems and need to handle account issues.',
  idDocument: file,
  proofDocument: file,
};

describe('validateAdminApplication', () => {
  it('rejects an empty form', () => {
    const result = validateAdminApplication(EMPTY_ADMIN_DETAILS);
    expect(result.isValid).toBe(false);
    expect(Object.keys(result.errors)).toEqual(
      expect.arrayContaining(['fullName', 'idNumber', 'phone', 'reason', 'idDocument', 'proofDocument'])
    );
  });

  it('accepts a complete form', () => {
    expect(validateAdminApplication(valid).isValid).toBe(true);
  });

  it('rejects oversized files', () => {
    const big = { ...file, size: 20 * 1024 * 1024 };
    const result = validateAdminApplication({ ...valid, idDocument: big });
    expect(result.errors.idDocument).toBeDefined();
  });
});

describe('getAccountRoute', () => {
  it('defaults to user', () => {
    expect(getAccountRoute(null)).toBe('user');
    expect(getAccountRoute({ role: 'user', admin_status: 'none' })).toBe('user');
  });

  it('routes admins and disabled accounts', () => {
    expect(getAccountRoute({ role: 'admin', admin_status: 'approved' })).toBe('admin');
    expect(getAccountRoute({ role: 'admin', is_disabled: true })).toBe('disabled');
  });

  it('routes applications', () => {
    expect(getAccountRoute({ role: 'user', admin_status: 'awaiting_documents' })).toBe('application');
    expect(getAccountRoute({ role: 'user', admin_status: 'pending' })).toBe('pending');
    expect(getAccountRoute({ role: 'user', admin_status: 'rejected' })).toBe('rejected');
    expect(getAccountRoute({ role: 'user', admin_status: 'rejected' }, { reapply: true })).toBe('application');
    expect(getAccountRoute({ role: 'user', admin_status: 'pending' }, { continueAsUser: true })).toBe('user');
  });
});

describe('format helpers', () => {
  it('builds initials', () => {
    expect(getInitials('Thabo Mokoena')).toBe('TM');
    expect(getInitials('', 'sam@example.com')).toBe('SA');
  });

  it('formats counts', () => {
    expect(formatCount(950)).toBe('950');
    expect(formatCount(15400)).toBe('15.4K');
  });

  it('describes actions and time', () => {
    expect(describeAction({ action: 'disabled_account', admin_name: 'Amy', target_name: 'Bob' })).toBe(
      'Amy disabled Bob'
    );
    const now = new Date('2026-11-03T12:00:00Z');
    expect(timeAgo('2026-11-03T11:30:00Z', now)).toBe('30m ago');
  });
});
