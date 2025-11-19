import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getAuthInstance, getDbInstance } from './firebase';
import { isEmailAllowed, getAllowedUserData } from './allowed-users.js';

export async function signIn(email, password) {
  try {
    const auth = await getAuthInstance();
    
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized. Please refresh the page and try again.' };
    }
    
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    const emailVerified = user.emailVerified;
    
    return { 
      success: true, 
      user,
      emailVerified 
    };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
}

export async function signUp(email, password, name, role = 'student', subjects = []) {
  try {
    const auth = await getAuthInstance();
    const db = await getDbInstance();
    
    if (!auth) {
      console.error('Auth is null, Firebase may not be initialized');
      return { success: false, error: 'Firebase Auth is not initialized. Please refresh the page and try again.' };
    }
    
    const isAllowed = isEmailAllowed(email);
    
    if (!isAllowed) {
      return { 
        success: false, 
        error: 'Your email is not authorized to sign up. Please contact an administrator.' 
      };
    }
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    const allowedUserData = getAllowedUserData(email);
    
    if (allowedUserData) {
      if (allowedUserData.role) {
        role = allowedUserData.role;
      }
      if (allowedUserData.name) {
        name = allowedUserData.name;
      }
    }
    
    try {
      const actionCodeSettings = typeof window !== 'undefined' 
        ? {
            url: window.location.origin + '/login',
            handleCodeInApp: false
          }
        : undefined;
      
      await sendEmailVerification(user, actionCodeSettings);
    } catch (error) {
      console.error('Error sending verification email:', error);
      return { 
        success: false, 
        error: `Account created but failed to send verification email: ${error.message}. Please contact support.` 
      };
    }
    
    if (db) {
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        role,
        subjects,
        email,
        emailVerified: false,
        createdAt: new Date()
      });
    }
    
    return { success: true, user, emailVerificationSent: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signOutUser() {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function getCurrentUserData() {
  const auth = await getAuthInstance();
  const db = await getDbInstance();
  
  if (!auth) return null;
  const user = auth.currentUser;
  if (!user) return null;
  
  try {
    if (!db) return null;
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

export async function onAuthStateChange(callback) {
  const auth = await getAuthInstance();
  if (!auth) {
    console.error('Firebase Auth is not initialized.');
    return () => {}; // Return a no-op unsubscribe function
  }
  return onAuthStateChanged(auth, callback);
}

export async function resetPassword(email) {
  try {
    const auth = await getAuthInstance();
    if (!auth) {
      return { success: false, error: 'Firebase Auth is not initialized.' };
    }
    
    await sendPasswordResetEmail(auth, email);
    return { success: true, message: 'Password reset email sent! Check your inbox.' };
  } catch (error) {
    console.error('Password reset error:', error);
    return { success: false, error: error.message };
  }
}

export async function sendVerificationEmail() {
  try {
    const auth = await getAuthInstance();
    if (!auth || !auth.currentUser) {
      return { success: false, error: 'No user is signed in.' };
    }
    
    await sendEmailVerification(auth.currentUser, {
      url: typeof window !== 'undefined' ? window.location.origin + '/login' : undefined,
      handleCodeInApp: false
    });
    return { success: true, message: 'Verification email sent! Please check your inbox and click the verification link.' };
  } catch (error) {
    console.error('Verification email error:', error);
    return { success: false, error: error.message };
  }
}

export async function isEmailVerified() {
  try {
    const auth = await getAuthInstance();
    if (!auth || !auth.currentUser) {
      return false;
    }
    
    // Reload user to get latest verification status
    await reload(auth.currentUser);
    return auth.currentUser.emailVerified;
  } catch (error) {
    console.error('Error checking email verification:', error);
    return false;
  }
}

