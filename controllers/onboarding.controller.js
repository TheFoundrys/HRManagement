const { query } = require('../db'); // Assuming a db module exports a query function
const { generateToken, decodeToken, isTokenExpired } = require('../utils/onboardingToken');
const { sendEmployeeConfirmationEmail, sendHRNotificationEmail } = require('../services/emailService');

// 1. Generate Onboarding Link (HR only)
exports.generateLink = async (req, res) => {
  try {
    const { employeeId } = req.body; // null for generic

    // If specific, verify employee exists and isn't deleted
    if (employeeId) {
      const empRes = await query('SELECT id, is_deleted, is_self_submitted FROM employees WHERE id = $1', [employeeId]);
      if (empRes.rowCount === 0) {
        return res.status(404).json({ error: 'Employee not found' });
      }
      if (empRes.rows[0].is_deleted) {
        return res.status(400).json({ error: 'Cannot generate link for deleted employee' });
      }
      if (empRes.rows[0].is_self_submitted) {
        return res.status(400).json({ error: 'Employee has already submitted onboarding details' });
      }
    }

    const token = generateToken(employeeId);
    // Adjust domain based on environment
    const domain = process.env.FRONTEND_URL || 'https://yourdomain.com';
    const link = `${domain}/onboard/${token}`;

    res.status(200).json({ link });
  } catch (error) {
    console.error('Error generating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 2. Validate Link (Public)
exports.validateLink = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = decodeToken(token);

    if (!decoded) {
      return res.status(400).json({ status: 'invalid' });
    }

    if (isTokenExpired(decoded.timestamp)) {
      return res.status(400).json({ status: 'expired' });
    }

    if (!decoded.isGeneric) {
      // Specific link validation
      const empRes = await query('SELECT id, first_name, last_name, email, is_deleted, is_self_submitted FROM employees WHERE id = $1', [decoded.employeeId]);
      
      if (empRes.rowCount === 0) {
        return res.status(400).json({ status: 'invalid' });
      }
      
      const emp = empRes.rows[0];
      
      if (emp.is_deleted) {
        return res.status(400).json({ status: 'deleted' });
      }
      
      if (emp.is_self_submitted) {
        return res.status(400).json({ status: 'already_submitted' });
      }

      return res.status(200).json({ 
        status: 'valid', 
        employee: {
          firstName: emp.first_name,
          lastName: emp.last_name,
          email: emp.email
        }
      });
    }

    // Generic link
    res.status(200).json({ status: 'valid', type: 'generic' });
  } catch (error) {
    console.error('Error validating link:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// 3. Employee Self-Submit (Public)
exports.submitOnboarding = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = decodeToken(token);

    if (!decoded || isTokenExpired(decoded.timestamp)) {
      return res.status(400).json({ error: 'Invalid or expired link' });
    }

    const { firstName, lastName, email, phoneNumber, currentAddress, permanentAddress } = req.body;
    const files = req.files || {};

    let employeeId = decoded.employeeId;

    if (decoded.isGeneric) {
      // Check if email already exists
      const emailCheck = await query('SELECT id FROM employees WHERE email = $1', [email]);
      if (emailCheck.rowCount > 0) {
        return res.status(400).json({ error: 'Email already exists in the system' });
      }

      // Create new employee
      const insertRes = await query(
        `INSERT INTO employees 
         (first_name, last_name, email, phone_number, current_address, permanent_address, is_self_submitted, submitted_at) 
         VALUES ($1, $2, $3, $4, $5, $6, true, NOW()) RETURNING id`,
        [firstName, lastName, email, phoneNumber, currentAddress, permanentAddress]
      );
      employeeId = insertRes.rows[0].id;
    } else {
      // Specific link checks
      const empCheck = await query('SELECT is_deleted, is_self_submitted FROM employees WHERE id = $1', [employeeId]);
      if (empCheck.rowCount === 0 || empCheck.rows[0].is_deleted) {
        return res.status(400).json({ error: 'Employee record deleted or not found' });
      }
      if (empCheck.rows[0].is_self_submitted) {
        return res.status(400).json({ error: 'Onboarding already submitted' });
      }

      // Check email uniqueness if they changed it
      const emailCheck = await query('SELECT id FROM employees WHERE email = $1 AND id != $2', [email, employeeId]);
      if (emailCheck.rowCount > 0) {
        return res.status(400).json({ error: 'Email already exists in the system' });
      }

      // Update existing employee
      await query(
        `UPDATE employees 
         SET first_name = $1, last_name = $2, email = $3, phone_number = $4, current_address = $5, permanent_address = $6, is_self_submitted = true, submitted_at = NOW(), updated_at = NOW() 
         WHERE id = $7`,
        [firstName, lastName, email, phoneNumber, currentAddress, permanentAddress, employeeId]
      );
    }

    // Handle Documents
    const documentTypes = [
      'aadharPanFile', 'payslipsFile', 'educationalCertificatesFile', 
      'previousOfferLetterFile', 'relievingExperienceLettersFile', 'appraisalHikeLettersFile'
    ];

    const dbFlags = {
      aadharPanFile: 'aadhar_pan_collected',
      payslipsFile: 'payslips_collected',
      educationalCertificatesFile: 'educational_certificates_collected',
      previousOfferLetterFile: 'previous_offer_letter_collected',
      relievingExperienceLettersFile: 'relieving_experience_letters_collected',
      appraisalHikeLettersFile: 'appraisal_hike_letters_collected'
    };

    let flagsToUpdate = [];

    for (const docKey of documentTypes) {
      if (files[docKey] && files[docKey].length > 0) {
        const file = files[docKey][0];
        
        await query(
          `INSERT INTO documents (employee_id, doc_type, file_data, file_name) 
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (employee_id, doc_type) DO UPDATE SET file_data = $3, file_name = $4, uploaded_at = NOW()`,
          [employeeId, docKey, file.buffer, file.originalname]
        );
        
        flagsToUpdate.push(`${dbFlags[docKey]} = true`);
      }
    }

    if (flagsToUpdate.length > 0) {
      await query(`UPDATE employees SET ${flagsToUpdate.join(', ')} WHERE id = $1`, [employeeId]);
    }

    // Send Emails
    const empData = { firstName, lastName, email, phoneNumber };
    await sendEmployeeConfirmationEmail(email, firstName);
    await sendHRNotificationEmail(empData, decoded.isGeneric);

    res.status(200).json({ success: true, message: 'Onboarding completed successfully' });

  } catch (error) {
    console.error('Error submitting onboarding:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
