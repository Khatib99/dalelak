const  { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectID;

const uri = "mongodb+srv://admin:admin@cluster0.kn3iy.mongodb.net/Elearning?retryWrites=true&w=majority";

async function getCollection(collectionName) {
    try{
    const connectionDB = await MongoClient.connect(uri);
    const db = await connectionDB.db("Elearning");
    return await db.collection(collectionName);
    } catch(exception) {
        console.log('Connection to the database corrupted');
    }
}

async function findUser(username) {
    const collection = await getCollection('users');
    return collection.findOne({username: username});
}

async function findUserByClass(grade, section) {
    const collection = await getCollection('users');
    return collection.find({grade: grade, section: section}).toArray();
}

async function findMaterialByGrade(grade) {
    const collection = await getCollection('materlias');
    return collection.find({grade: grade}).toArray();
}

async function findMaterialsBySubjects(subject) {
    const materials = [];
    const collection = await getCollection('materlias');
   for(let i = 0 ; i < subject.length ; i++)
    materials.push(await collection.findOne({name: subject[i]}));
   return materials;
}

async function addUser(userInfo) {
    const collection = await getCollection('users');
    console.log((await collection.insertOne(userInfo)).acknowledged);
}

async function checkClass(grade, section) {
    const collection = await getCollection('classes');
    const theClass = await collection.findOne({grade:grade, section: section});
    const students = await findUserByClass(grade, section);
    if (theClass.size > students.length) return true;
    else return false;
}

async function getAllClasses() {
    const collection = await getCollection('classes');
    const allClasses = await collection.find().toArray();
    return allClasses;
}

async function deleteClass(grade, section) {
    const collection = await getCollection('classes');
    const students = await findUserByClass(grade, section);
    if (students.length === 0) collection.deleteMany({grade:grade, section: section});
    else return false;
}

async function findByRole(role) {
    const collection = await getCollection('users');
    const users = await collection.find({role: role}).toArray();
    return users;
}

async function createClass(newClass) {
    const collection = await getCollection('classes');
    console.log(await collection.insertOne(newClass));
}

async function findClass(grade, section) {
    const collection = await getCollection('classes');
    return collection.find({grade: grade, section: section}).toArray();

}

async function findTeachersForGrade(grade) {
   const returnObject = new Map();

   const materials = await findMaterialByGrade(grade);
   const teachers = await findByRole('Teacher');
   materials.forEach((material) => {
       returnObject.set(material.name, []);
       teachers.forEach((teacher) => {
           if(teacher.material.includes(material.name)) {
               const materialName = material.name;
               const teacherEmail = teacher.username;
               const name = `${teacher.firstName} ${teacher.lastName}`;
               returnObject.set(returnObject.get(materialName).push({username: teacherEmail, name: name}))
           }
       });
   });
   return returnObject;
}

async function findVideoForMaterial(grade, section, material) {
    const collection = await getCollection('videos');
    const videos = await collection.find({grade: grade, section: section, material: material}).toArray();
    return videos;
}

async function findVideoByID(id) {
    const collection = await getCollection('videos');
    const videos = await collection.findOne({id: id});
    return videos;
}

async function getCommentsOfVideo(id) {
    const collection = await getCollection('comments');
    const comments = collection.find({videoId: id}).toArray();
    return comments;
}

async function insertComment(comment) {
    const collection = await getCollection('comments');
    console.log((await collection.insertOne(comment)).acknowledged);
}

async function findLastInsertedIdVideo() {
    const collection = await getCollection('videos');
    const max = await collection.find().sort({id:-1}).toArray();
    return max[0];
}

async function insertVideo(obj) {
    const collection = await getCollection('videos');
    console.log((await collection.insertOne(obj)).acknowledged);
}

async function findSavedVideoOfUser(videos) {
    const returnVideos= [];
    const collection = await getCollection('videos');
    for(let i = 0; i < videos.length; i++){
        const resultSearch = await findVideoByID(videos[i]);
        returnVideos.push(resultSearch);
    }
    return returnVideos;
}

async function addVideoToSave(username, id) {
    const collection = await getCollection('users');
    const userInfo = await findUser(username);
    let flag = false;
    const videos = userInfo.savedVideos;
    const inputID = id.toString();
    videos.forEach((videoId) => {
        if(videoId === inputID) flag = true;
    });

    if(!flag) {
        videos.push(inputID);
        collection.updateOne({username:username}, {$set:{savedVideos: videos}});
    }
}

async function getBooks(username) {
    const collection = await getCollection('books');
    const userInfo = await findUser(username);
    const books = await collection.find({grade: userInfo.grade}).toArray();
    return books;
}

async function getMeetings(username) {
    const collection = await getCollection('meetings');
    const userInfo = await findUser(username);
    const meetings = await collection.find({grade: userInfo.grade}, {section: userInfo.section}).toArray();
    return meetings;
}

async function addMeeting(username) {
    const collection = await getCollection('meetings');
    console.log((await collection.insertOne(username)).acknowledged);
}

module.exports = {
    addMeeting,
    addUser,
    addVideoToSave,
    checkClass,
    createClass,
    deleteClass,
    findClass,
    findLastInsertedIdVideo,
    findMaterialByGrade,
    findMaterialsBySubjects,
    findSavedVideoOfUser,
    findTeachersForGrade,
    findUser,
    findUserByClass,
    findVideoByID,
    findVideoForMaterial,
    getAllClasses,
    getBooks,
    getCommentsOfVideo,
    getMeetings,
    insertComment,
    insertVideo,
};
