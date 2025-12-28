import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// Hash a password
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verify a password against a hash
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

// Generate a sample user with hashed password
export async function createSampleUser(email: string, name: string, plainPassword: string) {
  const hashedPassword = await hashPassword(plainPassword);
  
  return {
    email,
    name,
    role: "admin" as const,
    googleId: null,
    enabled: true,
    password: hashedPassword
  };
}

// Example usage:
// const newUser = await createSampleUser("newadmin@example.com", "New Admin", "securePassword123");
// console.log(JSON.stringify(newUser, null, 2));
