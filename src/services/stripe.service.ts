import axios from 'axios';
import API_URL from '../config/api';

const BASE_URL = `${API_URL}/api`;

interface CreatePaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface CreateCheckoutSessionData {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
}

interface ConfirmPaymentData {
  paymentIntentId: string;
}

export const stripeService = {
  /**
   * Crear un Payment Intent
   */
  async createPaymentIntent(data: CreatePaymentIntentData) {
    try {
      const response = await axios.post(`${BASE_URL}/stripe/create-payment-intent`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  /**
   * Crear una sesión de Checkout
   */
  async createCheckoutSession(data: CreateCheckoutSessionData) {
    try {
      const response = await axios.post(`${BASE_URL}/stripe/create-checkout-session`, data);
      return response.data;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  },

  /**
   * Confirmar un pago
   */
  async confirmPayment(data: ConfirmPaymentData) {
    try {
      const response = await axios.post(`${BASE_URL}/stripe/confirm-payment`, data);
      return response.data;
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  },
}; 