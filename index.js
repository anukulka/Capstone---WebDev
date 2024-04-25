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

// -------------- STUDENT DASHBOARD -------------------------
router.get('/dashboard/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Student Dashboard.html'));
})

router.get('/dashboard/student/peerEval', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Peereval.html'));
})

router.get('/dashboard/student/insights', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'studentInsights.html'));
})

router.get('/dashboard/student/viewGroups', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'viewStudentGroups.html'));
})

// -------------- PROFESSOR DASHBOARD -------------------------

router.get('/dashboard/professor', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Professor Dashboard.html'));
})

router.get('/dashboard/professor/schedule', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Schedule.html'));
})

router.get('/dashboard/professor/viewEvals', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'viewProfEvals.html'));
})

router.get('/dashboard/professor/insights', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'profInsights.html'));
})

// -------------- ADMIN DASHBOARD -------------------------

router.get('/dashboard/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'Admin Dashboard.html'));
})

router.get('/dashboard/admin/importCourses', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'importcourses.html'));
})

router.get('/dashboard/admin/importStudents', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'importstudents.html'));
})

router.get('/dashboard/admin/createGroups', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'creategroups.html'));
})

router.get('/dashboard/admin/viewGroups', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'viewgroups.html'));
})
router.get('/dashboard/admin/adminInsights', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'adminInsights.html'));
})

router.post('/dashboard/admin/importCourses', (req, res) => {
  db.addCourse(req.body.classid, req.body.semester, req.body.section, req.body.department, req.body.nameofclass, req.body.professorid, req.body.administratorid).then(result => {
    res.send(result)
  })
})

router.post('/dashboard/admin/createGroups', (req, res) => {
  if (req.body.classid && req.body.section && req.body.numGroups && req.body.numPerGroup) {
    studentQuery = db.getStudentByClassSectionIDs(req.body.classid, req.body.section).then(studentList => {
      groupMatches = {}
      tempList = []

      studentList.map(item => {
        tempList.push(item['studentid'])
      })
      studentList = tempList

      for (let groupNum = 1; groupNum <= req.body.numGroups; groupNum++) {
        selectedStudents = []

        if (req.body.numPerGroup > studentList.length) {
          selectedStudents = studentList
        }

        else {
          for (let i = 0; i < req.body.numPerGroup; i++) {
            let index = pickStudent(studentList.length)
            let randomStudent = studentList[index]
            studentList.splice(index, 1)
            selectedStudents.push(randomStudent)
          }
        }
        groupMatches[groupNum] = selectedStudents
      }

      Object.entries(groupMatches).forEach(([group, students]) => {
        students.forEach(studentid => {
          db.updateStudentGroup(req.body.classid, req.body.semester, req.body.section, studentid, group)
        })
      })
    })
  }
  else (
    res.status(404)
  )
})

function pickStudent(totalStudents) {
  return parseInt(Math.floor(Math.random() * totalStudents))
}


router.post('/getStudentGroups', (req, res) => {
  console.log(req.body);
  db.getGroupInfo(req.body.studentid).then(allGroups => {
    const classids = allGroups.map(group => group.classid);
    console.log(classids);

    const teammatesPromises = classids.map(id => {
      return db.getGroup(req.body.studentid, id).then(groupMembers => {
        console.log(groupMembers);
        return { id, groupMembers };
      });
    });

    Promise.all(teammatesPromises).then(teammatesData => {
      const teammates = {};
      teammatesData.forEach(data => {
        teammates[data.id] = data.groupMembers;
      });

      const result = { groups: allGroups, members: teammates };
      console.log(result);
      res.send(result);
    });
  });
});

router.post('/getAdminGroups', (req, res) => {
  console.log(req.body);
  db.getSectionsByClassID(req.body.classid).then(studentClassData => {
    const teammatesPromises = studentClassData.map(sectionEntry => {
      return db.getAdminGroupMembers(sectionEntry.classid, sectionEntry.section, sectionEntry.studentgroup).then(groupMembers => {
        let sectionID = sectionEntry.section;
        return { sectionID, groupMembers };
      });
    });

    Promise.all(teammatesPromises).then(teammatesData => {
      const teammates = {};
      teammatesData.forEach(data => {
        if (!teammates[data.sectionID]) {
          teammates[data.sectionID] = {};
        }

        data.groupMembers.forEach(member => {
          let groupNum = member.groupnum.toString();
          if (!teammates[data.sectionID][groupNum]) {
            teammates[data.sectionID][groupNum] = new Set();
          }
          teammates[data.sectionID][groupNum].add(member.firstname);
        });
      });

      // Convert Sets to Arrays and prepare the final object
      const uniqueTeammates = {};
      Object.keys(teammates).forEach(section => {
        uniqueTeammates[section] = {};
        Object.keys(teammates[section]).forEach(groupNum => {
          uniqueTeammates[section][groupNum] = [...teammates[section][groupNum]]; // Convert Set to Array
        });
      });

      const result = { groups: studentClassData, members: uniqueTeammates };
      console.log(JSON.stringify(result, null, 2)); // Use JSON.stringify to ensure full content is displayed
      res.send(result);
    });
  });

});





