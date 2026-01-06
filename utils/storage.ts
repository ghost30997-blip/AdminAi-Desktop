
import { Client, DriveFile, Employee, SystemSettings, SystemUser, Training, PresentationTemplate, CrmColumn, Task } from '../types';
import { dbGet, dbSet } from './db';

// Keys
const CLIENTS_KEY = 'adminai_clients';
const FILES_KEY = 'adminai_files';
const SETTINGS_KEY = 'adminai_settings';
const USERS_KEY = 'adminai_users';
const TRAININGS_KEY = 'adminai_trainings';
const TEMPLATES_KEY = 'adminai_templates';
const TASKS_KEY = 'adminai_tasks';

// In-Memory Cache
let cache: Record<string, any> = {};

// Initial Seed Data
const DEFAULT_CRM_COLUMNS: CrmColumn[] = [
  { id: 'lead', label: 'Novos Leads', color: 'border-blue-400', order: 0 },
  { id: 'contact', label: 'Em Contato', color: 'border-orange-400', order: 1 },
  { id: 'proposal', label: 'Proposta Enviada', color: 'border-purple-400', order: 2 },
  { id: 'negotiation', label: 'Negociação', color: 'border-yellow-400', order: 3 },
  { id: 'closed', label: 'Fechado', color: 'border-green-400', order: 4 },
];

const SEED_SETTINGS: SystemSettings = {
  companyName: 'Minha Empresa Ltda',
  cnpj: '00.000.000/0001-99',
  email: 'admin@empresa.com',
  themeColor: 'blue',
  crmColumns: DEFAULT_CRM_COLUMNS
};

const SEED_TRAININGS: Training[] = [
  { id: 't1', name: 'Treinamento NR10', category: 'Segurança', duration: '40h', price: 1500 },
  { id: 't2', name: 'Onboarding Corporativo', category: 'RH', duration: '8h', price: 500 },
];

// Initialize Storage (Load from DB to Cache)
export const initStorage = async () => {
    try {
        const clients = await dbGet(CLIENTS_KEY) || [];
        const files = await dbGet(FILES_KEY) || [{ id: 'root', name: 'Meu Drive', type: 'folder', updatedAt: new Date().toISOString(), parentId: null }];
        const settings = await dbGet(SETTINGS_KEY) || SEED_SETTINGS;
        const users = await dbGet(USERS_KEY) || [{ id: 'u1', name: 'Admin', email: 'admin@empresa.com', role: 'admin', status: 'active' }];
        const trainings = await dbGet(TRAININGS_KEY) || SEED_TRAININGS;
        const templates = await dbGet(TEMPLATES_KEY) || [];
        const tasks = await dbGet(TASKS_KEY) || [];

        cache = {
            [CLIENTS_KEY]: clients,
            [FILES_KEY]: files,
            [SETTINGS_KEY]: settings,
            [USERS_KEY]: users,
            [TRAININGS_KEY]: trainings,
            [TEMPLATES_KEY]: templates,
            [TASKS_KEY]: tasks
        };
        console.log("Storage Initialized (Local Database)");
        
    } catch (e) {
        console.error("Failed to init storage", e);
    }
};

// Helper to update cache and DB
const update = (key: string, data: any) => {
    cache[key] = data;
    dbSet(key, data); 
    return data;
};

// --- ACCESSORS ---

export const getClients = (): Client[] => cache[CLIENTS_KEY] || [];

export const saveClient = (client: Client) => {
  const clients = getClients();
  const exists = clients.find(c => String(c.id) === String(client.id));
  
  // Update timestamp
  client.updated_at = new Date().toISOString();

  let newClients;
  
  // Create folder logic (Local Mock for immediate UI)
  let companyFolderId = client.folderId;
  if (!companyFolderId) {
      const folderName = client.trainingName ? `${client.company} - ${client.trainingName}` : client.company;
      const folder = createFolder(folderName, 'root', client.id);
      companyFolderId = folder.id;
      client.folderId = companyFolderId;
  }

  if (exists) {
    newClients = clients.map(c => String(c.id) === String(client.id) ? client : c);
  } else {
    newClients = [...clients, client];
  }
  
  return update(CLIENTS_KEY, newClients);
};

export const deleteClient = (id: string) => {
    const clients = getClients().filter(c => String(c.id) !== String(id));
    return update(CLIENTS_KEY, clients);
};

export const getFiles = (): DriveFile[] => cache[FILES_KEY] || [];

export const createFolder = (name: string, parentId: string = 'root', linkedClientId?: string) => {
  const files = getFiles();
  const newFolder: DriveFile = {
    id: linkedClientId ? `folder_${linkedClientId}` : `folder_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    type: 'folder',
    updatedAt: new Date().toISOString().split('T')[0],
    parentId,
    size: '0 items',
    synced: false
  };
  update(FILES_KEY, [...files, newFolder]);
  return newFolder;
};

export const uploadFileMock = (file: File, parentId: string) => {
  const files = getFiles();
  const newFile: DriveFile = {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2,5)}`,
    name: file.name,
    type: file.type.includes('image') ? 'image' : file.type.includes('pdf') ? 'pdf' : 'doc',
    updatedAt: new Date().toISOString().split('T')[0],
    parentId,
    size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
    content: file, // Store blob locally temporarily
    synced: false
  };
  update(FILES_KEY, [...files, newFile]);
  return newFile;
};

// Tasks
export const getTasks = (): Task[] => cache[TASKS_KEY] || [];
export const saveTask = (task: Task) => {
    task.updated_at = new Date().toISOString();
    const tasks = getTasks();
    const exists = tasks.find(t => t.id === task.id);
    const newTasks = exists ? tasks.map(t => t.id === task.id ? task : t) : [...tasks, task];
    return update(TASKS_KEY, newTasks);
};
export const deleteTask = (id: string) => {
    return update(TASKS_KEY, getTasks().filter(t => t.id !== id));
};

// Settings
export const getSettings = (): SystemSettings => cache[SETTINGS_KEY] || SEED_SETTINGS;
export const saveSettings = (settings: SystemSettings) => update(SETTINGS_KEY, settings);

// Users
export const getUsers = (): SystemUser[] => cache[USERS_KEY] || [];
export const saveUser = (user: SystemUser) => {
    const users = getUsers();
    const exists = users.find(u => u.id === user.id);
    const newUsers = exists ? users.map(u => u.id === user.id ? user : u) : [...users, user];
    return update(USERS_KEY, newUsers);
};
export const deleteUser = (id: string) => update(USERS_KEY, getUsers().filter(u => u.id !== id));

// Trainings
export const getTrainings = (): Training[] => cache[TRAININGS_KEY] || [];
export const saveTraining = (training: Training) => update(TRAININGS_KEY, [...getTrainings(), training]);
export const deleteTraining = (id: string) => update(TRAININGS_KEY, getTrainings().filter(t => t.id !== id));

// Templates
export const getTemplates = (): PresentationTemplate[] => cache[TEMPLATES_KEY] || [];
export const saveTemplate = (template: PresentationTemplate) => update(TEMPLATES_KEY, [...getTemplates(), template]);
export const deleteTemplate = (id: string) => update(TEMPLATES_KEY, getTemplates().filter(t => t.id !== id));
