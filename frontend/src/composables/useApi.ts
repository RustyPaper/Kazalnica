import axios, { AxiosError } from 'axios';
import { ref } from 'vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export function useApi() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const handleError = (err: unknown): string => {
    if (axios.isAxiosError(err)) {
      const axiosError = err as AxiosError<{ error: string; details?: string[] }>;
      
      if (axiosError.response?.data?.details) {
        return axiosError.response.data.details.join(', ');
      }
      
      return axiosError.response?.data?.error || 'Błąd połączenia z serwerem';
    }
    
    return 'Nieznany błąd';
  };

  const get = async <T>(endpoint: string): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get<T>(`${API_URL}${endpoint}`);
      return response.data;
    } catch (err) {
      error.value = handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const post = async <T>(endpoint: string, data?: any): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.post<T>(`${API_URL}${endpoint}`, data);
      return response.data;
    } catch (err) {
      error.value = handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const put = async <T>(endpoint: string, data?: any): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.put<T>(`${API_URL}${endpoint}`, data);
      return response.data;
    } catch (err) {
      error.value = handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const del = async <T>(endpoint: string): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.delete<T>(`${API_URL}${endpoint}`);
      return response.data;
    } catch (err) {
      error.value = handleError(err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    loading,
    error,
    get,
    post,
    put,
    del,
  };
}
