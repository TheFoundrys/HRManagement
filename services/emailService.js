const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_HOST_USER,
    pass: process.env.EMAIL_HOST_PASSWORD,
  },
});

/**
 * Sends a confirmation email to the newly onboarded employee.
 * @param {string} toEmail - Employee's email address
 * @param {string} firstName - Employee's first name
 */
async function sendEmployeeConfirmationEmail(toEmail, firstName) {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: toEmail,
    subject: 'Onboarding Submission Received',
    text: `Hello ${firstName},\n\nThank you for submitting your onboarding details. We have received your information and documents.\n\nOur HR team will review them and get back to you shortly.\n\nBest Regards,\nHR Team`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Confirmation email sent to ${toEmail}`);
  } catch (error) {
    console.error('Error sending employee confirmation email:', error);
  }
}

/**
 * Sends a notification email to HR about a new onboarding submission.
 * @param {Object} employeeData - Data of the submitted employee
 * @param {boolean} isGeneric - Whether the link was generic or specific
 */
async function sendHRNotificationEmail(employeeData, isGeneric) {
  const hrEmail = process.env.HR_EMAIL;
  const linkType = isGeneric ? 'Generic Link' : 'Specific Employee Link';
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: hrEmail,
    subject: `New Onboarding Submission - ${employeeData.firstName} ${employeeData.lastName}`,
    text: `Hello HR,\n\nA new onboarding submission has been received.\n\nDetails:\nName: ${employeeData.firstName} ${employeeData.lastName}\nEmail: ${employeeData.email}\nPhone: ${employeeData.phoneNumber}\nSubmission Date: ${new Date().toLocaleString()}\nLink Type Used: ${linkType}\n\nPlease check the HRMS dashboard to review the submitted documents and details.\n\nBest Regards,\nHRMS System`
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`HR notification email sent to ${hrEmail}`);
  } catch (error) {
    console.error('Error sending HR notification email:', error);
  }
}

module.exports = {
  sendEmployeeConfirmationEmail,
  sendHRNotificationEmail
};
