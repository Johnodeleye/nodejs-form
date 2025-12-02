const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');

const submitContactForm = async (req, res) => {
  try {
    console.log('Received contact form submission');

    const { 
      fullName, 
      email, 
      phone, 
      service, 
      message, 
      contactMethod, 
      companyName, 
      numEmployees, 
      interests, 
      uploadedFiles 
    } = req.body;

    if (!fullName || !email || !phone || !service || !message || !contactMethod) {
      return res.status(400).json({
        success: false,
        error: "All required fields must be filled"
      });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.GMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const interestsText = Array.isArray(interests) ? interests.join(', ') : interests;
    
    let filesText = 'No files uploaded';
    let filesHtml = '<p>No files uploaded</p>';
    
if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
  filesText = uploadedFiles.map((url, index) => 
    `File ${index + 1}: ${url}`
  ).join('\n');
  
  filesHtml = uploadedFiles.map((url, index) => 
    `<p><strong>File ${index + 1}:</strong> <a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> (Click to download)</p>`
  ).join('');
}

    const mailOptions = {
      from: `"No reply" <${process.env.GMAIL_USER}>`,
      to: 'johnayomide920@gmail.com',
      bcc: 'alexanderchrist203@gmail.com',
      subject: `New Contact - ${fullName}`,
      text: `
Contact Form Submission

Personal Information:
Full Name: ${fullName}
Email: ${email}
Phone: ${phone}
Contact Method: ${contactMethod}

Business Information:
Company Name: ${companyName || 'Not provided'}
Employees: ${numEmployees || 'Not provided'}
Service: ${service}
Interests: ${interestsText || 'None'}

Files:
${filesText}

Message:
${message}
      `,
      html: `
<div>
  <h2>New Contact Form Submission</h2>
  <p>From Contact Website</p>
  
  <div>
    <h3>Contact Information</h3>
    <p><strong>Full Name:</strong> ${fullName}</p>
    <p><strong>Email:</strong> ${email}</p>
    <p><strong>Phone:</strong> ${phone}</p>
    <p><strong>Contact Method:</strong> ${contactMethod}</p>
  </div>
  
  <div>
    <h3>Business Details</h3>
    <p><strong>Company Name:</strong> ${companyName || 'Not provided'}</p>
    <p><strong>Number of Employees:</strong> ${numEmployees || 'Not provided'}</p>
    <p><strong>Service Interested In:</strong> ${service}</p>
    <p><strong>Interests:</strong> ${interestsText || 'None'}</p>
  </div>
  
  <div>
    <h3>Uploaded Files (${Array.isArray(uploadedFiles) ? uploadedFiles.length : 0})</h3>
    ${filesHtml}
  </div>

  
  
  <div>
    <h3>Message</h3>
    <div>
      <p>${message}</p>
    </div>
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');

    return res.status(200).json({
      success: true,
      message: "Contact form submitted successfully",
      data: {
        name: fullName,
        email: email,
        filesCount: Array.isArray(uploadedFiles) ? uploadedFiles.length : 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error("Contact form error:", error);
    
    const submissionsDir = path.join(__dirname, '..', 'submissions');
    await fs.mkdir(submissionsDir, { recursive: true });
    
    const filename = `submission_${Date.now()}.json`;
    const filepath = path.join(submissionsDir, filename);
    
    const submissionData = {
      timestamp: new Date().toISOString(),
      formData: req.body,
      error: error.message
    };
    
    await fs.writeFile(filepath, JSON.stringify(submissionData, null, 2));
    
    return res.status(500).json({
      success: false,
      error: "Failed to send email. Form saved locally.",
      submissionId: filename
    });
  }
};

module.exports = {
  submitContactForm
};