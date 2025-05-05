import axios from 'axios';

const FAST_API_URL = 'http://127.0.0.1:8000';

// Account Management
export const listAccounts = async () => {
  try {
    const response = await axios.get(`${FAST_API_URL}/broker/accounts`);
    return response.data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

export const getAccount = async (accountId) => {
  try {
    const response = await axios.get(`${FAST_API_URL}/broker/accounts/${accountId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching account ${accountId}:`, error);
    throw error;
  }
};

export const createAccount = async (accountData) => {
  try {
    const response = await axios.post(`${FAST_API_URL}/broker/accounts`, accountData);
    return response.data;
  } catch (error) {
    console.error('Error creating account:', error);
    throw error;
  }
};

// Trading Operations
export const getPositions = async (accountId, forceRefresh = false) => {
  try {
    const response = await axios.get(
      `${FAST_API_URL}/broker/accounts/${accountId}/positions`, 
      { params: { force_refresh: forceRefresh } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching positions for account ${accountId}:`, error);
    throw error;
  }
};

export const getOrders = async (accountId, status = 'open') => {
  try {
    const response = await axios.get(
      `${FAST_API_URL}/broker/accounts/${accountId}/orders`,
      { params: { status } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching orders for account ${accountId}:`, error);
    throw error;
  }
};

export const placeOrder = async (accountId, orderData) => {
  try {
    const response = await axios.post(
      `${FAST_API_URL}/broker/accounts/${accountId}/orders`,
      orderData
    );
    return response.data;
  } catch (error) {
    console.error(`Error placing order for account ${accountId}:`, error);
    throw error;
  }
};

// Portfolio Analysis
export const getPortfolioHistory = async (accountId, period = '1M') => {
  try {
    const response = await axios.get(
      `${FAST_API_URL}/broker/accounts/${accountId}/portfolio/history`,
      { params: { period } }
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching portfolio history for account ${accountId}:`, error);
    throw error;
  }
};

// Paper Trading
export const fundAccountWithPaperMoney = async (accountId, amount) => {
  try {
    const response = await axios.post(
      `${FAST_API_URL}/broker/accounts/${accountId}/fund`,
      { amount }
    );
    return response.data;
  } catch (error) {
    console.error(`Error funding account ${accountId}:`, error);
    throw error;
  }
}; 