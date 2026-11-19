import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { ADMIN } from '../../utils/adminTheme';
import {
  Avatar,
  Pill,
  SectionCard,
  InfoRow,
  ActionButton,
  ReasonModal,
} from '../../components/admin/AdminUI';
import { adminService } from '../../services/adminService';
import { formatDateTime } from '../../utils/adminFormat';

const isPdf = (path) => /\.pdf$/i.test(String(path || ''));

const DocumentPreview = ({ title, path }) => {
  const [url, setUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const result = await adminService.getSignedDocumentUrl(path);

      if (cancelled) {
        return;
      }

      if (result.success) {
        setUrl(result.data);
      } else {
        setFailed(true);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [path]);

  const open = () => {
    if (url) {
      Linking.openURL(url).catch(() => Alert.alert('Could not open the document'));
    }
  };

  return (
    <View style={styles.doc}>
      <Text style={styles.docTitle}>{title}</Text>

      {failed ? (
        <Text style={styles.docError}>This document could not be loaded.</Text>
      ) : !url ? (
        <ActivityIndicator color={ADMIN.accentLight} style={styles.docLoader} />
      ) : isPdf(path) ? (
        <TouchableOpacity style={styles.pdfCard} onPress={open} activeOpacity={0.85}>
          <Text style={styles.pdfIcon}>📄</Text>
          <Text style={styles.pdfText}>Open PDF document</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={open} activeOpacity={0.9}>
          <Image source={{ uri: url }} style={styles.docImage} resizeMode="contain" />
          <Text style={styles.docHint}>Tap to open full size</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const AdminApplicationDetailScreen = ({ route, navigation }) => {
  const { application } = route.params;
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);

  const isPending = application.status === 'pending';

  const review = async (approve, note) => {
    setSaving(true);
    const result = await adminService.reviewApplication(application.id, approve, note);
    setSaving(false);
    setModal(null);

    if (!result.success) {
      Alert.alert('Action failed', result.error || 'Please try again.');
      return;
    }

    Alert.alert(
      approve ? 'Admin approved' : 'Request rejected',
      approve
        ? `${application.full_name} now has access to the admin console.`
        : `${application.full_name} will see the decision the next time the app checks their status.`,
      [{ text: 'Done', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Avatar name={application.full_name} email={application.email} size={64} color={ADMIN.amber} />
          <Text style={styles.name}>{application.full_name}</Text>
          <Text style={styles.email}>{application.email}</Text>
          <Pill
            label={application.status.toUpperCase()}
            tone={
              application.status === 'approved'
                ? 'green'
                : application.status === 'rejected'
                ? 'red'
                : 'amber'
            }
          />
        </View>

        <SectionCard title="Applicant details">
          <InfoRow label="ID number" value={application.id_number} />
          <InfoRow label="Phone" value={application.phone} />
          <InfoRow label="Organisation" value={application.organisation} />
          <InfoRow label="Role" value={application.job_title} />
          <InfoRow label="Submitted" value={formatDateTime(application.created_at)} />
          {application.reviewed_at ? (
            <InfoRow label="Reviewed" value={formatDateTime(application.reviewed_at)} />
          ) : null}
        </SectionCard>

        <SectionCard title="Reason for admin access">
          <Text style={styles.reason}>{application.reason}</Text>
        </SectionCard>

        {application.review_note ? (
          <SectionCard title="Reviewer note">
            <Text style={styles.reason}>{application.review_note}</Text>
          </SectionCard>
        ) : null}

        <SectionCard title="Submitted documents">
          <DocumentPreview title="Government ID" path={application.id_document_path} />
          <DocumentPreview title="Proof of role" path={application.proof_document_path} />
        </SectionCard>

        {isPending ? (
          <View style={styles.actions}>
            <ActionButton
              title="Reject"
              tone="danger"
              onPress={() => setModal('reject')}
              style={styles.actionButton}
            />
            <ActionButton
              title="Approve"
              tone="success"
              onPress={() => setModal('approve')}
              style={styles.actionButton}
            />
          </View>
        ) : null}
      </ScrollView>

      <ReasonModal
        visible={modal === 'reject'}
        title="Reject this request?"
        message="Tell the applicant why, so they can apply again with the right documents."
        placeholder="Reason (required)"
        confirmLabel="Reject"
        tone="danger"
        required
        loading={saving}
        onCancel={() => setModal(null)}
        onConfirm={(note) => review(false, note)}
      />

      <ReasonModal
        visible={modal === 'approve'}
        title="Approve as administrator?"
        message="Make sure the ID and proof of role match the applicant. Admins can disable accounts and see user data."
        placeholder="Optional note"
        confirmLabel="Approve"
        tone="success"
        loading={saving}
        onCancel={() => setModal(null)}
        onConfirm={(note) => review(true, note)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ADMIN.bg,
  },
  content: {
    padding: 16,
    paddingBottom: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 18,
  },
  name: {
    color: ADMIN.text,
    fontSize: 22,
    fontWeight: '800',
    marginTop: 12,
  },
  email: {
    color: ADMIN.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: 10,
  },
  reason: {
    color: ADMIN.text,
    fontSize: 14,
    lineHeight: 21,
  },
  doc: {
    marginBottom: 18,
  },
  docTitle: {
    color: ADMIN.textMuted,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  docImage: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    backgroundColor: ADMIN.bgSoft,
  },
  docHint: {
    color: ADMIN.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
  docLoader: {
    marginVertical: 40,
  },
  docError: {
    color: ADMIN.red,
    fontSize: 13,
  },
  pdfCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    backgroundColor: ADMIN.bgSoft,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  pdfIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  pdfText: {
    color: ADMIN.accentLight,
    fontWeight: '800',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});

export default AdminApplicationDetailScreen;
