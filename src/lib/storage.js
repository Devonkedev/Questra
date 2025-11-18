import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getStorageInstance } from './firebase';
export async function uploadFile(file, path) {
  try {
    const storage = await getStorageInstance();
    if (!storage) {
      return { success: false, error: 'Firebase Storage is not initialized.' };
    }
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

export async function uploadFiles(files, basePath) {
  try {
    const uploadPromises = files.map((file, index) => {
      const filePath = `${basePath}/${Date.now()}_${index}_${file.name}`;
      return uploadFile(file, filePath);
    });
    
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('Error uploading files:', error);
    return [];
  }
}

