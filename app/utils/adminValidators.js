export const EMPTY_ADMIN_DETAILS = {
  fullName: '',
  idNumber: '',
  phone: '',
  organisation: '',
  jobTitle: '',
  reason: '',
  idDocument: null,
  proofDocument: null,
};

export const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;

export const validateAdminApplication = (details) => {
  const errors = {};
  const value = details || {};

  if (!String(value.fullName || '').trim() || String(value.fullName).trim().length < 3) {
    errors.fullName = 'Enter your full legal name';
  }

  if (String(value.idNumber || '').replace(/\s/g, '').length < 6) {
    errors.idNumber = 'Enter a valid ID or passport number';
  }

  if (String(value.phone || '').replace(/\D/g, '').length < 7) {
    errors.phone = 'Enter a valid phone number';
  }

  if (!String(value.organisation || '').trim()) {
    errors.organisation = 'Enter your organisation';
  }

  if (!String(value.jobTitle || '').trim()) {
    errors.jobTitle = 'Enter your job title or role';
  }

  if (String(value.reason || '').trim().length < 30) {
    errors.reason = 'Please explain in at least 30 characters why you need admin access';
  }

  if (!value.idDocument) {
    errors.idDocument = 'Upload a clear photo of your ID document';
  } else if (value.idDocument.size && value.idDocument.size > MAX_DOCUMENT_BYTES) {
    errors.idDocument = 'This file is larger than 8 MB';
  }

  if (!value.proofDocument) {
    errors.proofDocument = 'Upload proof of your role, such as an employment letter';
  } else if (value.proofDocument.size && value.proofDocument.size > MAX_DOCUMENT_BYTES) {
    errors.proofDocument = 'This file is larger than 8 MB';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getAccountRoute = (profile, flags = {}) => {
  if (!profile) {
    return 'user';
  }

  if (profile.is_disabled) {
    return 'disabled';
  }

  if (profile.role === 'admin') {
    return 'admin';
  }

  const status = profile.admin_status;

  if (status === 'awaiting_documents') {
    return flags.continueAsUser ? 'user' : 'application';
  }

  if (status === 'pending') {
    return flags.continueAsUser ? 'user' : 'pending';
  }

  if (status === 'rejected') {
    if (flags.reapply) {
      return 'application';
    }
    return flags.continueAsUser ? 'user' : 'rejected';
  }

  return 'user';
};
