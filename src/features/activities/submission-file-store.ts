import type { Submission } from './activity-model';

const databaseName = 'jamaster-submission-files';
const storeName = 'files';

function openStore() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!globalThis.indexedDB)
      return reject(new Error('Bu tarayıcı yerel dosya saklamayı desteklemiyor.'));
    const request = indexedDB.open(databaseName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Yerel dosya alanı açılamadı.'));
  });
}

export async function storeSubmissionFiles(submissionId: string, files: File[]) {
  const database = await openStore();
  try {
    return await new Promise<NonNullable<Submission['files']>>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const records = files.map((file) => {
        const storageKey = `${submissionId}:${crypto.randomUUID()}`;
        store.put(file, storageKey);
        return {
          storageKey,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
        };
      });
      transaction.oncomplete = () => resolve(records);
      transaction.onerror = () =>
        reject(transaction.error || new Error('Dosyalar yerel alana kaydedilemedi.'));
      transaction.onabort = () =>
        reject(transaction.error || new Error('Dosya kaydı tamamlanamadı.'));
    });
  } finally {
    database.close();
  }
}

export async function removeSubmissionFiles(files: NonNullable<Submission['files']>) {
  const database = await openStore();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      files.forEach((file) => store.delete(file.storageKey));
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    database.close();
  }
}

export async function downloadSubmissionFile(file: NonNullable<Submission['files']>[number]) {
  const database = await openStore();
  try {
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const request = database
        .transaction(storeName, 'readonly')
        .objectStore(storeName)
        .get(file.storageKey);
      request.onsuccess = () =>
        resolve(request.result instanceof Blob ? request.result : undefined);
      request.onerror = () => reject(request.error);
    });
    if (!blob) throw new Error('Dosya bu cihazdaki yerel alanda bulunamadı.');
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = file.name;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } finally {
    database.close();
  }
}
