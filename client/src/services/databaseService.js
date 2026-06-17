const DB_NAME = 'GiftShopDB';
const STORE_NAME = 'projects';
const DB_VERSION = 2;

const openDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB error:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      let store;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        store = db.createObjectStore(STORE_NAME, { keyPath: '_id' });
      } else {
        store = event.target.transaction.objectStore(STORE_NAME);
      }

      if (!store.indexNames.contains('updatedAt')) {
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
      if (!store.indexNames.contains('userId')) {
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
};

const generateObjectId = () => {
  const timestamp = (new Date().getTime() / 1000 | 0).toString(16);
  return timestamp + 'xxxxxxxxxxxxxxxx'.replace(/[x]/g, () => (Math.random() * 16 | 0).toString(16)).toLowerCase();
};

const belongsToUser = (project, userId) => {
  const projectUserId = project?.userId ?? null;
  const currentUserId = userId ?? null;
  return projectUserId === currentUserId;
};

const filterProjectsForUser = (projects, userId) =>
  projects.filter((project) => belongsToUser(project, userId));

export const db = {
  save: async (project) => {
    const dbInstance = await openDB();

    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const now = new Date().toISOString();
      const userId = project.userId ?? null;

      if (project._id) {
        const getRequest = store.get(project._id);

        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          if (existing && !belongsToUser(existing, userId)) {
            reject(new Error('Unauthorized project update'));
            return;
          }

          const finalProject = {
            ...existing,
            ...project,
            _id: project._id,
            userId,
            createdAt: existing ? existing.createdAt : now,
            updatedAt: now,
          };

          const putRequest = store.put(finalProject);
          putRequest.onsuccess = () => resolve(finalProject);
          putRequest.onerror = () => reject(putRequest.error);
        };

        getRequest.onerror = () => reject(getRequest.error);
      } else {
        const finalProject = {
          ...project,
          _id: generateObjectId(),
          userId,
          createdAt: now,
          updatedAt: now,
        };

        const addRequest = store.add(finalProject);
        addRequest.onsuccess = () => resolve(finalProject);
        addRequest.onerror = () => reject(addRequest.error);
      }
    });
  },

  findAll: async (userId = null) => {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const results = filterProjectsForUser(request.result || [], userId);
        results.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        resolve(results);
      };

      request.onerror = () => reject(request.error);
    });
  },

  findById: async (id, userId = null) => {
    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(id);

      request.onsuccess = () => {
        const project = request.result;
        if (!project || !belongsToUser(project, userId)) {
          resolve(null);
          return;
        }
        resolve(project);
      };

      request.onerror = () => reject(request.error);
    });
  },

  delete: async (id, userId = null) => {
    const project = await db.findById(id, userId);
    if (!project) {
      throw new Error('Project not found or unauthorized');
    }

    const dbInstance = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = dbInstance.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
};
