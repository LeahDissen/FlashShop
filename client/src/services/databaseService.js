/**
 * @typedef {Object} ProjectData
 * @property {string} _id
 * @property {string} name
 * @property {any[]} elements
 * @property {any} canvasBackground
 * @property {string[]} uploadedImages
 * @property {string[]} uploadedBackgrounds
 * @property {string|null} selectedProduct
 * @property {string} [preview]
 * @property {string} createdAt
 * @property {string} updatedAt
 */

const DB_NAME = 'GiftShopDB';
const STORE_NAME = 'projects';
const DB_VERSION = 1;

// Helper to open the database
const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("IndexedDB error:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };
  });
};

// Simulating a MongoDB-like ID generator
const generateObjectId = () => {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
};

export const db = {
  // Save or Update (Upsert)
  save: async (project) => {
    const dbInstance = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const now = new Date().toISOString();

      // If ID exists, try to get existing record to preserve createdAt
      if (project._id) {
        const getRequest = store.get(project._id);

        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          const finalProject = {
            ...existing, // Keep existing fields
            ...project,  // Overwrite
            _id: project._id,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now
          };

          const putRequest = store.put(finalProject);
          putRequest.onsuccess = () => resolve(finalProject);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      } else {
        // New record
        const finalProject = {
          ...project,
          _id: generateObjectId(),
          createdAt: now,
          updatedAt: now
        };

        const addRequest = store.add(finalProject);
        addRequest.onsuccess = () => resolve(finalProject);
        addRequest.onerror = () => reject(addRequest.error);
      }
    });
  },

  // Get All (Find)
  findAll: async () => {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = request.result;
        // Sort client-side by updatedAt desc
        if (results) {
          results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        }
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  },

  // Find by ID
  findById: async (id) => {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  // Delete
  delete: async (id) => {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
};