import express from 'express';
import { sendVerificationCode, verifyCode } from '../services/emailService.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Send verification code
router.post('/send-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }
    
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }
    
    const result = await sendVerificationCode(email);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
    
  } catch (error) {
    console.error('Error in send-verification endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
});

// Verify code and update email
router.post('/verify-and-update', async (req, res) => {
  try {
    const { newEmail, verificationCode, currentEmail, password } = req.body;
    
    if (!newEmail || !verificationCode || !currentEmail || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }
    
    // Verify the code first
    const verificationResult = verifyCode(newEmail, verificationCode);
    
    if (!verificationResult.success) {
      return res.status(400).json(verificationResult);
    }
    
    // TODO: Verify current email and password against your authentication system
    // For now, we'll proceed with updating the email
    
    // Update email in admin-users.json
    const adminUsersPath = path.join(process.cwd(), 'server', 'account', 'admin-users.json');
    const adminData = JSON.parse(fs.readFileSync(adminUsersPath, 'utf8'));
    
    // Find and update the user
    let userUpdated = false;
    const environment = process.env.NODE_ENV || 'development';
    
    if (adminData[environment] && adminData[environment].users) {
      const userIndex = adminData[environment].users.findIndex(
        (user: any) => user.email === currentEmail
      );
      
      if (userIndex !== -1) {
        adminData[environment].users[userIndex].email = newEmail;
        userUpdated = true;
      }
    }
    
    if (!userUpdated) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Save the updated data
    fs.writeFileSync(adminUsersPath, JSON.stringify(adminData, null, 2));
    
    res.json({ 
      success: true, 
      message: 'Email updated successfully' 
    });
    
  } catch (error) {
    console.error('Error in verify-and-update endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update email' 
    });
  }
});

export default router;
