import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig as hardcodedConfig } from './firebase-config.js';

function getFirebaseConfig() {
  let config = {
    apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
    authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
  };

  if (!config.apiKey || !config.authDomain || !config.projectId) {
    config = { ...hardcodedConfig };
  }

  return config;
}

let app = null;
let auth = null;
let db = null;
let storage = null;
let isInitializing = false;
let initPromise = null;

function initFirebase() {
  if (typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (app && auth && db) {
    return Promise.resolve(app);
  }

  if (isInitializing && initPromise) {
    return initPromise;
  }
  isInitializing = true;
  initPromise = new Promise((resolve, reject) => {
    try {
      const existingApps = getApps();
      if (existingApps.length > 0) {
        app = existingApps[0];
      } else {
        const config = getFirebaseConfig();
        app = initializeApp(config);
      }

      if (!app) {
        throw new Error('Firebase app is null after initialization');
      }

      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);

      isInitializing = false;
      resolve(app);
    } catch (error) {
      isInitializing = false;
      console.error('Firebase initialization error:', error);
      reject(error);
    }
  });

  return initPromise;
}

if (typeof window !== 'undefined') {
  initFirebase().catch(err => {
    console.error('Failed to initialize Firebase on load:', err);
  });
}
export async function getAuthInstance() {
  if (typeof window === 'undefined') return null;
  
  if (!auth) {
    if (isInitializing && initPromise) {
      await initPromise;
    } else if (!app) {
      await initFirebase();
    }
    
    if (!auth && app) {
      try {
        auth = getAuth(app);
      } catch (error) {
        console.error('Error getting auth:', error);
        return null;
      }
    }
  }
  
  return auth;
}

export async function getDbInstance() {
  if (typeof window === 'undefined') return null;
  
  if (!db) {
    if (isInitializing && initPromise) {
      await initPromise;
    } else if (!app) {
      await initFirebase();
    }
    
    if (!db && app) {
      try {
        db = getFirestore(app);
      } catch (error) {
        console.error('Error getting db:', error);
        return null;
      }
    }
  }
  
  return db;
}

export async function getStorageInstance() {
  if (typeof window === 'undefined') return null;
  
  if (!storage) {
    if (isInitializing && initPromise) {
      await initPromise;
    } else if (!app) {
      await initFirebase();
    }
    
    if (!storage && app) {
      try {
        storage = getStorage(app);
      } catch (error) {
        console.error('Error getting storage:', error);
        return null;
      }
    }
  }
  
  return storage;
}

export { auth, db, storage };
export default app;

