
// SUPABASE REMOVED - LOCAL MODE ONLY
// This file assumes mock implementations to satisfy existing imports.

export const initSupabase = () => {
  console.log("App running in Local Mode (No Database)");
};

export const getSupabase = () => {
  return null;
};

export const getSetupSQL = () => "-- Local Mode: SQL not required";

// --- MOCK MANAGEMENT API ---

export const listProjects = async (accessToken: string) => {
    return [];
};

export const getProjectKeys = async (projectRef: string, accessToken: string) => {
    return [];
};

export const runDatabaseSetup = async (projectRef: string, accessToken: string) => {
    return true;
};

// --- MOCK AUTH ---

export const loginSupabase = async (email: string) => {
  return true;
};

// --- MOCK DATA SYNC ---

export const upsertData = async (table: string, data: any) => {
  return { error: "Local Mode" };
};

export const fetchLatestData = async (table: string, lastSync?: string) => {
    return { data: [], error: "Local Mode" };
};

// --- MOCK STORAGE ---

export const uploadFileToStorage = async (file: File, path: string) => {
    throw new Error("Storage unavailable in Local Mode");
};

export const listStorageFiles = async (folder: string) => {
    return [];
};
