import { User, LoginCredentials, SignupCredentials } from '../types/auth';

// Constants for localStorage keys
const USER_KEY = 'auth_user';
const TOKEN_KEY = 'auth_token';

// Generate a random token (in a real app, this would be a JWT from the server)
const generateToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Save user data to localStorage
export const saveUserToStorage = (user: User): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

// Save token to localStorage
export const saveTokenToStorage = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token);
};

// Get user from localStorage
export const getUserFromStorage = (): User | null => {
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr) as User;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
    return null;
  }
};

// Get token from localStorage
export const getTokenFromStorage = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Clear auth data from localStorage
export const clearAuthFromStorage = (): void => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!getTokenFromStorage();
};

// Mock login function (will be replaced with actual API call later)
export const loginUser = async (credentials: LoginCredentials): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // In a real app, this would validate against a database
  // For now, we'll just check if the user exists in localStorage
  const storedUsers = localStorage.getItem('users');
  const users = storedUsers ? JSON.parse(storedUsers) : [];
  
  const user = users.find((u: User & { password: string }) => 
    u.email === credentials.email && u.password === credentials.password
  );
  
  if (!user) {
    throw new Error('Invalid email or password');
  }
  
  // Generate and save token
  const token = generateToken();
  saveTokenToStorage(token);
  
  // Save user data (without password)
  const { password, ...userWithoutPassword } = user;
  saveUserToStorage(userWithoutPassword);
  
  return userWithoutPassword;
};

// Mock signup function (will be replaced with actual API call later)
export const signupUser = async (credentials: SignupCredentials): Promise<User> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Check if user already exists
  const storedUsers = localStorage.getItem('users');
  const users = storedUsers ? JSON.parse(storedUsers) : [];
  
  if (users.some((u: User) => u.email === credentials.email)) {
    throw new Error('User with this email already exists');
  }
  
  // Create new user
  const newUser = {
    id: Date.now().toString(),
    email: credentials.email,
    password: credentials.password, // In a real app, this would be hashed
    createdAt: new Date().toISOString()
  };
  
  // Save to "database" (localStorage)
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  
  // Generate and save token
  const token = generateToken();
  saveTokenToStorage(token);
  
  // Save user data (without password)
  const { password, ...userWithoutPassword } = newUser;
  saveUserToStorage(userWithoutPassword);
  
  return userWithoutPassword;
}; 