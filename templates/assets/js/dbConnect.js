const { Pool } = require('pg');
//Database connection details

const pool = new Pool({
    user: 'postgres',
    host: 'smuprod3.c1q46o8y6ls2.us-east-1.rds.amazonaws.com',
    database: 'postgres',
    username: 'Stop',
    password: 'n422U2$A6X(^(75V',
    port: 5432
});

//testing query for successful connection
module.exports = {
    selectAllStudents: function () {
        pool.query('Select * FROM student;', (err, res) => {
            console.log(err, res);
            pool.end();
        })
    },

    validateStudent: function (email, password) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT COUNT(*) FROM student WHERE email = '${email}' AND password = '${password}';`)
                .then(res => {
                    resolve(parseInt(res.rows[0].count) == 1);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    validateProfessor: function (email, password) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT COUNT(*) FROM professor WHERE email = '${email}' AND password = '${password}';`)
                .then(res => {
                    resolve(parseInt(res.rows[0].count) == 1);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    findStudentByEmail: function (email) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM student WHERE email = '${email}';`)
                .then(res => {
                    resolve(res.rows[0]);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },

    findProfessorByEmail: function (email) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM professor WHERE email = '${email}';`)
                .then(res => {
                    resolve(res.rows[0]);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },


    getCoursesByStudentId: function (studentid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM class c
                      JOIN Student_class sc ON c.ClassID = sc.ClassID AND c.Semester = sc.Semester AND
                      c.Section = sc.Section
                      WHERE sc.StudentID = '${studentid}';`)
                .then(res => {
                    resolve(res.rows);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },

    getCoursesByProfessorId: function (professorid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM class 
                      WHERE professorid = '${professorid}';`)
                .then(res => {
                    resolve(res.rows);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    
    getGroup: function (studentid, classid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
                        FROM student
                        WHERE studentid IN (
                            SELECT studentid
                            FROM student_class
                            WHERE studentgroup = (
                                SELECT studentgroup
                                FROM student_class
                                WHERE studentid = '${studentid}' AND classid = '${classid}'
                            ) AND classid = '${classid}');`)
                .then(res => {
                    resolve(res.rows);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },
    getAssignments: function (classid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM assignment WHERE classid = '${classid}';`)
                .then(res => {
                    resolve(res.rows);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });

    },

    addEval: function (studentid, assignmentid, receivingstudentid, overall, otherfields)  {
        var date = new Date()
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO PeerEvaluation (AssignmentID, StudentID, ReceivingStudentID, DateCompleted, DisciplineKnowledge, ApplyKnowledge, ReasoningAndLogic, ProblemSolving, CriticalThinking, IdentifyOpportunity, EmotionalIntelligence, Collaboration, Leadership, Communication, Openness, DiversityAppreciation, asiaissues, Ethics, SenseOfResponsibility, AddressSocialConcern, PersonalGrowth, SelfReflection, Resilience, Overall) 
            VALUES (${assignmentid}, ${studentid}, ${receivingstudentid}, to_date('${date.toISOString()}', 'YYYY-MM-DD'), ${otherfields.field1}, ${otherfields.field2}, ${otherfields.field3}, ${otherfields.field4}, ${otherfields.field5}, ${otherfields.field6}, ${otherfields.field7}, ${otherfields.field8}, ${otherfields.field9}, ${otherfields.field10}, ${otherfields.field11}, ${otherfields.field12}, ${otherfields.field13}, ${otherfields.field14}, ${otherfields.field15}, ${otherfields.field16}, ${otherfields.field17}, ${otherfields.field18}, ${otherfields.field19}, ${overall})
            RETURNING peerevaluationid;
            `).then(res => {
                    resolve(res.rows[0].peerevaluationid);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        }) //(DEFAULT, 1, 701234568, 701561205, NOW()::date, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4)
        
    },

    addGlo: function (peerevaluationid, categoryAvg)  {
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO graduatelearningoutcomes (peerevaluationid, multidisciplinaryknowledge, intellectualandcreative, interpersonalskills, globalcitizenship, personalmastery) 
            VALUES (${peerevaluationid}, ${categoryAvg["multidisciplinaryknowledge"]}, ${categoryAvg["intellectualandknowledge"]}, ${categoryAvg["interpersonalskills"]}, ${categoryAvg["globalcitizenship"]}, ${categoryAvg["personalmastery"]});
            `).then(res => {
                    resolve(true);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },
    // findUserByEmail: function(email){

    // }
    // forgotPassword: function (req, res) {
    //     const { email } = req.body;

    //     db.findUserByEmail(email)
    //         .then(user => {
    //             if (user) {
    //                 const resetToken = crypto.randomBytes(20).toString('hex');

    //                 return db.storeResetToken(user.id, resetToken, Date.now() + 3600000)
    //                     .then(() => sendPasswordResetEmail(email, resetToken));
    //             }

    //             res.status(200).send('If the email exists, a password reset email has been sent.');
    //         })
    //         .catch(error => {
    //             console.error('Error sending password reset email:', error);
    //             res.status(500).send('Internal server error');
    //         });
    // }
}
