const express = require('express');
const es6Renderer = require('express-es6-template-engine');
const session = require('express-session');
const bodyParser = require('body-parser');
const dbQueries  = require('./dataBaseActions/queries.js');

const app = express();

const port = process.env.port || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(__dirname + '/public'));
app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: false,
}));
app.engine('html', es6Renderer);

app.set('views', 'views');
app.set('view engine', 'html');
app.set('view engine', 'ejs');

app.get('/', (req,res) => {
    res.render('login', {status: {try: false}});
});

app.get('/manage-user', (req,res) => {
    if(req.session.isAdminLogged) {
        res.render('manage-user.html');
    }
    else {res.redirect('/');}
});

app.post('/add-user', async (req, res) => {
    if(req.session.isAdminLogged) {
        const isExistedUser = await dbQueries.findUser(req.body.email);
        if(isExistedUser) {
            res.redirect('/manage-user');
        }
        else {
            const data = req.body;
            const insertObject = {
                firstName: data.firstName,
                lastName: data.lastName,
                username: data.email,
                password: data.password,
                role : data.type,
            };

            if(data.type === 'Teacher') {
                insertObject.material = [data.material];
                dbQueries.addUser(insertObject);
            }
            else if (data.type === 'Student') {
                insertObject.grade = data.grade;
                insertObject.section = data.section;
                insertObject.savedVideos = [];
                const existClass = await dbQueries.findClass(insertObject.grade, insertObject.section);
                if(existClass.length){
                    const isChecked = await dbQueries.checkClass(insertObject.grade, insertObject.section);
                if(isChecked) {
                    dbQueries.addUser(insertObject);
                }
                    res.redirect('/admin');
                }
                else{
                    res.redirect('/manage-user');
                }
            }
        }
    }
    else {res.redirect('/');}
});

app.post('/delete-class', async (req, res) => {
    if(req.session.isAdminLogged) {
        const result = await dbQueries.deleteClass(req.body.grade, req.body.section);
        if(result === false) {
            const classes = await dbQueries.getAllClasses();
            res.render('manage-class', {classes: classes, status: true});
        }
        else res.redirect('/manage-class');
    }
else res.redirect('/');
});

app.post('/add-class', async (req, res) => {
    if(req.session.isAdminLogged) {
    const grade = req.body.grade;
    const section = req.body.section;
    const size = parseInt(req.body['number-student']);
    const materials = [];
    for (let key in req.body) {
        if(key.includes('teacher') && req.body[key] !== 'No available teacher') {
            materials.push({
                name: key.split('-')[0],
                teacher: req.body[key]
            });
        }
    }
    const existGrade = await dbQueries.findClass(grade, section);
    if(existGrade.length === 0) {
        dbQueries.createClass({
            grade: grade,
            section: section,
            size: size,
            teachers: materials,
        });
        res.redirect('manage-class');
    }
    else {
        res.render('add-class', {exist: true})
    } }
    else {res.redirect('/');}
});

app.get('/add-class', async (req, res) => {
    if(req.session.isAdminLogged) {
        res.render('add-class', {exist: false});
    }
    else {res.redirect('/');}
});

app.get('/search-teachers-per-grade', async (req, res) => {
    const grade = req.query.grade;
    const teachers = await dbQueries.findTeachersForGrade(grade);
    const obj = [];
    teachers.forEach((key, value) => {
        if(typeof(key) === 'object')
            obj.push({material: value, teachers: key});
    });
    res.json(obj);
});

app.get('/admin', (req, res) => {
    if(req.session.isAdminLogged) {
        res.render('admin.html', {locals: {username: req.session.adminName}});
    }
    else res.redirect('/');
});

app.get('/manage-class', async(req, res) => {
    if(req.session.isAdminLogged) {
        const classes = await dbQueries.getAllClasses();
        res.render('manage-class', {classes: classes, status: false});
    }
    else res.redirect('/');
});

app.get('/student', async(req, res) => {
    if(req.session.isStudentLogIn) {
        const userInfo = await dbQueries.findUser(req.session.studentUserName);
        const materials = await dbQueries.findMaterialByGrade(userInfo.grade);
        res.render('student', {materials: materials, section: userInfo.section});
    }
    else {
        res.redirect('/');
    }
});

