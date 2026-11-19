import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../../utils/colors';
import { Input } from '../common';
import { MAX_DOCUMENT_BYTES } from '../../utils/adminValidators';

const formatSize = (bytes) => {
  if (!bytes) {
    return '';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isImage = (file) =>
  String(file?.mimeType || '').startsWith('image/') ||
  /\.(jpg|jpeg|png|heic|webp)$/i.test(String(file?.name || ''));

const DocumentField = ({ label, hint, file, onChange, error }) => {
  const acceptFile = (picked) => {
    if (picked.size && picked.size > MAX_DOCUMENT_BYTES) {
      Alert.alert('File too large', 'Please choose a file smaller than 8 MB.');
      return;
    }

    onChange(picked);
  };

  const chooseFile = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Photo access needed', 'Allow photo access or take a photo instead.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      acceptFile({
        uri: asset.uri,
        name: asset.fileName || `document-${Date.now()}.jpg`,
        size: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Could not open photos', 'Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Camera permission needed', 'Allow camera access or choose a file instead.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      acceptFile({
        uri: asset.uri,
        name: asset.fileName || `photo-${Date.now()}.jpg`,
        size: asset.fileSize,
        mimeType: asset.mimeType || 'image/jpeg',
      });
    } catch (e) {
      Alert.alert('Could not open camera', 'Please try again.');
    }
  };

  return (
    <View style={styles.docWrap}>
      <Text style={styles.docLabel}>{label}</Text>
      {hint ? <Text style={styles.docHint}>{hint}</Text> : null}

      {file ? (
        <View style={styles.fileCard}>
          {isImage(file) ? (
            <Image source={{ uri: file.uri }} style={styles.thumb} />
          ) : (
            <View style={[styles.thumb, styles.thumbPdf]}>
              <Text style={styles.thumbPdfText}>PDF</Text>
            </View>
          )}
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {file.name}
            </Text>
            <Text style={styles.fileSize}>{formatSize(file.size)}</Text>
          </View>
          <TouchableOpacity onPress={() => onChange(null)} style={styles.removeButton}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.pickRow}>
          <TouchableOpacity style={styles.pickButton} onPress={chooseFile} activeOpacity={0.85}>
            <Text style={styles.pickText}>Choose photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickButton} onPress={takePhoto} activeOpacity={0.85}>
            <Text style={styles.pickText}>Take photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
};

export const AdminApplicationForm = ({ value, onChange, errors = {} }) => {
  const update = (field) => (next) => onChange({ ...value, [field]: next });

  return (
    <View style={styles.container}>
      <View style={styles.banner}>
        <Text style={styles.bannerIcon}>🛡️</Text>
        <View style={styles.bannerBody}>
          <Text style={styles.bannerTitle}>Admin verification</Text>
          <Text style={styles.bannerText}>
            Administrators can manage accounts, so every request is reviewed by an existing admin.
            Your documents are stored privately and only admins can view them.
          </Text>
        </View>
      </View>

      <Input
        label="Full legal name"
        icon="🪪"
        placeholder="As shown on your ID"
        value={value.fullName}
        onChangeText={update('fullName')}
        autoCapitalize="words"
        error={errors.fullName}
      />
      <Input
        label="ID or passport number"
        icon="🔢"
        placeholder="Enter your ID number"
        value={value.idNumber}
        onChangeText={update('idNumber')}
        error={errors.idNumber}
      />
      <Input
        label="Phone number"
        icon="📞"
        placeholder="e.g. 082 123 4567"
        value={value.phone}
        onChangeText={update('phone')}
        keyboardType="phone-pad"
        error={errors.phone}
      />
      <Input
        label="Organisation"
        icon="🏢"
        placeholder="Where do you work or study?"
        value={value.organisation}
        onChangeText={update('organisation')}
        autoCapitalize="words"
        error={errors.organisation}
      />
      <Input
        label="Job title or role"
        icon="💼"
        placeholder="e.g. Systems administrator"
        value={value.jobTitle}
        onChangeText={update('jobTitle')}
        autoCapitalize="words"
        error={errors.jobTitle}
      />
      <Input
        label="Why do you need admin access?"
        icon="📝"
        placeholder="Explain your responsibilities and why you should be trusted with admin access"
        value={value.reason}
        onChangeText={update('reason')}
        autoCapitalize="sentences"
        multiline
        numberOfLines={4}
        error={errors.reason}
      />

      <DocumentField
        label="Government ID document"
        hint="A clear photo of your ID card, passport or driver's licence."
        file={value.idDocument}
        onChange={update('idDocument')}
        error={errors.idDocument}
      />
      <DocumentField
        label="Proof of role"
        hint="An employment letter, student or staff card, or appointment letter."
        file={value.proofDocument}
        onChange={update('proofDocument')}
        error={errors.proofDocument}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  banner: {
    flexDirection: 'row',
    backgroundColor: COLORS.gray50,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  bannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bannerBody: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.gray600,
  },
  docWrap: {
    marginBottom: 18,
  },
  docLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray800,
    marginBottom: 2,
  },
  docHint: {
    fontSize: 12,
    color: COLORS.gray500,
    marginBottom: 8,
  },
  pickRow: {
    flexDirection: 'row',
  },
  pickButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    backgroundColor: COLORS.gray50,
  },
  pickText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    backgroundColor: COLORS.white,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: COLORS.gray100,
  },
  thumbPdf: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.errorLight,
  },
  thumbPdfText: {
    color: COLORS.errorDark,
    fontWeight: '800',
    fontSize: 12,
  },
  fileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  fileName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  fileSize: {
    fontSize: 12,
    color: COLORS.gray500,
    marginTop: 2,
  },
  removeButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  removeText: {
    color: COLORS.error,
    fontWeight: '700',
    fontSize: 13,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 6,
  },
});

export default AdminApplicationForm;
