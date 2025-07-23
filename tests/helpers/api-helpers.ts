import axios, { AxiosResponse } from 'axios';

export interface PublicAppResponse {
  app_data: {
    app_id: string;
    name: string;
    description?: {
      overview: string;
      how_it_works?: string;
      how_to_connect?: string;
    };
    // other app fields
  };
}

export interface AppRanking {
  app_id: string;
  name?: string;
  // other app ranking fields
}

export interface Category {
  id: string;
  name: string;
  icon_url: string;
}

export interface AllCategory {
  name: string;
  id: string;
  icon_url: string;
}

export interface AppRankings {
  top_apps: AppRanking[];
  highlights: AppRanking[];
}

export interface PublicAppsResponse {
  app_rankings: AppRankings;
  all_category: AllCategory;
  categories: Category[];
}

// Get base URL from environment variables
const getBaseUrl = (): string => {
  const baseUrl = process.env.API_BASE_URL;
  if (!baseUrl) {
    throw new Error('API_BASE_URL is not configured');
  }
  return baseUrl;
};

export async function getPublicApps(): Promise<AxiosResponse<PublicAppsResponse>> {
  const baseUrl = getBaseUrl();
  return axios.get(`${baseUrl}/api/v2/public/apps`);
}

export async function getPublicApp(appId: string): Promise<AxiosResponse<PublicAppResponse>> {
  const baseUrl = getBaseUrl();
  return axios.get(`${baseUrl}/api/v2/public/app/${appId}`);
}

export interface SearchAppsResponse {
  app_ids: string[];
}

export async function searchPublicApps(searchTerm: string): Promise<AxiosResponse<SearchAppsResponse>> {
  const baseUrl = getBaseUrl();
  return axios.get(`${baseUrl}/api/v2/public/apps/search/${searchTerm}`);
}

export function validatePublicAppStructure(app: any): boolean {
  return app && app.app_data && typeof app.app_data.app_id === 'string' && typeof app.app_data.name === 'string';
}

export function validatePublicAppsResponse(response: any): boolean {
  return response && response.app_rankings && Array.isArray(response.app_rankings.top_apps);
} 