// ============================================================
//  CONFIGURATION FIREBASE – À compléter avant utilisation
// ============================================================
//  1. Aller sur https://console.firebase.google.com
//  2. Créer un nouveau projet (ex: "voyage-japon-2026")
//  3. Cliquer sur "</>" pour ajouter une app Web
//  4. Copier les valeurs de firebaseConfig ci-dessous
//  5. Dans Firestore Database → Règles, mettre :
//       rules_version = '2';
//       service cloud.firestore {
//         match /databases/{database}/documents {
//           match /{document=**} {
//             allow read, write: if true;
//           }
//         }
//       }
// ============================================================

export const firebaseConfig = {
  apiKey: "AIzaSyAUrnhg63A5wW-TDhswHyILsz16QyBdVlc",
  authDomain: "voyage-japon-5e9ea.firebaseapp.com",
  projectId: "voyage-japon-5e9ea",
  storageBucket: "voyage-japon-5e9ea.firebasestorage.app",
  messagingSenderId: "818493844452",
  appId: "1:818493844452:web:669e652709dbeb6d65f5f1"
};

export const IS_CONFIGURED = true;

