import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { getDbInstance } from './firebase';

export async function getQuestions(filters = {}, maxResults = 50) {
  try {
    const db = await getDbInstance();
    if (!db) return [];
    
    // Build query with filters
    const constraints = [orderBy('createdAt', 'desc'), limit(maxResults)];
    
    if (filters.subject) {
      constraints.unshift(where('subject', '==', filters.subject));
    }
    
    if (filters.status) {
      constraints.unshift(where('status', '==', filters.status));
    }
    
    const q = query(collection(db, 'questions'), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting questions:', error);
    return [];
  }
}

export async function getQuestion(questionId) {
  try {
    const db = await getDbInstance();
    if (!db) return null;
    const docRef = doc(db, 'questions', questionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
        createdAt: docSnap.data().createdAt?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting question:', error);
    return null;
  }
}

export async function createQuestion(questionData) {
  try {
    const db = await getDbInstance();
    if (!db) return { success: false, error: 'Firestore is not initialized' };
    
    // Validate required fields
    if (!questionData.question || !questionData.subject || !questionData.topic) {
      return { success: false, error: 'Missing required fields: question, subject, and topic are required' };
    }
    
    const questionDoc = {
      ...questionData,
      createdAt: Timestamp.now(),
      status: 'open',
      // Ensure askedById is set for security rules
      askedById: questionData.askedById || questionData.askedBy || 'anonymous'
    };
    
    console.log('Creating question with data:', { ...questionDoc, question: questionDoc.question.substring(0, 50) + '...' });
    
    const docRef = await addDoc(collection(db, 'questions'), questionDoc);
    console.log('Question created successfully with ID:', docRef.id);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating question:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide more specific error messages
    let errorMessage = error.message;
    if (error.code === 'permission-denied') {
      errorMessage = 'Permission denied. Please ensure you are logged in and your Firestore security rules allow authenticated users to create questions.';
    } else if (error.code === 'unavailable') {
      errorMessage = 'Firestore is temporarily unavailable. Please try again in a moment.';
    }
    
    return { success: false, error: errorMessage };
  }
}

export async function getReplies(questionId) {
  try {
    const db = await getDbInstance();
    if (!db) return [];
    const q = query(
      collection(db, 'questions', questionId, 'replies'),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate()
    }));
  } catch (error) {
    console.error('Error getting replies:', error);
    return [];
  }
}

export async function addReply(questionId, replyData) {
  try {
    const db = await getDbInstance();
    if (!db) return { success: false, error: 'Firestore is not initialized' };
    const docRef = await addDoc(
      collection(db, 'questions', questionId, 'replies'),
      {
        ...replyData,
        timestamp: Timestamp.now(),
        isTeacherVerified: false
      }
    );
    
    // Update question status to answered
    await updateDoc(doc(db, 'questions', questionId), {
      status: 'answered'
    });
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding reply:', error);
    return { success: false, error: error.message };
  }
}

export async function verifyReply(questionId, replyId) {
  try {
    const db = await getDbInstance();
    if (!db) return { success: false, error: 'Firestore is not initialized' };
    await updateDoc(
      doc(db, 'questions', questionId, 'replies', replyId),
      { isTeacherVerified: true }
    );
    return { success: true };
  } catch (error) {
    console.error('Error verifying reply:', error);
    return { success: false, error: error.message };
  }
}

export async function getNotes(filters = {}, maxResults = 50) {
  try {
    const db = await getDbInstance();
    if (!db) return [];
    
    // Build query with filters
    const constraints = [orderBy('createdAt', 'desc'), limit(maxResults)];
    
    if (filters.subject) {
      constraints.unshift(where('subject', '==', filters.subject));
    }
    
    const q = query(collection(db, 'notes'), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting notes:', error);
    return [];
  }
}

export async function createNote(noteData) {
  try {
    const db = await getDbInstance();
    if (!db) return { success: false, error: 'Firestore is not initialized' };
    const docRef = await addDoc(collection(db, 'notes'), {
      ...noteData,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating note:', error);
    return { success: false, error: error.message };
  }
}

export async function isEmailAllowed(email) {
  try {
    const emailLower = email.toLowerCase().trim();
    const q = query(
      collection(db, 'allowedUsers'),
      where('email', '==', emailLower)
    );
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('Error checking allowed email:', error);
    return false;
  }
}

export async function addAllowedUser(email, name, role = 'student') {
  try {
    const emailLower = email.toLowerCase().trim();
    const q = query(
      collection(db, 'allowedUsers'),
      where('email', '==', emailLower)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return { success: false, error: 'Email already in allowed list' };
    }
    
    const docRef = await addDoc(collection(db, 'allowedUsers'), {
      email: emailLower,
      name,
      role,
      createdAt: Timestamp.now()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error adding allowed user:', error);
    return { success: false, error: error.message };
  }
}

export async function getAllowedUsers() {
  try {
    const q = query(collection(db, 'allowedUsers'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate()
    }));
  } catch (error) {
    console.error('Error getting allowed users:', error);
    return [];
  }
}

