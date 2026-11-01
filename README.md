# Questra

A student-teacher doubt-solving platform with structured subjects, anonymous questioning, teacher verification, and resource uploads.

## 🚀 Features

- **Landing Page**: Beautiful hero section with clear CTAs
- **Authentication**: Firebase Auth with role-based access (Student/Teacher)
- **Doubt System**: 
  - Students can ask questions anonymously or with their name
  - Choose subject (Physics, Math, Chemistry) and topic
  - Attach files (images, PDFs, audio, video)
  - View replies with teacher verification
- **Teacher Dashboard**: 
  - View all doubts by subject
  - Reply to doubts
  - Mark replies as "Teacher Verified"
  - Upload resources
- **Notes Page**: Browse and download teacher-uploaded resources with filtering and sorting
- **Upload Page**: Teacher-only page for uploading study materials

## 🛠️ Tech Stack

- **Frontend**: Astro + React + TailwindCSS
- **Backend**: Firebase (Auth + Firestore + Storage)
- **Styling**: TailwindCSS

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url> Questra
cd Questra
```

2. Install dependencies:
```bash
npm install
```

3. Set up Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Set up Firebase Storage
   - Copy `.env.example` to `.env` and fill in your Firebase credentials

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## 🔧 Firebase Setup

1. **Firestore Collections**:
   - `users`: User profiles with role (student/teacher)
   - `questions`: Student questions/doubts
   - `notes`: Teacher-uploaded resources
   - `questions/{questionId}/replies`: Replies to questions

2. **Firestore Security Rules** (recommended):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
      
      match /replies/{replyId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
        allow update: if request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      }
    }
    
    match /notes/{noteId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
  }
}
```

3. **Storage Rules** (recommended):
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /questions/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /notes/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    match /replies/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## 📁 Project Structure

```
Questra/
├── src/
│   ├── components/       # Reusable components
│   │   ├── NavBar.astro
│   │   ├── Footer.astro
│   │   ├── DoubtCard.astro
│   │   ├── ReplyCard.astro
│   │   ├── NoteCard.astro
│   │   ├── SubjectDropdown.tsx
│   │   ├── LoginForm.tsx
│   │   ├── AskDoubtForm.tsx
│   │   ├── UploadForm.tsx
│   │   ├── DoubtsList.tsx
│   │   ├── NotesList.tsx
│   │   ├── DoubtDetail.tsx
│   │   └── TeacherDashboard.tsx
│   ├── layouts/          # Layout components
│   │   └── Layout.astro
│   ├── lib/              # Firebase and utility functions
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   ├── firestore.js
│   │   └── storage.js
│   ├── pages/            # Astro pages
│   │   ├── index.astro
│   │   ├── login.astro
│   │   ├── ask.astro
│   │   ├── doubts.astro
│   │   ├── doubts/[id].astro
│   │   ├── notes.astro
│   │   ├── upload.astro
│   │   └── dashboard.astro
│   └── styles/
│       └── global.css
├── public/               # Static assets
├── .env.example         # Environment variables template
└── package.json
```

## 🎯 Usage

1. **Students**:
   - Sign up/Login
   - Browse notes and doubts
   - Ask questions (anonymously or with name)
   - View replies and verified answers

2. **Teachers**:
   - Sign up/Login with teacher role
   - Access Teacher Dashboard
   - Reply to doubts
   - Verify answers
   - Upload study resources

## 🚢 Deployment

The app can be deployed to:
- **Vercel**: `npm run build` and deploy the `dist` folder
- **Netlify**: Connect your repository and set build command to `npm run build`
- **Firebase Hosting**: `firebase deploy`

## 🤝 Contributing

This is a private project. For questions or issues, please contact the project maintainers.
