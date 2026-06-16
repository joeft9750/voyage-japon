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
  apiKey: "VOTRE_API_KEY",
  authDomain: "VOTRE_PROJECT.firebaseapp.com",
  projectId: "VOTRE_PROJECT_ID",
  storageBucket: "VOTRE_PROJECT.firebasestorage.app",
  messagingSenderId: "VOTRE_SENDER_ID",
  appId: "VOTRE_APP_ID"
};

export const IS_CONFIGURED = firebaseConfig.apiKey !== "VOTRE_API_KEY";
