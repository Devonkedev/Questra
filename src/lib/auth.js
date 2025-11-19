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
    
    // Create user document in Firestore FIRST (before email verification)
    // This ensures the user exists in Firestore even if email verification fails
    if (db) {
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          role,
          subjects,
          email,
          emailVerified: false,
          createdAt: new Date()
        });
      } catch (dbError) {
        console.error('Error creating user document:', dbError);
        // Don't fail signup if Firestore write fails - user is still created in Auth
        // They can access the app, but might need to contact support
      }
    }
    
    // Send verification email
    let emailVerificationSent = false;
    let verificationError = null;
    
    try {
      // Get the current origin for redirect URL
      let continueUrl = '/login';
      if (typeof window !== 'undefined') {
        try {
          continueUrl = window.location.origin + '/login';
        } catch (e) {
          continueUrl = '/login';
        }
      }
      
      // Try with full URL first
      try {
        const actionCodeSettings = {
          url: continueUrl,
          handleCodeInApp: false
        };
        
        await sendEmailVerification(user, actionCodeSettings);
        emailVerificationSent = true;
        console.log('✅ Verification email sent successfully');
      } catch (urlError) {
        // If domain not authorized, try without actionCodeSettings
        if (urlError.message && urlError.message.includes('unauthorized-continue-uri')) {
          console.warn('⚠️ Domain not authorized, trying without redirect URL');
          try {
            await sendEmailVerification(user);
            emailVerificationSent = true;
            console.log('✅ Verification email sent (without redirect URL)');
          } catch (fallbackError) {
            console.error('❌ Failed to send verification email even without URL:', fallbackError);
            verificationError = fallbackError.message;
          }
        } else {
          throw urlError;
        }
      }
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      verificationError = error.message;
      emailVerificationSent = false;
    }
    
    // Return success with verification status
    const result = { 
      success: true, 
      user, 
      emailVerificationSent 
    };
    
    // Add warning if verification email failed
    if (!emailVerificationSent && verificationError) {
      result.warning = `Account created successfully! However, the verification email could not be sent: ${verificationError}. Please use "Resend Verification Email" after logging in.`;
    } else if (!emailVerificationSent) {
      result.warning = 'Account created successfully! However, the verification email could not be sent. Please use "Resend Verification Email" after logging in.';
    }
    
    return result;
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
    
    // Try to get origin, but use fallback if not available
    let continueUrl = '/login';
    if (typeof window !== 'undefined') {
      try {
        continueUrl = window.location.origin + '/login';
      } catch (e) {
        continueUrl = '/login';
      }
    }
    
    await sendEmailVerification(auth.currentUser, {
      url: continueUrl,
      handleCodeInApp: false
    });
    return { success: true, message: 'Verification email sent! Please check your inbox and click the verification link.' };
  } catch (error) {
    console.error('Verification email error:', error);
    
    // Provide helpful error message for domain issues
    if (error.message && error.message.includes('unauthorized-continue-uri')) {
      return { 
        success: false, 
        error: 'Domain not authorized in Firebase. Please add your domain to Firebase Console → Authentication → Settings → Authorized domains, or contact support.' 
      };
    }
    
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

