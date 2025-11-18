# Allowed Users System

The signup system is now restricted to only allow users whose emails are in the allowed users list.

## How It Works

1. **Allowed Users Collection**: A Firestore collection called `allowedUsers` stores all authorized emails
2. **Signup Check**: When a user tries to sign up, the system checks if their email exists in the allowed list
3. **Role Assignment**: If the email is in the list, the user's role (student/teacher) is automatically set from the allowed list

## Importing Users from Excel

### Step 1: Export Excel to CSV

1. Open your Excel file with the list of users
2. Make sure it has columns: `email`, `name`, `role`
3. Save/Export as CSV format (Comma Separated Values)
4. Name it `allowed-users.csv`

### Step 2: Format the CSV

Your CSV should look like this:

```csv
email,name,role
student1@example.com,John Doe,student
student2@example.com,Jane Smith,student
teacher1@example.com,Dr. Sarah Johnson,teacher
teacher2@example.com,Prof. Michael Brown,teacher
```

**Important:**
- First row must be headers: `email,name,role`
- Email is required and must be valid
- Name is optional (can be empty)
- Role defaults to `student` if not specified
- Emails are case-insensitive (automatically converted to lowercase)

### Step 3: Place CSV in Project Root

Place `allowed-users.csv` in the root of your project (same level as `package.json`)

### Step 4: Run the Import Script

```bash
node scripts/import-users.js
```

The script will:
- ✅ Import all users from the CSV
- ⏭️ Skip duplicates (emails already in the list)
- ❌ Show errors for invalid entries
- 📊 Display a summary at the end

## Manual Management

You can also manually add users through the Firestore console:

1. Go to Firebase Console > Firestore Database
2. Create a collection called `allowedUsers`
3. Add documents with these fields:
   - `email` (string, lowercase)
   - `name` (string, optional)
   - `role` (string: "student" or "teacher")
   - `createdAt` (timestamp)

## Firestore Security Rules

Add these rules to your Firestore security rules to protect the allowedUsers collection:

```javascript
match /allowedUsers/{userId} {
  // Only authenticated users can read (for checking during signup)
  allow read: if request.auth != null;
  // Only admins can write (you'll need to implement admin check)
  allow write: if false; // Disable direct writes, use the import script
}
```

## Testing

1. Try signing up with an email **not** in the allowed list → Should show error
2. Try signing up with an email **in** the allowed list → Should succeed
3. Check that the role is correctly assigned from the allowed list

## Troubleshooting

**Error: "Your email is not authorized to sign up"**
- Make sure the email is in the `allowedUsers` collection
- Check that the email is lowercase in Firestore
- Verify the email matches exactly (case-insensitive)

**Import script fails**
- Make sure `.env` file has correct Firebase credentials
- Check that CSV file is in the project root
- Verify CSV format matches the example

