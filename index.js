const db = require('./templates/assets/js/dbConnect.js')
const express = require('express')
const session = require('express-session')
const path = require('path')

const app = express()
const router = express.Router()
const port = 3000

app.use(express.urlencoded({ extended: false }));
app.use(express.json())
app.use(session({
  secret: "0312113451e14d28b67fa225e9e4e94d",
  resave: false,
  saveUninitialized: true
}))
app.use('/', router)
app.use(express.static(path.join(__dirname, 'templates')))


router.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'login.html'));
})

router.get('/dashboard/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Student Dashboard.html'));
})

router.get('/dashboard/professor', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Professor Dashboard.html'));
})

router.post('/validateLogin', (req, res) => {
  if (req.body.type === 'student') {
    var test = db.validateStudent(req.body.email, req.body.password).then(isValid => {
      if (isValid) {
        req.session.isAuthorized = true
        req.session.email = req.body.email
        res.redirect('/dashboard/student')
      }
      else
        res.redirect('/')
    })
  }
  else {
    var test = db.validateProfessor(req.body.email, req.body.password).then(isValid => {
      if (isValid) {
        req.session.isAuthorized = true
        req.session.email = req.body.email
        res.redirect('/dashboard/professor')
      }
      else
        res.redirect('/')
    })
  }
})

router.get('/getCurStudent', (req, res) => {
  db.findStudentByEmail(req.session.email).then(result => {
    res.json({ record: result })
  })
})

router.get('/getCurProfessor', (req, res) => {
  db.findProfessorByEmail(req.session.email).then(result => {
    res.json({ record: result })
  })
})

router.get('/getAllStudents', (req, res) => {
  res.send(String(db.selectAllStudents()))
})

router.post('/getCourses', (req, res) => {
  if (req.body.type === 'student') {
    db.getCoursesByStudentId(req.body.studentid).then(courses => {
      res.json(courses);
    })
      .catch(err => {
        console.error('Error retrieving courses:', err);
        res.status(500).send('Internal server error');
      });
  }
  else {
    db.getCoursesByProfessorId(req.body.professorid).then(courses => {
      res.json(courses);
    })
      .catch(err => {
        console.error('Error retrieving courses:', err);
        res.status(500).send('Internal server error');
      });
  }
});
/*
git remote add origin https://github.com/anukulka/smu.git
git add .
git commit -m "Initial commit"
git branch -M main
git push -u origin main*/
router.get('/isAuthorized', (req, res) => {
  res.json({ authorized: req.session.isAuthorized ? req.session.isAuthorized : false })
})

router.get('/signout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})
/*----------------------------------------------------------------------------------------*/

router.get('/forgotten-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'forgotten-password.html'));
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    // Check if the user exists in the database
    const user = await db.findUserByEmail(email);

    if (!user) {
      return res.status(404).send('User not found');
    }

    // Generate a unique password reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Store the reset token and expiration time in the database
    await db.storeResetToken(user.id, resetToken, Date.now() + 3600000); // Token expires in 1 hour

    // Create a transporter for sending the email
    const transporter = nodemailer.createTransport({
      // Configure your email service provider (e.g., Gmail, SendGrid, etc.)
      service: 'Gmail',
      auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password',
      },
    });

    // Compose the email message
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset',
      text: `You are receiving this email because you (or someone else) have requested a password reset for your account.\n\n
        Please click on the following link, or paste it into your browser to complete the process:\n\n
        http://${req.headers.host}/reset-password/${resetToken}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).send('Password reset email sent');
  } catch (error) {
    console.error('Error sending password reset email:', error);
    res.status(500).send('Internal server error');
  }
});








app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

