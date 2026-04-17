const nodemailer = require('nodemailer');
require('dotenv').config();

// Create transporter for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_EMAIL,
    pass: process.env.GMAIL_PASSWORD, // Use Gmail app password, not regular password
  },
});

/**
 * Send confirmation email to customer
 */
async function sendCustomerConfirmation(customerName, customerEmail, vehicleInterest) {
  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: customerEmail,
    subject: '✅ Oscar Received Your Info – Next Steps',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1A52D4; color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">Keys with OG</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Oscar Gonzalez • AT Price Chevrolet</p>
        </div>

        <h2 style="color: #080808; font-size: 24px; margin-bottom: 15px;">Thanks for reaching out, ${customerName}!</h2>

        <p style="color: #575350; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          Oscar got your information and will be in touch <strong>within the hour</strong>. He appreciates your interest in ${vehicleInterest || 'finding your next vehicle'}.
        </p>

        <div style="background: #F2F2F2; padding: 20px; border-left: 4px solid #F0A500; margin-bottom: 30px; border-radius: 4px;">
          <p style="color: #080808; margin: 0; font-weight: bold; margin-bottom: 10px;">What's Next?</p>
          <ul style="color: #575350; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Oscar will call or text your phone number directly</li>
            <li style="margin-bottom: 8px;">He'll ask about your needs and timeline</li>
            <li style="margin-bottom: 8px;">You'll get honest pricing and options (no pressure)</li>
            <li>If you're interested, he'll walk you through the entire process</li>
          </ul>
        </div>

        <p style="color: #575350; font-size: 14px; margin-bottom: 30px;">
          Can't wait to talk? You can also call or text Oscar directly at <strong>(210)-260-2489</strong>
        </p>

        <div style="border-top: 1px solid #E8E8E8; padding-top: 20px; text-align: center;">
          <p style="color: #888480; font-size: 12px; margin: 0;">
            © 2025 Keys with OG • AT Price Chevrolet, Pleasanton, TX<br>
            2035 W Oaklawn Rd, Pleasanton, TX 78064
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Confirmation email sent to ${customerEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${customerEmail}:`, error.message);
    return false;
  }
}

/**
 * Send notification email to Oscar about new submission
 */
async function sendOscarNotification(submissionData) {
  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: process.env.GMAIL_EMAIL, // Send to Oscar
    subject: `📋 New Inquiry: ${submissionData.first_name} ${submissionData.last_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #F0A500; margin-bottom: 20px;">🔔 New Lead Submission</h2>

        <div style="background: #F2F2F2; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #080808; margin-top: 0;">Customer Info</h3>
          <p><strong>Name:</strong> ${submissionData.first_name} ${submissionData.last_name}</p>
          <p><strong>Email:</strong> ${submissionData.email}</p>
          <p><strong>Phone:</strong> ${submissionData.phone}</p>
          ${submissionData.interest ? `<p><strong>Vehicle Interest:</strong> ${submissionData.interest}</p>` : ''}
          ${submissionData.credit_situation ? `<p><strong>Credit Situation:</strong> ${submissionData.credit_situation}</p>` : ''}
          ${submissionData.message ? `<p><strong>Message:</strong> ${submissionData.message}</p>` : ''}
          ${submissionData.referral_code ? `<p><strong>Referred By:</strong> ${submissionData.referral_code}</p>` : ''}
        </div>

        <p style="color: #575350; font-size: 14px;">
          Submitted at: ${new Date(submissionData.created_at).toLocaleString()}
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Oscar notification sent`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send Oscar notification:`, error.message);
    return false;
  }
}

/**
 * Send notification to referrer when someone uses their code
 */
async function sendReferrerNotification(referrerEmail, referrerName, referredName) {
  const mailOptions = {
    from: process.env.GMAIL_EMAIL,
    to: referrerEmail,
    subject: '🎉 Someone used your referral code!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #F0A500; color: #080808; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px;">
          <h1 style="margin: 0; font-size: 32px; letter-spacing: 2px;">Keys with OG</h1>
          <p style="margin: 10px 0 0 0; font-size: 14px;">Referral Bonus Program</p>
        </div>

        <h2 style="color: #080808; font-size: 24px; margin-bottom: 15px;">Hey ${referrerName}, great news!</h2>

        <p style="color: #575350; font-size: 16px; line-height: 1.6; margin-bottom: 15px;">
          <strong>${referredName}</strong> just submitted your referral code to Oscar. That means your referral is now being tracked.
        </p>

        <div style="background: #F2F2F2; padding: 20px; border-left: 4px solid #F0A500; margin-bottom: 30px; border-radius: 4px;">
          <p style="color: #080808; margin: 0; font-weight: bold; margin-bottom: 10px;">What happens next?</p>
          <ul style="color: #575350; margin: 0; padding-left: 20px;">
            <li style="margin-bottom: 8px;">Oscar will work with ${referredName} on finding the right vehicle</li>
            <li style="margin-bottom: 8px;">When they purchase, you'll earn your <strong>$100 cash bonus</strong></li>
            <li>Oscar will reach out to you directly when it's time to collect</li>
          </ul>
        </div>

        <p style="color: #575350; font-size: 14px; margin-bottom: 30px;">
          Thanks for spreading the word! Keep referring friends — there's no limit. 💰
        </p>

        <div style="border-top: 1px solid #E8E8E8; padding-top: 20px; text-align: center;">
          <p style="color: #888480; font-size: 12px; margin: 0;">
            © 2025 Keys with OG • AT Price Chevrolet, Pleasanton, TX<br>
            2035 W Oaklawn Rd, Pleasanton, TX 78064
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Referrer notification sent to ${referrerEmail}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send referrer notification to ${referrerEmail}:`, error.message);
    return false;
  }
}

module.exports = {
  sendCustomerConfirmation,
  sendOscarNotification,
  sendReferrerNotification,
};
