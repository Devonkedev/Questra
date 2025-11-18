// Firebase Storage helper functions
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(file, path) {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return { success: true, url: downloadURL };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Upload multiple files
 */
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

