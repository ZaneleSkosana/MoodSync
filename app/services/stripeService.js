import { supabaseService } from './supabaseService';

export const stripeService = {
  createPaymentIntent: async (amount, currency = 'ZAR') => {
    try {
      const paymentIntent = {
        id: `pi_${Date.now()}`,
        amount,
        currency,
        status: 'requires_payment_method',
        client_secret: `secret_${Date.now()}`,
      };
      return { success: true, data: paymentIntent };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  confirmPayment: async (paymentIntentId, paymentMethod) => {
    try {
      const confirmedPayment = {
        id: paymentIntentId,
        status: 'succeeded',
        paymentMethod,
        confirmedAt: new Date().toISOString(),
      };
      return { success: true, data: confirmedPayment };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

 
  createSubscription: async (userId, plan) => {
    try {
      const subscription = {
        user_id: userId,
        plan_name: plan.name,
        plan_price: plan.price,
        plan_duration: plan.duration,
        is_active: true,
        start_date: new Date().toISOString(),
        next_billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        stripe_subscription_id: `sub_${Date.now()}`,
        created_at: new Date().toISOString(),
      };

      const result = await supabaseService.subscriptions.createSubscriptionRecord(subscription);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  cancelSubscription: async (subscriptionId) => {
    try {
      const result = await supabaseService.subscriptions.cancelSubscription(subscriptionId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSubscription: async (subscriptionId, newPlan) => {
    try {
      const updates = {
        plan_name: newPlan.name,
        plan_price: newPlan.price,
        plan_duration: newPlan.duration,
        updated_at: new Date().toISOString(),
      };

      const result = await supabaseService.subscriptions.updateSubscription(subscriptionId, updates);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getSubscriptionStatus: async (userId) => {
    try {
      const result = await supabaseService.subscriptions.getSubscriptionByUser(userId);
      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  processPayment: async (userId, amount, paymentMethod, plan) => {
    try {
      const paymentIntent = await stripeService.createPaymentIntent(amount);
      if (!paymentIntent.success) return paymentIntent;

      const confirmedPayment = await stripeService.confirmPayment(paymentIntent.data.id, paymentMethod);
      if (!confirmedPayment.success) return confirmedPayment;

      const subscription = await stripeService.createSubscription(userId, plan);
      if (!subscription.success) return subscription;

      const paymentRecord = {
        user_id: userId,
        amount,
        currency: 'ZAR',
        payment_method: paymentMethod,
        plan_name: plan.name,
        status: 'succeeded',
        stripe_payment_id: confirmedPayment.data.id,
        created_at: new Date().toISOString(),
      };

      return { success: true, data: { payment: confirmedPayment.data, subscription: subscription.data, record: paymentRecord } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  getPaymentHistory: async (userId) => {
    try {
      const mockPayments = [
        { id: 1, amount: 49.99, currency: 'ZAR', plan: 'Pro', date: '2026-07-08', status: 'succeeded' },
        { id: 2, amount: 49.99, currency: 'ZAR', plan: 'Pro', date: '2026-06-08', status: 'succeeded' },
      ];
      return { success: true, data: mockPayments };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  refundPayment: async (paymentId) => {
    try {
      const refund = {
        id: `re_${Date.now()}`,
        payment_id: paymentId,
        status: 'succeeded',
        refunded_at: new Date().toISOString(),
      };
      return { success: true, data: refund };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  validatePaymentMethod: (paymentData) => {
    const errors = {};

    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length !== 16) {
      errors.cardNumber = 'Invalid card number';
    }

    if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      errors.expiryDate = 'Invalid expiry date (MM/YY)';
    }

    if (!paymentData.cvv || !/^\d{3,4}$/.test(paymentData.cvv)) {
      errors.cvv = 'Invalid CVV';
    }

    if (!paymentData.cardholderName || paymentData.cardholderName.trim().length === 0) {
      errors.cardholderName = 'Cardholder name is required';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  },

  getInvoice: async (paymentId) => {
    try {
      const mockInvoice = {
        id: paymentId,
        invoice_number: `INV-${Date.now()}`,
        amount: 49.99,
        currency: 'ZAR',
        plan: 'Pro',
        date: new Date().toISOString(),
        status: 'paid',
      };
      return { success: true, data: mockInvoice };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  estimateTax: (amount, country = 'ZA') => {
    const taxRates = {
      ZA: 0.15,
      US: 0.08,
      GB: 0.20,
    };

    const taxRate = taxRates[country] || 0;
    const tax = amount * taxRate;
    const total = amount + tax;

    return {
      subtotal: amount,
      tax,
      taxRate: taxRate * 100,
      total,
    };
  },
};
