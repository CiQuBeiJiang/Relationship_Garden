import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8000/api',
});

export interface Interaction {
    id: number;
    person_id: number;
    date: string;
    raw_text: string;
    quality_score: number;
    mood_score?: number;
    tags?: string;
}

export interface InteractionCreate {
    date: string;
    raw_text: string;
    quality_score: number;
    mood_score?: number;
    tags?: string;
}

export interface Person {
    id: number;
    name: string;
    birthday?: string;
    group_name?: string;
    affection_score: number;
    tags?: string;
    preferences?: string;
    similarities_and_differences?: string;
    completeness_score: number;
    needs_verification?: string;
    archive_mode: boolean;
    interactions: any[];
}

export interface DashboardData {
    upcoming_events: Person[];
    needs_cultivation: Person[];
}

export const getContacts = async (): Promise<Person[]> => {
    const response = await api.get('/contacts');
    return response.data;
};

export const getDashboard = async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard');
    return response.data;
};

export const verifyContact = async (id: number): Promise<void> => {
    await api.post(`/contacts/${id}/verify`);
};

export const deleteContact = async (id: number): Promise<void> => {
    await api.delete(`/contacts/${id}`);
};

export const updateContact = async (id: number, data: Partial<Person>): Promise<Person> => {
    const response = await api.patch(`/contacts/${id}`, data);
    return response.data;
};
