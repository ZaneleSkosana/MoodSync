import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS } from '../../utils/colors';
import {
  PREMIUM_FEATURES,
  formatMoney,
  formatLongDate,
  openPremiumFeature,
} from '../../utils/plans';

const SubscriptionSuccessScreen = ({ navigation, route }) => {
  const { plan, reference, last4, renewsOn } = route.params || {};
  const scale = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 70,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scale, fade]);

  const features = PREMIUM_FEATURES.filter(
    (feature) => !feature.planOnly || feature.planOnly === plan?.name
  );

  const handleFeature = (feature) => {
    if (feature.status === 'soon') {
      Alert.alert('Coming soon', `${feature.title} is on the way. We will let you know when it is ready.`);
      return;
    }

    openPremiumFeature(navigation, feature);
  };

  const handleGoHome = () => {
    navigation.popToTop();
    navigation.navigate('Home');
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      <LinearGradient colors={GRADIENTS.moodGradient} style={styles.hero}>
        <Animated.View style={[styles.badge, { transform: [{ scale }] }]}>
          <Text style={styles.badgeIcon}>✓</Text>
        </Animated.View>

        <Animated.View style={{ opacity: fade, alignItems: 'center' }}>
          <Text style={styles.heroTitle}>Welcome to {plan?.name || 'Premium'}</Text>
          <Text style={styles.heroSubtitle}>
            Your payment went through and your new features are ready to use.
          </Text>
        </Animated.View>
      </LinearGradient>

      <View style={styles.receipt}>
        <Text style={styles.receiptTitle}>Receipt</Text>

        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Plan</Text>
          <Text style={styles.receiptValue}>MoodSync {plan?.name}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Billing</Text>
          <Text style={styles.receiptValue}>{plan?.duration}</Text>
        </View>
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Amount paid</Text>
          <Text style={styles.receiptValue}>{formatMoney(plan?.price)}</Text>
        </View>
        {last4 ? (
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Card</Text>
            <Text style={styles.receiptValue}>•••• {last4}</Text>
          </View>
        ) : null}
        {renewsOn ? (
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Renews on</Text>
            <Text style={styles.receiptValue}>{formatLongDate(renewsOn)}</Text>
          </View>
        ) : null}
        {reference ? (
          <View style={styles.receiptRow}>
            <Text style={styles.receiptLabel}>Reference</Text>
            <Text style={[styles.receiptValue, styles.reference]} numberOfLines={1}>
              {reference}
            </Text>
          </View>
        ) : null}
        <View style={styles.receiptRow}>
          <Text style={styles.receiptLabel}>Status</Text>
          <View style={styles.activePill}>
            <Text style={styles.activePillText}>Active</Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Your new features</Text>

      <View style={styles.featureList}>
        {features.map((feature) => (
          <View key={feature.id} style={styles.featureCard}>
            <View style={styles.featureTop}>
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
                  ) : (
                    <View style={styles.unlockedPill}>
                      <Text style={styles.unlockedPillText}>UNLOCKED</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>

            {feature.status === 'live' ? (
              <TouchableOpacity
                style={styles.tryButton}
                onPress={() => handleFeature(feature)}
                activeOpacity={0.85}
              >
                <Text style={styles.tryButtonText}>Try it now  →</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.homeButton} onPress={handleGoHome} activeOpacity={0.85}>
        <Text style={styles.homeButtonText}>Start exploring MoodSync</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.manageButton}
        onPress={() => navigation.popToTop()}
        activeOpacity={0.85}
      >
        <Text style={styles.manageButtonText}>Back to profile</Text>
      </TouchableOpacity>

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
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  badge: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  badgeIcon: {
    fontSize: 44,
    fontWeight: '800',
    color: COLORS.success,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.white,
    opacity: 0.9,
    textAlign: 'center',
  },
  receipt: {
    marginHorizontal: 16,
    marginTop: -20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginBottom: 14,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 14,
    color: COLORS.gray600,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.gray900,
  },
  reference: {
    maxWidth: 170,
    fontSize: 12,
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
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  featureTop: {
    flexDirection: 'row',
  },
  featureIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: COLORS.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  featureIcon: {
    fontSize: 26,
  },
  featureBody: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.gray900,
    marginRight: 8,
  },
  unlockedPill: {
    backgroundColor: COLORS.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  unlockedPillText: {
    color: COLORS.successDark,
    fontSize: 10,
    fontWeight: '800',
  },
  soonPill: {
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
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.gray600,
  },
  tryButton: {
    marginTop: 14,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  homeButton: {
    marginHorizontal: 16,
    marginTop: 12,
    height: 54,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  manageButton: {
    marginHorizontal: 16,
    marginTop: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manageButtonText: {
    color: COLORS.primary,
    fontSize: 15,
    fontWeight: '700',
  },
  spacer: {
    height: 100,
  },
});

export default SubscriptionSuccessScreen;
