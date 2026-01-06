
import { openDB } from 'idb';

const DB_NAME = 'AdminAI_DB';
const DB_VERSION = 1;
const STORE_NAME = 'app_data';

export const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const dbGet = async (key: string) => {
  try {
    const db = await initDB();
    return await db.get(STORE_NAME, key);
  } catch (e) {
    console.error('DB Get Error', e);
    return null;
  }
};

export const dbSet = async (key: string, val: any) => {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, val, key);
  } catch (e) {
    console.error('DB Set Error', e);
  }
};

export const dbDelete = async (key: string) => {
    try {
        const db = await initDB();
        await db.delete(STORE_NAME, key);
    } catch (e) {
        console.error('DB Delete Error', e);
    }
};
