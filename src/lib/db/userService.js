import User from './userModel.js';

/**
 * Create a new user
 * @param {Object} userData - User data object
 * @param {string} userData.username - Username
 * @param {string} userData.email - Email address
 * @param {string} userData.passwordHash - Hashed password
 * @param {boolean} [userData.isAdmin=false] - Admin status
 * @returns {Promise<Object>} Created user object
 */
export async function createUser(userData) {
  try {
    const user = new User(userData);
    const savedUser = await user.save();
    
    // Return user without password hash
    const { passwordHash, ...userWithoutPassword } = savedUser.toObject();
    return userWithoutPassword;
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      const field = Object.keys(error.keyPattern)[0];
      throw new Error(`${field} already exists`);
    }
    throw error;
  }
}

/**
 * Find user by email address
 * @param {string} email - Email address to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
export async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    return user;
  } catch (error) {
    throw error;
  }
} 