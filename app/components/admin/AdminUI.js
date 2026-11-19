import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ADMIN } from '../../utils/adminTheme';
import { getInitials } from '../../utils/adminFormat';

export const Avatar = ({ name, email, size = 44, color = ADMIN.accent }) => (
  <View
    style={[
      uiStyles.avatar,
      { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
    ]}
  >
    <Text style={[uiStyles.avatarText, { fontSize: size * 0.36 }]}>
      {getInitials(name, email)}
    </Text>
  </View>
);

export const Pill = ({ label, tone = 'neutral' }) => {
  const palette = {
    neutral: { bg: 'rgba(148,163,184,0.16)', fg: ADMIN.textMuted },
    green: { bg: 'rgba(52,211,153,0.16)', fg: ADMIN.green },
    red: { bg: 'rgba(248,113,113,0.16)', fg: ADMIN.red },
    amber: { bg: 'rgba(251,191,36,0.16)', fg: ADMIN.amber },
    indigo: { bg: 'rgba(129,140,248,0.2)', fg: ADMIN.accentLight },
    cyan: { bg: 'rgba(34,211,238,0.16)', fg: ADMIN.cyan },
  }[tone];

  return (
    <View style={[uiStyles.pill, { backgroundColor: palette.bg }]}>
      <Text style={[uiStyles.pillText, { color: palette.fg }]}>{label}</Text>
    </View>
  );
};

export const StatCard = ({ label, value, hint, accent = ADMIN.accent, icon, onPress, wide }) => {
  const Wrapper = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      style={[uiStyles.stat, wide && uiStyles.statWide]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={[uiStyles.statAccent, { backgroundColor: accent }]} />
      <View style={uiStyles.statTop}>
        <Text style={uiStyles.statLabel}>{label}</Text>
        {icon ? <Text style={uiStyles.statIcon}>{icon}</Text> : null}
      </View>
      <Text style={uiStyles.statValue}>{value}</Text>
      {hint ? <Text style={uiStyles.statHint}>{hint}</Text> : null}
    </Wrapper>
  );
};

export const SectionCard = ({ title, right, children, style }) => (
  <View style={[uiStyles.section, style]}>
    {title ? (
      <View style={uiStyles.sectionHeader}>
        <Text style={uiStyles.sectionTitle}>{title}</Text>
        {right}
      </View>
    ) : null}
    {children}
  </View>
);

export const InfoRow = ({ label, value, tone }) => (
  <View style={uiStyles.infoRow}>
    <Text style={uiStyles.infoLabel}>{label}</Text>
    <Text
      style={[
        uiStyles.infoValue,
        tone === 'red' && { color: ADMIN.red },
        tone === 'green' && { color: ADMIN.green },
      ]}
    >
      {value}
    </Text>
  </View>
);

export const ActionButton = ({ title, onPress, tone = 'primary', loading, disabled, style }) => {
  const background = {
    primary: ADMIN.accent,
    danger: ADMIN.red,
    success: ADMIN.green,
    ghost: 'transparent',
  }[tone];

  const textColor = tone === 'ghost' ? ADMIN.textMuted : tone === 'success' ? '#052E16' : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        uiStyles.button,
        { backgroundColor: background },
        tone === 'ghost' && uiStyles.buttonGhost,
        (disabled || loading) && { opacity: 0.55 },
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[uiStyles.buttonText, { color: textColor }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export const EmptyState = ({ icon, title, body }) => (
  <View style={uiStyles.empty}>
    <Text style={uiStyles.emptyIcon}>{icon}</Text>
    <Text style={uiStyles.emptyTitle}>{title}</Text>
    {body ? <Text style={uiStyles.emptyBody}>{body}</Text> : null}
  </View>
);

export const ReasonModal = ({
  visible,
  title,
  message,
  placeholder,
  confirmLabel,
  tone = 'primary',
  required = false,
  loading = false,
  onCancel,
  onConfirm,
}) => {
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) {
      setText('');
    }
  }, [visible]);

  const canConfirm = !required || text.trim().length >= 3;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={uiStyles.modalBackdrop}
      >
        <View style={uiStyles.modalCard}>
          <Text style={uiStyles.modalTitle}>{title}</Text>
          {message ? <Text style={uiStyles.modalMessage}>{message}</Text> : null}

          <TextInput
            style={uiStyles.modalInput}
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor={ADMIN.textDim}
            multiline
            maxLength={300}
          />

          <View style={uiStyles.modalActions}>
            <ActionButton title="Cancel" tone="ghost" onPress={onCancel} style={uiStyles.modalButton} />
            <ActionButton
              title={confirmLabel}
              tone={tone}
              onPress={() => onConfirm(text.trim())}
              disabled={!canConfirm}
              loading={loading}
              style={uiStyles.modalButton}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const uiStyles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  pillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  stat: {
    width: '48%',
    backgroundColor: ADMIN.card,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: ADMIN.border,
    overflow: 'hidden',
  },
  statWide: {
    width: '100%',
  },
  statAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    color: ADMIN.textMuted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  statIcon: {
    fontSize: 18,
  },
  statValue: {
    color: ADMIN.text,
    fontSize: 30,
    fontWeight: '800',
    marginTop: 8,
  },
  statHint: {
    color: ADMIN.textDim,
    fontSize: 12,
    marginTop: 2,
  },
  section: {
    backgroundColor: ADMIN.card,
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: ADMIN.text,
    fontSize: 16,
    fontWeight: '800',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ADMIN.border,
  },
  infoLabel: {
    color: ADMIN.textMuted,
    fontSize: 13,
    flex: 1,
  },
  infoValue: {
    color: ADMIN.text,
    fontSize: 13,
    fontWeight: '700',
    flex: 2,
    textAlign: 'right',
  },
  button: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  buttonGhost: {
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  emptyTitle: {
    color: ADMIN.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptyBody: {
    color: ADMIN.textMuted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2,6,23,0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: ADMIN.card,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: ADMIN.border,
  },
  modalTitle: {
    color: ADMIN.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  modalMessage: {
    color: ADMIN.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  modalInput: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: ADMIN.border,
    backgroundColor: ADMIN.bgSoft,
    color: ADMIN.text,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
