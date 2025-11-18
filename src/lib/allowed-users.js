import allowedUsersData from './allowed-users.json';

export function getAllowedUsersFromEnv() {
  try {
    return allowedUsersData.map(user => ({
      ...user,
      email: user.email.toLowerCase().trim()
    }));
  } catch (error) {
    console.error('Error loading allowed users:', error);
    return [];
  }
}

export function isEmailAllowed(email) {
  const allowedUsers = getAllowedUsersFromEnv();
  const emailLower = email.toLowerCase().trim();
  
  return allowedUsers.some(user => user.email === emailLower);
}

export function getAllowedUserData(email) {
  const allowedUsers = getAllowedUsersFromEnv();
  const emailLower = email.toLowerCase().trim();
  
  return allowedUsers.find(user => user.email === emailLower) || null;
}