app.post('/log-in', async (req, res) => {
    const username  = req.body.username;
    const password = req.body.password;
    const userInfo = await dbQueries.findUser(username);
    if(userInfo && userInfo.password === password) {
        if(userInfo.role === 'Student') {
            req.session.isStudentLogIn = true;
            req.session.studentUserName = userInfo.username;
            res.redirect('/student')
        } else if(userInfo.role === 'Teacher') {
            req.session.isTeacherLogIn = true;
            req.session.teacherUserName = userInfo.username;
            res.redirect('/teacher');
        }
        else {
            req.session.isAdminLogged = true;
            req.session.adminName = userInfo.name;
            res.redirect('/admin');
        }
    } else res.render('login', {status: {try: true}});
});

app.get('/videos', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const grade = req.query.grade;
        const section = req.query.section;
        const material = req.query.material;
        const videos = await dbQueries.findVideoForMaterial(grade.toString(),section, material);
    res.render('list-video.ejs', {videos: videos});
    }
    else {
        res.redirect('/');
    }
});

app.get('/insert-comment', async (req,res) => {
    const videoID = req.query.videoID;
    const content = req.query.comment;
    const username = req.query.username;
    dbQueries.insertComment({
        content:content,user:username,videoId:videoID
    });
});

app.get('/teacher', async (req, res) => {
    if (req.session.isTeacherLogIn) {
    const userInfo = await dbQueries.findUser(req.session.teacherUserName);
    req.session.material = userInfo.material;
    const teacherMaterials = await dbQueries.findMaterialsBySubjects(userInfo.material);
    res.render('teacher', {materials: teacherMaterials});
    } else res.redirect('/');
});

app.get('/play-video', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const videoID = req.query.videoID;
        const video = await dbQueries.findVideoByID(videoID);
        const comments = await dbQueries.getCommentsOfVideo(videoID);
        res.render('play-video', {video, comments, userID: req.session.studentUserName});
    }
    else {
        res.redirect('/');
    }
});

app.get('/add-video', (req, res) => {
    if (req.session.isTeacherLogIn) {
    res.render('add-video.html', {locals:{material: req.session.material}});
    } else res.redirect('/');
});

app.post('/add-video', async (req, res) => {
    if (req.session.isTeacherLogIn) {
    const lastId = await dbQueries.findLastInsertedIdVideo();
    const obj  = {};
    const body = req.body;
    for (const property in body) {
        obj[property] = body[property]
    }
    obj.id = (parseInt(lastId.id) + 1).toString();
    dbQueries.insertVideo(obj);
    res.redirect('/add-video');
    }else res.redirect('/');
});

app.get('/saved-videos', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const videosIds = await dbQueries.findUser(req.session.studentUserName);
        const videos = await dbQueries.findSavedVideoOfUser(videosIds.savedVideos);
        res.render('list-video.ejs', {videos: videos});
    }
    else {
        res.redirect('/');
    }
});

app.post('/save-video', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const videoId = req.body.videoId;
        await dbQueries.addVideoToSave(req.session.studentUserName, videoId);
    }else {
        res.redirect('/');
    }
});

app.get('/books', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const books = await dbQueries.getBooks(req.session.studentUserName);
        res.render('library', {books: books});
    }
    else {
        res.redirect('/');
    }
});

app.get('/show-meetings', async (req, res) => {
    if(req.session.isStudentLogIn) {
        const meetings = await dbQueries.getMeetings(req.session.studentUserName);
        res.render('meetings', {meetings: meetings});
    }
    else {
        res.redirect('/');
    }
});

app.get('/add-meeting', async (req, res) => {
    if(req.session.isTeacherLogIn) {
        res.render('addMeeting.html', {locals:{material: req.session.material}});
    }
    else {
        res.redirect('/');
    }
});

app.post('/add-meeting', async (req, res) => {
    if(req.session.isTeacherLogIn) {
        dbQueries.addMeeting({
            name: req.body.name,
            url: req.body.url,
            section: req.body.section,
            material: req.body.material,
            grade: req.body.grade
        });
        res.redirect('/add-meeting');
    }
    else {
        res.redirect('/');
    }
});

app.get('/add-quiz', (req, res) => {
    res.render('add-quiz.html');
});

app.get('/calender', (req,res) => {
    if(req.session.isStudentLogIn) {
        res.render('calender.html');
    } else res.redirect('/');
});

app.get('/quiz', (req,res) => {
    if(req.session.isStudentLogIn) {
        res.render('quiz.html');
    } else res.redirect('/');
});

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
