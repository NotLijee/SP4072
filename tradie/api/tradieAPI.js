import axios from 'axios';


const FAST_API_URL = 'http://127.0.0.1:8000/'

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
}