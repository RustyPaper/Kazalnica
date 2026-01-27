import axios from 'axios';
import type { Poll, PollWithOptions, PollWithResults, VoteData } from '../types/polls';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Lista ankiet
export const getPolls = async (): Promise<Poll[]> => {
  const response = await axios.get(`${API_URL}/polls`);
  return response.data;
};

// Szczegóły ankiety
export const getPoll = async (id: string): Promise<PollWithOptions> => {
  const response = await axios.get(`${API_URL}/polls/${id}`);
  return response.data;
};

// Wyniki ankiety
export const getPollResults = async (id: string): Promise<PollWithResults> => {
  const response = await axios.get(`${API_URL}/polls/${id}/results`);
  return response.data;
};

// Utwórz ankietę (admin)
export const createPoll = async (data: {
  title: string;
  description?: string;
  options: string[];
  closesAt?: string;
  allowMultipleVotes?: boolean;
}) => {
  const response = await axios.post(`${API_URL}/polls`, data, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Oddaj głos
export const votePoll = async (pollId: string, voteData: VoteData) => {
  const response = await axios.post(`${API_URL}/polls/${pollId}/vote`, voteData);
  return response.data;
};

// Zamknij ankietę (admin)
export const closePoll = async (pollId: string) => {
  const response = await axios.put(`${API_URL}/polls/${pollId}/close`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Otwórz ponownie ankietę (admin)
export const reopenPoll = async (pollId: string) => {
  const response = await axios.put(`${API_URL}/polls/${pollId}/reopen`, {}, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Usuń ankietę (admin)
export const deletePoll = async (pollId: string) => {
  const response = await axios.delete(`${API_URL}/polls/${pollId}`, {
    headers: getAuthHeader()
  });
  return response.data;
};

// Pobierz dane lokalu ze statystyk (auto-fill)
export const getApartmentData = async (apartmentNumber: string) => {
  const response = await axios.get(`${API_URL}/statistics/apartments`);
  const apartments = response.data.apartments;
  
  return apartments.find((apt: any) => 
    apt.number.trim().toUpperCase() === apartmentNumber.trim().toUpperCase()
  );
};
