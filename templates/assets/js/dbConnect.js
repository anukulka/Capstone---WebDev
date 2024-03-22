const { Pool } = require('pg');
//Database connection details

const pool = new Pool({
    user: 'postgres',
    host: 'smuproduction1.c1q46o8y6ls2.us-east-1.rds.amazonaws.com',
    database: 'postgres',
    username: 'postgres',
    password: 'password',
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

    getStudentPeerEvaluationGrades: function(studentid){
        //retreive grades and put them into the proper db columns
        //average the overall grade, and put that into the overall column
        //average the section grades, and put that into the graduatelearningoutcome columns(might need to give each metric a category value)
    }

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
