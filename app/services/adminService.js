import { supabase } from './supabaseService';

const DOCUMENT_BUCKET = 'admin-documents';

const run = async (task) => {
  try {
    const data = await task();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error?.message || String(error) };
  }
};

const callRpc = (name, args) =>
  run(async () => {
    const { data, error } = await supabase.rpc(name, args);
    if (error) throw error;
    return data;
  });

const getExtension = (file) => {
  const fromName = String(file?.name || '').split('.').pop();
  if (fromName && fromName.length <= 5 && fromName !== file?.name) {
    return fromName.toLowerCase();
  }
  const mime = String(file?.mimeType || '');
  if (mime.includes('pdf')) return 'pdf';
  if (mime.includes('png')) return 'png';
  return 'jpg';
};

const getContentType = (file, extension) => {
  if (file?.mimeType) return file.mimeType;
  if (extension === 'pdf') return 'application/pdf';
  if (extension === 'png') return 'image/png';
  return 'image/jpeg';
};

export const adminService = {
  signUpWithRole: (email, password, fullName, requestedRole) =>
    run(async () => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            requested_role: requestedRole,
          },
        },
      });
      if (error) throw error;
      return data;
    }),

  uploadDocument: (userId, kind, file) =>
    run(async () => {
      const extension = getExtension(file);
      const path = `${userId}/${kind}-${Date.now()}.${extension}`;
      const response = await fetch(file.uri);
      const body = await response.arrayBuffer();
      const { error } = await supabase.storage.from(DOCUMENT_BUCKET).upload(path, body, {
        contentType: getContentType(file, extension),
        upsert: true,
      });
      if (error) throw error;
      return path;
    }),

  submitApplication: async (userId, details) => {
    const idUpload = await adminService.uploadDocument(userId, 'id', details.idDocument);
    if (!idUpload.success) return idUpload;

    const proofUpload = await adminService.uploadDocument(userId, 'proof', details.proofDocument);
    if (!proofUpload.success) return proofUpload;

    return callRpc('submit_admin_application', {
      p_full_name: details.fullName.trim(),
      p_id_number: details.idNumber.trim(),
      p_phone: details.phone.trim(),
      p_organisation: details.organisation.trim(),
      p_job_title: details.jobTitle.trim(),
      p_reason: details.reason.trim(),
      p_id_path: idUpload.data,
      p_proof_path: proofUpload.data,
    });
  },

  getSignedDocumentUrl: (path) =>
    run(async () => {
      const { data, error } = await supabase.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(path, 600);
      if (error) throw error;
      return data.signedUrl;
    }),

  getDashboardStats: () => callRpc('admin_dashboard_stats'),

  listUsers: ({ search = '', filter = 'all', limit = 20, offset = 0 } = {}) =>
    callRpc('admin_list_users', {
      p_search: search,
      p_filter: filter,
      p_limit: limit,
      p_offset: offset,
    }),

  getUser: (userId) => callRpc('admin_get_user', { p_user_id: userId }),

  setUserDisabled: (userId, disabled, reason) =>
    callRpc('admin_set_user_disabled', {
      p_user_id: userId,
      p_disabled: disabled,
      p_reason: reason || null,
    }),

  listApplications: (status = 'pending') =>
    callRpc('admin_list_applications', { p_status: status }),

  reviewApplication: (applicationId, approve, note) =>
    callRpc('admin_review_application', {
      p_application_id: applicationId,
      p_approve: approve,
      p_note: note || null,
    }),

  getRecentActivity: (limit = 8) =>
    callRpc('admin_recent_activity', { p_limit: limit }),
};
