// Authentication helper functions
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from './firebase';
import { isEmailAllowed } from './firestore.js';

/**
 * Sign in with email and password
 */
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign up with email and password
 * Only allows signup if email is in the allowed users list
 */
export async function signUp(email, password, name, role = 'student', subjects = []) {
  try {
    // Check if email is in allowed list
    const isAllowed = await isEmailAllowed(email);
    
    if (!isAllowed) {
      return { 
        success: false, 
        error: 'Your email is not authorized to sign up. Please contact an administrator.' 
      };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get the allowed user data to get the correct role
    const emailLower = email.toLowerCase().trim();
    const q = query(collection(db, 'allowedUsers'), where('email', '==', emailLower));
    const querySnapshot = await getDocs(q);
    
    let allowedUserData = null;
    if (!querySnapshot.empty) {
      allowedUserData = querySnapshot.docs[0].data();
      // Use role from allowed list if it exists
      if (allowedUserData.role) {
        role = allowedUserData.role;
      }
    }
    
    // Create user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      name: allowedUserData?.name || name,
      role,
      subjects,
      email,
      createdAt: new Date()
    });
    
    return { success: true, user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sign out
 */
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Get current user data from Firestore
 */
export async function getCurrentUserData() {
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { uid: user.uid, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
}

/**
 * Subscribe to auth state changes
 */
export function onAuthStateChange(callback) {
  return onAuthStateChanged(auth, callback);
}

