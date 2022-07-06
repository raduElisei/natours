const nodemailer = require('nodemailer');

// send mail este un obiect "transporter"
const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    // ce e mai jos e luat din Mailtrap
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,

      // Activate in gmail "less secure app" option
    },
  });

  // 2) Define the email options
  const mailOptions = {
    from: 'Radu Elisei <radu@bla.to',
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html:
  };
  // 3) Send the email
  await transporter.sendMail(mailOptions);
  // returneaza o promisiune si nu vrem sa lucram direct cu propmisiuni asa ca folosim async/await
};

module.exports = sendEmail;