// {
//   section: {
//     groupnum: [student list],
//       group2: [students]
//   },
//   section: {
//     groupnum: [student list]
//   },
//   section: {
//     groupnum: [student list]
//   }
// }



// Promise.all(teammatesPromises).then(teammatesData => {
//   const teammates = {};
//   teammatesData.forEach(data => {
//     teammates[data.sectionID] = data.groupMembers;
//   });

//   const result = { groups: studentClassData, members: teammates };
//   console.log(result);
//   res.send(result);
// });


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
  else if (req.body.type === 'professor') {
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
  else {
    var test = db.validateAdmin(req.body.email, req.body.password).then(isValid => {
      if (isValid) {
        req.session.isAuthorized = true
        req.session.email = req.body.email
        res.redirect('/dashboard/admin')
      }
      else
        res.redirect('/adminlogin')
    })
  }
})



router.post('/addAssignment', (req, res) => {
  console.log(req.body)
  db.addAssignment(req.body.classid, req.body.semester, req.body.section, req.body.dateopen, req.body.dateclose).then(result => {
  })
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

router.get('/getCurAdmin', (req, res) => {
  db.findAdminByEmail(req.session.email).then(result => {
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

router.post('/getSections', (req, res) => {
  db.getSectionsByClassID(req.body.classid, req.body.professorid).then(result => {
    res.json({ sections: result })
  })
})

// HERE
router.post('/getSectionsByClass', (req, res) => {
  db.getSectionsByClass(req.body.classid).then(result => {
    res.json({ sections: result })
  })
})

router.post('/getClasses', (req, res) => {
  db.getClassesByAdmin(req.body.administratorid).then(result => {
    res.json({ classes: result })
  })
})

router.post('/getSemester', (req, res) => {
  db.getSemester().then(result => {
    res.json({ semesters: result })
  })
})

router.post('/getAssignments', (req, res) => {
  db.getAssignments(req.body.classid).then(result => {
    res.json({ assignments: result })
  })
})

router.post('/getProfAssignments', (req, res) => {
  db.getAssignmentsForProf(req.body.professorid, req.body.classid).then(result => {
    res.json({ evaluations: result })
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
    "multidisciplinaryknowledge": 0,
    "intellectualandknowledge": 0,
    "interpersonalskills": 0,
    "globalcitizenship": 0,
    "personalmastery": 0,
  }

  var overallSum = 0
  Object.entries(ratings).forEach(([key, value]) => {
    overallSum += value
    let category = categoryMap[key]
    categoryAvg[category] += value
  });

  var overallAvg = Number(Math.round((overallSum / (Object.entries(ratings).length)) * 10) / 10).toFixed(2)
  categoryAvg["multidisciplinaryknowledge"] = Number(Math.round((categoryAvg["multidisciplinaryknowledge"] / 2) * 10) / 10).toFixed(2)
  categoryAvg["intellectualandknowledge"] = Number(Math.round((categoryAvg["intellectualandknowledge"] / 4) * 10) / 10).toFixed(2)
  categoryAvg["interpersonalskills"] = Number(Math.round((categoryAvg["interpersonalskills"] / 4) * 10) / 10).toFixed(2)
  categoryAvg["globalcitizenship"] = Number(Math.round((categoryAvg["globalcitizenship"] / 6) * 10) / 10).toFixed(2)
  categoryAvg["personalmastery"] = Number(Math.round((categoryAvg["personalmastery"] / 3) * 10) / 10).toFixed(2)

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

// -------------- Adminstrator DASHBOARD -------------------------

router.get('/adminlogin', (req, res) => {
  res.sendFile(path.join(__dirname, 'templates', 'adminlogin.html'));
})


router.post('/dashboard/admin/addStudent', (req, res) => {
  console.log(req.body)
  db.addStudent(req.body.studentid, req.body.firstname, req.body.lastname, req.body.email, req.body.password, req.body.dateofenrollment, req.body.yearofstudy).then(result => {
    res.send(result)
  })
})

router.post('/dashboard/admin/addGroup', (req, res) => {
  console.log(req.body)
  db.addStudentInClass(req.body.classid, req.body.semester, req.body.section, req.body.studentid, req.body.studentgroup).then(result => {
    res.send(result)
  })
})

app.listen(port, () => {
  console.log(`App listening on port ${port}`)
})

