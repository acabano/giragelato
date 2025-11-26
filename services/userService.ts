
import { User, PlayRecord } from '../types';

const USER_STORAGE_KEY = 'wheelOfFortuneUser';

let allUsers: User[] = [];

/**
 * Fetches all users from the JSON file. This should be called once on app load.
 * @param forceReload If true, will reload users even if they are already loaded
 */
export async function loadUsers(forceReload: boolean = false): Promise<void> {
    if (allUsers.length > 0 && !forceReload) return;
    try {
        const timestamp = new Date().getTime();
        const response = await fetch(`${import.meta.env.BASE_URL}api/get-users.php?t=${timestamp}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) throw new Error('Failed to load users.json');
        allUsers = await response.json();
    } catch (error) {
        console.error("Could not load users:", error);
        allUsers = [];
    }
}

/**
 * Forces a reload of all users from the JSON file.
 * Useful after creating new users or modifying the users file.
 */
export async function reloadUsers(): Promise<void> {
    await loadUsers(true);
}

/**
 * Attempts to log in a user with the given credentials.
 * On success, stores the user data in localStorage.
 * @returns The user object on success, or null on failure.
 */
export async function login(username: string, password_provided: string): Promise<User | null> {
    // Always reload users before login to ensure we have the latest data
    await loadUsers(true);

    const userAccount = allUsers.find(u => u.user === username && u.password === password_provided);
    if (userAccount) {
        // Create a user object without the password to store in the session
        const sessionUser: User = {
            user: userAccount.user,
            role: userAccount.role,
            history: userAccount.history,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sessionUser));
        return sessionUser;
    }
    return null;
}

/**
 * Logs the current user out by clearing their data from localStorage.
 */
export function logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Retrieves the currently logged-in user from localStorage.
 * @returns The user object if logged in, otherwise null.
 */
export function getCurrentUser(): User | null {
    const savedUser = localStorage.getItem(USER_STORAGE_KEY);
    return savedUser ? JSON.parse(savedUser) : null;
}

/**
 * Adds a new play record to the current user's history and updates localStorage.
 * @param newPlay The new play record to add.
 * @returns The updated user object.
 */
export function updateUserHistory(newPlay: PlayRecord): User | null {
    const currentUser = getCurrentUser();
    if (currentUser) {
        const updatedUser = {
            ...currentUser,
            history: [...currentUser.history, newPlay],
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
        return updatedUser;
    }
    return null;
}
