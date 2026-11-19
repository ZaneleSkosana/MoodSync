import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../utils/colors';
import { useUserStore } from '../../store/userStore';
import { useSubscriptionStore, selectIsPremium } from '../../store/subscriptionStore';
import { stripeService } from '../../services/stripeService';
import {
  PLANS,
  PREMIUM_FEATURES,
  COMPARISON_ROWS,
  YEARLY_DISCOUNT,
  getPlanPrice,
  formatMoney,
  formatLongDate,
  openPremiumFeature,
} from '../../utils/plans';

const renderCell = (value) => {
  if (value === true) {
    return <Text style={styles.cellCheck}>✓</Text>;
  }
  if (value === false) {
    return <Text style={styles.cellDash}>–</Text>;
  }
  return <Text style={styles.cellText}>{value}</Text>;
};

const SubscriptionScreen = ({ navigation }) => {
  const [billing, setBilling] = useState('monthly');
  const [cancelling, setCancelling] = useState(false);

  const { user } = useUserStore();
  const isPremium = useSubscriptionStore(selectIsPremium);
  const currentPlan = useSubscriptionStore((state) => state.currentPlan);
  const subscription = useSubscriptionStore((state) => state.subscription);
  const subscriptionEndDate = useSubscriptionStore((state) => state.subscriptionEndDate);
  const loadSubscription = useSubscriptionStore((state) => state.loadSubscription);
  const cancelLocal = useSubscriptionStore((state) => state.cancelSubscription);

  useEffect(() => {
    if (user?.id) {
      loadSubscription(user.id);
    }
  }, [user?.id, loadSubscription]);

  const handleChoosePlan = (plan) => {
    if (plan.id === 'free') {
      return;
    }

    if (isPremium && plan.name === currentPlan) {
      return;
    }

    navigation.navigate('Payment', {
      plan: {
        id: plan.id,
        name: plan.name,
        price: getPlanPrice(plan, billing),
        duration: billing === 'yearly' ? 'Yearly' : 'Monthly',
        billing,
        tagline: plan.tagline,
        features: plan.features,
      },
    });
  };

  const handleCancel = () => {
    Alert.alert(
      'Cancel subscription',
      'You will lose Premium features right away. You can upgrade again at any time.',
      [
        { text: 'Keep Premium', style: 'cancel' },
        {
          text: 'Cancel plan',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              if (subscription?.id) {
                await stripeService.cancelSubscription(subscription.id);
              }
              cancelLocal();
            } catch (error) {
              Alert.alert('Could not cancel', 'Please try again in a moment.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleFeaturePress = (feature) => {
    if (feature.status === 'soon') {
      Alert.alert('Coming soon', `${feature.title} is on the way. We will let you know when it is ready.`);
      return;
    }

    if (!isPremium) {
      Alert.alert('Premium feature', `${feature.title} is included with Premium. Choose a plan below to unlock it.`);
      return;
    }

    openPremiumFeature(navigation, feature);
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <LinearGradient colors={GRADIENTS.moodGradient} style={styles.hero}>
        <Text style={styles.heroBadge}>MOODSYNC PREMIUM</Text>
        <Text style={styles.heroTitle}>
          {isPremium ? `You are on ${currentPlan}` : 'Unlock the full experience'}
        </Text>
        <Text style={styles.heroSubtitle}>
          {isPremium
            ? 'Thank you for supporting MoodSync. Your premium tools are ready below.'
            : 'Go deeper with your moods, with insights, more suggestions and curated collections.'}
        </Text>
      </LinearGradient>

      {isPremium ? (
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Plan</Text>
            <Text style={styles.statusValue}>{currentPlan}</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.activePill}>
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>
          {subscriptionEndDate ? (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Renews on</Text>
              <Text style={styles.statusValue}>{formatLongDate(subscriptionEndDate)}</Text>
            </View>
          ) : null}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            disabled={cancelling}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>
              {cancelling ? 'Cancelling...' : 'Cancel subscription'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <Text style={styles.sectionTitle}>
        {isPremium ? 'Your premium features' : 'What you unlock'}
      </Text>

      <View style={styles.featureList}>
        {PREMIUM_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={() => handleFeaturePress(feature)}
            activeOpacity={0.85}
          >
            <View style={styles.featureIconWrap}>
              <Text style={styles.featureIcon}>{feature.icon}</Text>
            </View>
            <View style={styles.featureBody}>
              <View style={styles.featureTitleRow}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                {feature.status === 'soon' ? (
                  <View style={styles.soonPill}>
                    <Text style={styles.soonPillText}>SOON</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
            <Text style={styles.featureArrow}>
              {feature.status === 'soon' ? '' : isPremium ? '→' : '🔒'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Choose your plan</Text>

      <View style={styles.toggle}>
        <TouchableOpacity
          style={[styles.toggleOption, billing === 'monthly' && styles.toggleOptionActive]}
          onPress={() => setBilling('monthly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, billing === 'monthly' && styles.toggleTextActive]}>
            Monthly
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, billing === 'yearly' && styles.toggleOptionActive]}
          onPress={() => setBilling('yearly')}
          activeOpacity={0.85}
        >
          <Text style={[styles.toggleText, billing === 'yearly' && styles.toggleTextActive]}>
            Yearly  ·  Save {Math.round(YEARLY_DISCOUNT * 100)}%
          </Text>
        </TouchableOpacity>
      </View>

      {PLANS.map((plan) => {
        const price = getPlanPrice(plan, billing);
        const isCurrent =
          plan.id === 'free' ? !isPremium : isPremium && plan.name === currentPlan;

        return (
          <View
            key={plan.id}
            style={[styles.planCard, plan.popular && styles.planCardPopular]}
          >
            {plan.popular ? (
              <View style={styles.popularBadge}>
                <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
              </View>
            ) : null}

            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={styles.planTagline}>{plan.tagline}</Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{price === 0 ? 'Free' : formatMoney(price)}</Text>
              {price > 0 ? (
                <Text style={styles.period}>
                  {billing === 'yearly' ? 'per year' : 'per month'}
                </Text>
              ) : null}
            </View>

            {plan.features.map((feature) => (
              <View key={feature} style={styles.planFeatureRow}>
                <Text style={styles.planCheck}>✓</Text>
                <Text style={styles.planFeatureText}>{feature}</Text>
              </View>
            ))}

            <TouchableOpacity
              style={[
                styles.planButton,
                plan.popular && !isCurrent && styles.planButtonPrimary,
                isCurrent && styles.planButtonCurrent,
              ]}
              onPress={() => handleChoosePlan(plan)}
              disabled={isCurrent || plan.id === 'free'}
              activeOpacity={0.85}
            >
              <Text
                style={[
                  styles.planButtonText,
                  plan.popular && !isCurrent && styles.planButtonTextPrimary,
                  isCurrent && styles.planButtonTextCurrent,
                ]}
              >
                {isCurrent
                  ? 'Current plan'
                  : plan.id === 'free'
                  ? 'Included'
                  : isPremium
                  ? `Switch to ${plan.name}`
                  : `Upgrade to ${plan.name}`}
              </Text>
            </TouchableOpacity>
          </View>
        );
      })}

      <Text style={styles.sectionTitle}>Compare plans</Text>

      <View style={styles.table}>
        <View style={[styles.tableRow, styles.tableHeader]}>
          <Text style={[styles.tableLabel, styles.tableHeaderText]}>Feature</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Free</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Premium</Text>
          <Text style={[styles.tableCell, styles.tableHeaderText]}>Family</Text>
        </View>
        {COMPARISON_ROWS.map((row, index) => (
          <View
            key={row.label}
            style={[styles.tableRow, index % 2 === 1 && styles.tableRowAlt]}
          >
            <Text style={styles.tableLabel}>{row.label}</Text>
            <View style={styles.tableCell}>{renderCell(row.free)}</View>
            <View style={styles.tableCell}>{renderCell(row.premium)}</View>
            <View style={styles.tableCell}>{renderCell(row.family)}</View>
          </View>
        ))}
      </View>

      <Text style={styles.footerText}>
        Cancel anytime from this screen. Prices are shown in South African rand.
      </Text>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray50,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 36,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  heroBadge: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    opacity: 0.85,
    marginBottom: 10,
  },
  heroTitle: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  heroSubtitle: {
    color: COLORS.white,
    fontSize: 14,
    lineHeight: 21,
    opacity: 0.9,
  },
  statusCard: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  activePill: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activePillText: {
    color: COLORS.successDark,
    fontSize: 12,
    fontWeight: '700',
  },
  cancelButton: {
    marginTop: 4,
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    color: COLORS.error,
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.gray900,
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 14,
  },
  featureList: {
    marginHorizontal: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 24,
  },
  featureBody: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  soonPill: {
    marginLeft: 8,
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  soonPillText: {
    color: COLORS.warningDark,
    fontSize: 10,
    fontWeight: '800',
  },
  featureDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.gray600,
  },
  featureArrow: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
    minWidth: 20,
    textAlign: 'right',
  },
  toggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 4,
    borderRadius: 14,
    backgroundColor: COLORS.gray200,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 11,
    alignItems: 'center',
  },
  toggleOptionActive: {
    backgroundColor: COLORS.white,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray600,
  },
  toggleTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  planCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.gray200,
  },
  planCardPopular: {
    borderColor: COLORS.primaryLight,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 12,
  },
  popularBadgeText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  planName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.gray900,
  },
  planTagline: {
    fontSize: 13,
    color: COLORS.gray600,
    marginTop: 2,
    marginBottom: 14,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.primary,
  },
  period: {
    fontSize: 14,
    color: COLORS.gray600,
    marginLeft: 8,
  },
  planFeatureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  planCheck: {
    color: COLORS.success,
    fontWeight: '800',
    fontSize: 16,
    marginRight: 10,
    marginTop: -1,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.gray800,
  },
  planButton: {
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planButtonPrimary: {
    backgroundColor: COLORS.primary,
  },
  planButtonCurrent: {
    backgroundColor: COLORS.gray100,
    borderColor: COLORS.gray200,
  },
  planButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
  },
  planButtonTextPrimary: {
    color: COLORS.white,
  },
  planButtonTextCurrent: {
    color: COLORS.gray500,
  },
  table: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  tableRowAlt: {
    backgroundColor: COLORS.gray50,
  },
  tableHeader: {
    backgroundColor: COLORS.primary,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontWeight: '800',
    fontSize: 12,
  },
  tableLabel: {
    flex: 2.2,
    fontSize: 13,
    color: COLORS.gray800,
  },
  tableCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  cellCheck: {
    color: COLORS.success,
    fontWeight: '800',
    fontSize: 16,
  },
  cellDash: {
    color: COLORS.gray400,
    fontSize: 16,
  },
  cellText: {
    color: COLORS.gray800,
    fontWeight: '700',
    fontSize: 12,
  },
  footerText: {
    marginTop: 20,
    marginHorizontal: 24,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.gray500,
    textAlign: 'center',
  },
  spacer: {
    height: 100,
  },
});

export default SubscriptionScreen;
