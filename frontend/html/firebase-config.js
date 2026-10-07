// ==================== FIREBASE CONFIGURATION (Version 8) ====================
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDJGQnbpJbk6KWb0C413sB97SUI5KJr4us",
  authDomain: "neips2025.firebaseapp.com",
  projectId: "neips2025",
  storageBucket: "neips2025.firebasestorage.app",
  messagingSenderId: "186210248339",
  appId: "1:186210248339:web:5ed611a5ae36e1ad438f66"
};

// Global Firebase instances
let firebaseApp = null;
let firebaseDb = null;
let firebaseAuth = null;

// ==================== FIREBASE INITIALIZATION (Version 8) ====================
function initializeFirebase() {
  console.log('🔄 Initializing Firebase v8...');
  
  try {
    // Check if Firebase is loaded
    if (typeof firebase === 'undefined') {
      console.error('❌ Firebase scripts not loaded!');
      console.log('💡 Make sure you have:');
      console.log('1. firebase-app.js (v8) in HTML');
      console.log('2. firebase-auth.js (v8) in HTML');
      console.log('3. firebase-firestore.js (v8) in HTML');
      return false;
    }
    
    console.log('✅ Firebase v8 SDK found');
    
    // Check if already initialized
    if (firebase.apps.length > 0) {
      firebaseApp = firebase.apps[0];
      console.log('✅ Firebase already initialized');
    } else {
      // Initialize Firebase (v8 syntax)
      firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
      console.log('✅ Firebase v8 initialized successfully');
    }
    
    // Initialize services (v8 syntax - no .compat)
    firebaseDb = firebase.firestore();
    firebaseAuth = firebase.auth();
    
    console.log('✅ Firestore loaded:', firebaseDb ? 'Yes' : 'No');
    console.log('✅ Auth loaded:', firebaseAuth ? 'Yes' : 'No');
    
    // Test connection
    testFirebaseConnection();
    
    return true;
    
  } catch (error) {
    console.error('❌ Firebase v8 initialization error:', error);
    console.error('Stack:', error.stack);
    return false;
  }
}

// ==================== TEST FIREBASE CONNECTION ====================
function testFirebaseConnection() {
  console.log('🔗 Testing Firebase v8 connection...');
  
  if (!firebaseAuth) {
    console.log('⚠️ Firebase Auth not available');
    return;
  }
  
  // Listen for auth state changes
  firebaseAuth.onAuthStateChanged((user) => {
    if (user) {
      console.log('✅ Firebase Auth connected - User:', user.email);
    } else {
      console.log('✅ Firebase Auth connected - No user signed in');
    }
  });
  
  // Test Firestore
  if (firebaseDb) {
    firebaseDb.collection('test').limit(1).get()
      .then(() => {
        console.log('🎉 Firestore connection successful!');
      })
      .catch((error) => {
        console.log('⚠️ Firestore test error:', error.message);
      });
  }
}

// ==================== GET FIREBASE INSTANCES ====================
function getFirebase() {
  if (!firebaseApp) {
    console.log('🔄 Firebase not initialized, initializing now...');
    initializeFirebase();
  }
  return {
    app: firebaseApp,
    db: firebaseDb,
    auth: firebaseAuth
  };
}

// ==================== AUTO-INITIALIZE ON LOAD ====================
// Wait for DOM and Firebase scripts to load
document.addEventListener('DOMContentLoaded', function() {
  console.log('📄 DOM loaded, checking Firebase v8...');
  
  // Check if Firebase is already loaded
  if (typeof firebase !== 'undefined') {
    console.log('🔥 Firebase v8 SDK detected, initializing...');
    initializeFirebase();
  } else {
    console.log('⏳ Firebase v8 not loaded yet, waiting...');
    
    // Wait for Firebase to load
    const checkInterval = setInterval(() => {
      if (typeof firebase !== 'undefined') {
        clearInterval(checkInterval);
        console.log('🔥 Firebase v8 SDK loaded, initializing...');
        initializeFirebase();
      }
    }, 500);
    
    // Timeout after 10 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
      if (typeof firebase === 'undefined') {
        console.error('❌ TIMEOUT: Firebase v8 SDK never loaded!');
      }
    }, 10000);
  }
});

// ==================== SIMPLE FIREBASE FUNCTIONS FOR STAFF ====================

// Get current user
function getCurrentUser() {
  const firebase = getFirebase();
  return firebase.auth ? firebase.auth.currentUser : null;
}

// Sign out
function signOutFirebase() {
  const firebase = getFirebase();
  if (firebase.auth) {
    return firebase.auth.signOut();
  }
  return Promise.resolve();
}

// Create user with email/password
function createUserWithEmail(email, password) {
  const firebase = getFirebase();
  if (firebase.auth) {
    return firebase.auth.createUserWithEmailAndPassword(email, password);
  }
  return Promise.reject(new Error('Firebase Auth not available'));
}

// Sign in with email/password
function signInWithEmail(email, password) {
  const firebase = getFirebase();
  if (firebase.auth) {
    return firebase.auth.signInWithEmailAndPassword(email, password);
  }
  return Promise.reject(new Error('Firebase Auth not available'));
}

// Save staff data to Firestore
function saveStaffToFirestore(staffId, data) {
  const firebase = getFirebase();
  if (firebase.db) {
    return firebase.db.collection('staff').doc(staffId).set(data, { merge: true });
  }
  return Promise.reject(new Error('Firestore not available'));
}

// Get staff data from Firestore
function getStaffFromFirestore(staffId) {
  const firebase = getFirebase();
  if (firebase.db) {
    return firebase.db.collection('staff').doc(staffId).get();
  }
  return Promise.reject(new Error('Firestore not available'));
}