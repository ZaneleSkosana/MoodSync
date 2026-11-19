import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../utils/colors';
import { useUserStore } from '../../store/userStore';
import { useSubscriptionStore } from '../../store/subscriptionStore';
import { stripeService } from '../../services/stripeService';
import {
  SIMULATED_PAYMENTS,
  formatMoney,
  addDays,
  getBillingPeriodDays,
  formatLongDate,
} from '../../utils/plans';

const formatCardNumber = (text) =>
  text
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(.{4})/g, '$1 ')
    .trim();

const formatExpiry = (text) => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) {
    return digits;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
};

const validateCard = (form) => {
  const errors = {};
  const digits = form.cardNumber.replace(/\s/g, '');

  if (digits.length < 13 || digits.length > 19) {
    errors.cardNumber = 'Enter a valid card number.';
  }

  const match = /^(\d{2})\/(\d{2})$/.exec(form.expiryDate);
  if (!match) {
    errors.expiryDate = 'Use the format MM/YY.';
  } else {
    const month = Number(match[1]);
    const year = 2000 + Number(match[2]);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);
    if (month < 1 || month > 12) {
      errors.expiryDate = 'Month must be between 01 and 12.';
    } else if (endOfMonth.getTime() < Date.now()) {
      errors.expiryDate = 'This card has expired.';
    }
  }

  if (!/^\d{3,4}$/.test(form.cvv)) {
    errors.cvv = 'Enter the 3 or 4 digit code.';
  }

  if (form.cardholderName.trim().length < 2) {
    errors.cardholderName = 'Enter the name on the card.';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};

const PaymentScreen = ({ route, navigation }) => {
  const plan = route.params?.plan;
  const { user } = useUserStore();
  const upgradeSubscription = useSubscriptionStore((state) => state.upgradeSubscription);
  const addPaymentHistory = useSubscriptionStore((state) => state.addPaymentHistory);

  const [form, setForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  const onChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!plan) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingText}>No plan selected.</Text>
        <TouchableOpacity style={styles.missingButton} onPress={() => navigation.goBack()}>
          <Text style={styles.missingButtonText}>Back to plans</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isYearly = plan.duration === 'Yearly';
  const renewsOn = addDays(new Date(), getBillingPeriodDays(plan.duration));

  const handlePay = async () => {
    const validation = validateCard(form);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setProcessing(true);

    try {
      const last4 = form.cardNumber.replace(/\s/g, '').slice(-4);
      const paymentMethod = `card_ending_${last4}`;

      const result = await stripeService.processPayment(
        user?.id,
        plan.price,
        paymentMethod,
        plan
      );

      if (!result.success && !SIMULATED_PAYMENTS) {
        Alert.alert('Payment failed', 'We could not complete your payment. Please check your details and try again.');
        return;
      }

      if (!result.success) {
        console.log('Subscription record not saved:', result.error);
      }

      const record = Array.isArray(result.data?.subscription)
        ? result.data.subscription[0]
        : result.data?.subscription;

      const reference = result.data?.payment?.id || `ref_${Date.now()}`;

      upgradeSubscription(plan.name, {
        id: record?.id || null,
        duration: plan.duration,
        price: plan.price,
        startDate: new Date().toISOString(),
        nextBillingDate: renewsOn.toISOString(),
      });

      addPaymentHistory({
        id: reference,
        plan: plan.name,
        amount: plan.price,
        date: new Date().toISOString(),
        status: 'succeeded',
      });

      navigation.replace('SubscriptionSuccess', {
        plan,
        reference,
        last4,
        renewsOn: renewsOn.toISOString(),
      });
    } catch (error) {
      console.log('Payment error:', error?.message || error);
      Alert.alert('Payment failed', 'Something went wrong. You have not been charged. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summary}>
          <Text style={styles.summaryHeading}>Order summary</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>MoodSync {plan.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Billing</Text>
            <Text style={styles.summaryValue}>{isYearly ? 'Yearly' : 'Monthly'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Renews on</Text>
            <Text style={styles.summaryValue}>{formatLongDate(renewsOn)}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total today</Text>
            <Text style={styles.totalValue}>{formatMoney(plan.price)}</Text>
          </View>
        </View>

        {SIMULATED_PAYMENTS ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Demo checkout: no real payment is taken and no card details are stored.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Card details</Text>

        <Text style={styles.label}>Card number</Text>
        <TextInput
          style={[styles.input, errors.cardNumber && styles.inputError]}
          placeholder="1234 5678 9012 3456"
          placeholderTextColor={COLORS.gray400}
          value={form.cardNumber}
          onChangeText={(text) => onChange('cardNumber', formatCardNumber(text))}
          keyboardType="number-pad"
          maxLength={19}
          editable={!processing}
        />
        {errors.cardNumber ? <Text style={styles.error}>{errors.cardNumber}</Text> : null}

        <View style={styles.row}>
          <View style={styles.colLeft}>
            <Text style={styles.label}>Expiry (MM/YY)</Text>
            <TextInput
              style={[styles.input, errors.expiryDate && styles.inputError]}
              placeholder="08/28"
              placeholderTextColor={COLORS.gray400}
              value={form.expiryDate}
              onChangeText={(text) => onChange('expiryDate', formatExpiry(text))}
              keyboardType="number-pad"
              maxLength={5}
              editable={!processing}
            />
            {errors.expiryDate ? <Text style={styles.error}>{errors.expiryDate}</Text> : null}
          </View>
          <View style={styles.colRight}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={[styles.input, errors.cvv && styles.inputError]}
              placeholder="123"
              placeholderTextColor={COLORS.gray400}
              value={form.cvv}
              onChangeText={(text) => onChange('cvv', text.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={4}
              editable={!processing}
            />
            {errors.cvv ? <Text style={styles.error}>{errors.cvv}</Text> : null}
          </View>
        </View>

        <Text style={styles.label}>Name on card</Text>
        <TextInput
          style={[styles.input, errors.cardholderName && styles.inputError]}
          placeholder="Full name"
          placeholderTextColor={COLORS.gray400}
          value={form.cardholderName}
          onChangeText={(text) => onChange('cardholderName', text)}
          autoCapitalize="words"
          editable={!processing}
        />
        {errors.cardholderName ? <Text style={styles.error}>{errors.cardholderName}</Text> : null}

        <TouchableOpacity
          style={[styles.payButton, processing && styles.payButtonDisabled]}
          onPress={handlePay}
          disabled={processing}
          activeOpacity={0.85}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.payButtonText}>Pay {formatMoney(plan.price)} and subscribe</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.terms}>
          Your plan renews automatically. You can cancel anytime from the Subscription screen.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  missing: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray50,
  },
  missingText: {
    fontSize: 16,
    color: COLORS.gray700,
    marginBottom: 16,
  },
  missingButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
  },
  missingButtonText: {
    color: COLORS.white,
    fontWeight: '700',
  },
  summary: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  summaryHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray900,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  notice: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.warningLight,
  },
  noticeText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.warningDark,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gray900,
    marginTop: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray700,
    marginTop: 14,
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: 14,
    backgroundColor: COLORS.white,
    color: COLORS.gray900,
    fontSize: 16,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  error: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  colLeft: {
    flex: 1,
    marginRight: 8,
  },
  colRight: {
    flex: 1,
    marginLeft: 8,
  },
  payButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  payButtonDisabled: {
    opacity: 0.7,
  },
  payButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  terms: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.gray500,
    textAlign: 'center',
  },
});

export default PaymentScreen;
