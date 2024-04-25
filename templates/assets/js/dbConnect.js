const { Pool } = require('pg');
//Database connection details

const pool = new Pool({
    user: 'Stop', //Ask Jake about this?
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

    validateAdmin: function (email, password) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT COUNT(*) FROM administrator WHERE email = '${email}' AND password = '${password}';`)
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

    findAdminByEmail: function (email) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM administrator WHERE email = '${email}';`)
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
    getAssignmentsForProf: function (professorid, classid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT * FROM assignment WHERE classid = '${classid}' AND section IN (SELECT section FROM class WHERE professorid = ${parseInt(professorid)} AND classid = '${classid}');`)
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
    getGroupInfo: function (studentid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *
                        FROM student_class
                        WHERE studentid = '${studentid}';`)
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

    addEval: function (studentid, assignmentid, receivingstudentid, overall, otherfields) {
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


    addGlo: function (peerevaluationid, categoryAvg) {
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

    getSectionsByClassID: function (classID, professorid) {
        let queryString = ""
        if (professorid)
            queryString = `SELECT DISTINCT section FROM class WHERE classid = '${classID}' AND professorid = '${professorid}';`
        else
            queryString = `SELECT classid, section, studentgroup FROM student_class WHERE classid = '${classID}';`


        return new Promise((resolve, reject) => {
            pool.query(queryString).then(res => {
                resolve(res.rows);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },
    getSemester: function () {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT DISTINCT semester FROM class;
            `).then(res => {
                resolve(res.rows);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },

    getAdminGroupMembers: function (classid, section, groupNum) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT *, ${parseInt(groupNum)} as groupnum FROM student WHERE studentid IN (SELECT studentid FROM student_class WHERE classid = '${classid}' AND section = '${section}' AND studentgroup = ${parseInt(groupNum)});`)
                .then(res => {
                    resolve(res.rows);
                }).catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },

    getStudentByClassSectionIDs: function (classID, section) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT DISTINCT studentid FROM student_class WHERE classid = '${classID}' AND section = '${section}';`).then(res => {
                resolve(res.rows);
            }).catch(err => {
                console.log(err);
                reject(err);
            });

        })
    },

    addAssignment: function (classid, semester, section, dateopen, dateclose) {
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO assignment (classid, semester, section, dateopen, dateclose) VALUES ('${classid}', '${semester}', '${section}',  to_date('${dateopen}', 'YYYY-MM-DD'), to_date('${dateclose}', 'YYYY-MM-DD'));`).then(res => {
                resolve(true);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },
    addCourse: function (classid, semester, section, department, nameofclass, professorid, administratorid) {
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO class (classid, semester, section, department, nameofclass, professorid, administratorid) VALUES ('${classid}', '${semester}', '${section}',  '${department}', '${nameofclass}', ${parseInt(professorid)}, ${parseInt(administratorid)});`).then(res => {
                resolve(true);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },
    addStudent: function (studentid, firstname, lastname, email, password, dateofenrollment, yearofstudy) {
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO student (studentid, firstname, lastname, email, password, dateofenrollment, yearofstudy) VALUES (${parseInt(studentid)}, '${firstname}', '${lastname}',  '${email}', '${password}', to_date('${dateofenrollment}', 'YYYY-MM-DD'), ${parseInt(yearofstudy)});`).then(res => {
                resolve(true);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },

    addStudentInClass: function (classid, semester, section, studentid, studentgroup) {
        return new Promise((resolve, reject) => {
            pool.query(`INSERT INTO student_class (classid, semester, section, studentid, currentlyenrolled) VALUES ('${classid}', '${semester}', '${section}',  ${parseInt(studentid)}, ${true});`).then(res => {
                resolve(true);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },

    updateStudentGroup: function (classid, semester, section, studentid, groupnum) {
        return new Promise((resolve, reject) => {
            pool.query(`UPDATE student_class SET studentgroup = COALESCE($1, studentgroup) WHERE classid = $2 AND semester = $3 AND section = $4 AND studentid = $5;`, [groupnum, classid, semester, section, studentid])
                .then(res => {
                    resolve(true);
                })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        });
    },


    getClassesByAdmin: function (administratorid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT DISTINCT classid FROM class where administratorid = ${parseInt(administratorid)};
            `).then(res => {
                resolve(res.rows);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },
    getSectionsByClass: function (classid) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT DISTINCT section FROM class where classid = '${classid}' ;
            `).then(res => {
                resolve(res.rows);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },


    getAdminGroups: function (groupnumbers) {
        return new Promise((resolve, reject) => {
            pool.query(`SELECT c.classid, c.section, sc.studentgroup, s.firstname, s.lastname
            FROM class c
            JOIN student_class sc ON c.classid = sc.classid AND c.section = sc.section
            JOIN student s ON sc.studentid = s.studentid
            WHERE c.classid = '${classid}' AND c.professorid = '${administratorid}'
            ORDER BY c.classid, c.section, sc.studentgroup, s.firstname, s.lastname;
             ;
            `).then(res => {
                resolve(res.rows);
            })
                .catch(err => {
                    console.log(err);
                    reject(err);
                });
        })
    },






}