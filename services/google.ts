import { DriveFile, SystemSettings } from "../types";
import { getSettings } from "../utils/storage";

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// Client ID deve ser configurado via System Settings no app
const HARDCODED_CLIENT_ID = "623838272990-25n6v36f69iv3v666u9m2r9q8h5r7i6e.apps.googleusercontent.com"; 

let tokenClient: any;
let accessToken: string | null = null;

const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/userinfo.profile';

export const initGoogleAuth = () => {
  if (!window.google) return;
  const settings = getSettings();
  const clientId = settings.googleClientId || HARDCODED_CLIENT_ID;

  try {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId, 
        scope: SCOPES,
        callback: (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            accessToken = tokenResponse.access_token;
          }
        },
      });
  } catch (e) {
      console.error("Google Auth Init Error", e);
  }
};

export const requestGoogleLogin = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) initGoogleAuth();
    if (!tokenClient) return reject(new Error("MISSING_CLIENT_ID"));
    
    tokenClient.callback = (resp: any) => {
      if (resp.error) reject(resp);
      else {
        accessToken = resp.access_token;
        resolve(resp.access_token);
      }
    };
    tokenClient.requestAccessToken({ prompt: 'consent' });
  });
};

export const isGoogleConnected = () => !!accessToken;

export const uploadFileToDrive = async (file: File, folderId: string = 'root'): Promise<DriveFile> => {
    if (!accessToken) throw new Error("Not authenticated");

    const metadata = {
        name: file.name,
        parents: [folderId]
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);

    // O parâmetro fields=webViewLink é essencial para o recurso "Abrir no Google Slides"
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,modifiedTime,size', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: form
    });

    if (!res.ok) throw new Error("Upload failed");
    const f = await res.json();

    return {
        id: f.id,
        name: f.name,
        type: f.mimeType.includes('presentation') ? 'doc' : 'doc',
        updatedAt: new Date(f.modifiedTime).toLocaleDateString('pt-BR'),
        parentId: folderId,
        size: f.size ? `${(parseInt(f.size) / 1024 / 1024).toFixed(2)} MB` : '-',
        webViewLink: f.webViewLink
    };
};