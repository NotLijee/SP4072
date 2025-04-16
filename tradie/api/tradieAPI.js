import axios from 'axios';


const FAST_API_URL = 'http://127.0.0.1:8000';

export const getAllData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/allData`);
        return response.data;
    } catch (error) {
        console.error('Error fetching all data:', error);
        throw error;
    }
};

export const getCeoData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/ceo`);
        return response.data;
    } catch (error) {
        console.error('Error fetching CEO data:', error);
        throw error;
    }
};

export const getPresData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/pres`);
        return response.data;
    } catch (error) {
        console.error('Error fetching President data:', error);
        throw error;
    }
};

export const getCfoData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/cfo`);
        return response.data;
    } catch (error) {
        console.error('Error fetching CFO data:', error);
        throw error;
    }
};

export const getDirectorData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/dir`);
        return response.data;
    } catch (error) {
        console.error('Error fetching Director data:', error);
        throw error;
    }
};

export const getTenPercentData = async () => {
    try {
        const response = await axios.get(`${FAST_API_URL}/ten-percent`);
        return response.data;
    } catch (error) {
        console.error('Error fetching 10% Owner data:', error);
        throw error;
    }
};

export const getChartData = async (ticker) => {
    try {
        const response = await axios.get(`${FAST_API_URL}/ticker-ytd/${ticker}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
};
export const getAIAnalysis = async (ticker) => {
    try {
        const response = await axios.get(`${FAST_API_URL}/analysis/${ticker}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching AI analysis:', error);
        throw error;
    }
};