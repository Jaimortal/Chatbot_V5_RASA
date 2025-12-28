import { createSampleUser } from '../utils/passwordUtils.js';

// Generate a new admin user with hashed password
async function generateAdminUser() {
  const email = "newadmin@yourdomain.com"; // Change this to your desired email
  const name = "New Admin"; // Change this to the desired name
  const password = "securePassword123"; // Change this to the desired password
  
  try {
    const newUser = await createSampleUser(email, name, password);
    console.log("Generated admin user:");
    console.log(JSON.stringify(newUser, null, 2));
    console.log("\nCopy this object and add it to the users array in admin-users.json");
  } catch (error) {
    console.error("Error generating admin user:", error);
  }
}

// Run the function
generateAdminUser();
