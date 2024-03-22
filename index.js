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

router.get('/dashboard/peerEval', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Peereval.html'));
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

router.post('/getGroup', (req, res) => {
  db.getGroup(req.body.studentid, req.body.classid).then(result => {
    res.json({ group: result })
  })
})

router.post('/getAssignments', (req, res) => {
  db.getAssignments(req.body.classid).then(result => {
    res.json({ assignments: result })
  })
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


router.post('/dashboard/submitEval', (req, res) => {
  var studentID = req.body.studentid
  var peerStudentID = req.body.selectedPeerID
  var assignmentID = req.body.selectedAssignmentID
  var ratings = req.body.ratings

  var categoryMap = {
    field1: "multidisciplinaryknowledge",
    field2: "multidisciplinaryknowledge",
    field3: "intellectualandknowledge",
    field4: "intellectualandknowledge",
    field5: "intellectualandknowledge",
    field6: "intellectualandknowledge",
    field7: "interpersonalskills",
    field8: "interpersonalskills",
    field9: "interpersonalskills",
    field10: "interpersonalskills",
    field11: "globalcitizenship",
    field12: "globalcitizenship",
    field13: "globalcitizenship",
    field14: "globalcitizenship",
    field15: "globalcitizenship",
    field16: "globalcitizenship",
    field17: "personalmastery",
    field18: "personalmastery",
    field19: "personalmastery",
  }

  var categoryAvg = {
    "multidisciplinaryknowledge" : 0,
    "intellectualandknowledge" : 0,
    "interpersonalskills" : 0,
    "globalcitizenship" : 0,
    "personalmastery" : 0,
  }

  var overallSum = 0
  Object.entries(ratings).forEach(([key, value]) => {
    overallSum += value
    let category = categoryMap[key]
    categoryAvg[category] += value
  });

  var overallAvg =  Number(Math.round((overallSum/(Object.entries(ratings).length)) * 10) / 10).toFixed(2)   
  categoryAvg["multidisciplinaryknowledge"] = Number(Math.round((categoryAvg["multidisciplinaryknowledge"]/2) * 10) / 10).toFixed(2)
  categoryAvg["intellectualandknowledge"] = Number(Math.round((categoryAvg["intellectualandknowledge"]/4) * 10) / 10).toFixed(2)   
  categoryAvg["interpersonalskills"] = Number(Math.round((categoryAvg["interpersonalskills"]/4) * 10) / 10).toFixed(2)   
  categoryAvg["globalcitizenship"] = Number(Math.round((categoryAvg["globalcitizenship"]/6) * 10) / 10).toFixed(2)   
  categoryAvg["personalmastery"] = Number(Math.round((categoryAvg["personalmastery"]/3) * 10) / 10).toFixed(2)   

  db.addEval(studentID, assignmentID, peerStudentID, overallAvg, ratings).then(newRecordID => {
      db.addGlo(newRecordID, categoryAvg).then(done => {
       //res.redirect('/dashboard/student')
       })
  })
})


router.get('/isAuthorized', (req, res) => {
  res.json({ authorized: req.session.isAuthorized ? req.session.isAuthorized : false })
})

router.get('/signout', (req, res) => {
  req.session.destroy()
  res.redirect('/')
})


router.get('/forgotten-password', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'forgotten-password.html'));
});

/*----------------------------------------------------------------------------------------

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



*/




app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

