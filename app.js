const fs = require('fs');
const { google }= require('googleapis');
const fetch = require('node-fetch');
const apikeys = require('./key.json');
const SCOPE = ['https://www.googleapis.com/auth/drive'];

const { IgApiClient } = require('instagram-private-api');

// A Function that can provide access to google drive api
async function authorize(){
    const jwtClient = new google.auth.JWT(
        apikeys.client_email,
        null,
        apikeys.private_key,
        SCOPE
    );

    await jwtClient.authorize();

    return jwtClient;
}

// A Function that will upload the desired file to google drive folder
async function uploadFile(authClient){
    return new Promise((resolve,rejected)=>{
        const drive = google.drive({version:'v3',auth:authClient}); 

        var fileMetaData = {
            name:'mydrivetext.txt',    
            parents:['1K_3dT3DUd7k9wXtbLUfqpzx8M4Yk2zav'] // A folder ID to which file will get uploaded
        }

        drive.files.create({
            resource:fileMetaData,
            media:{
                body: fs.createReadStream('mydrivetext.txt'), // files that will get uploaded
                mimeType:'text/plain'
            },
            fields:'id'
        },function(error,file){
            if(error){
                return rejected(error)
            }
            resolve(file);
        })
    });
}

// async function downloadFile(auth) {
//     fileId = '1k89nW7RXNQi3106RVNl29xxOO_A0GJtz'
//     filePath = './saved/downloaded.jpg'
//     const drive = google.drive({ version: 'v3', auth });
//     const dest = fs.createWriteStream(filePath);
//     await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' })
//     .then(response => {
//     return new Promise((resolve, reject) => {
//         response.data
//         .on('end', () => {
//             console.log('File downloaded successfully');
//             resolve();
//         })
//         .on('error', err => {
//             console.error('Error downloading file.');
//             reject(err);
//         })
//         .pipe(dest);
//     });
//     })
//     .catch(err => {
//     console.error('Error fetching file from Google Drive:', err);
//     });
// }

async function downloadImageFromDrive(auth, fileId) {
    const drive = google.drive({ version: 'v3', auth });
    try {
      // Get the image file metadata
      const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' });
  
      // Create a buffer to store the image data
      const chunks = [];
      res.data.on('data', (chunk) => {
        chunks.push(chunk);
      });
      return new Promise((resolve, reject) => {
        res.data.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve(buffer);
        });
        res.data.on('error', (err) => {
          reject(err);
        });
      });
    } catch (error) {
      console.error('Error downloading image:', error);
      throw error;
    }
  }

async function listFiles(auth) {
    folderId = '1K_3dT3DUd7k9wXtbLUfqpzx8M4Yk2zav'
    const drive = google.drive({ version: 'v3', auth });
    try {
      const res = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'files(id, name)',
      });
  
      const files = res.data.files;
      if (files.length) {
        // console.log('Files in the folder:');
        // files.forEach(file => {
        //   console.log(`${file.name} (${file.id})`);
        // });
        return files[0].id
      } else {
        // console.log('No files found in the folder.');
        return null
      }
    } catch (error) {
      console.error('Error listing files:', error);
    }
}


async function moveFile(fileId,auth) {
    currentFolderId = '1K_3dT3DUd7k9wXtbLUfqpzx8M4Yk2zav'
    newFolderId = '1e8A49Q6UFI4-8R4LWstk64pdoV4teRjb'

    const drive = google.drive({ version: 'v3', auth });
    try {
      const file = await drive.files.get({
        fileId: fileId,
        fields: 'parents',
      });
  
      let previousParents = file.data.parents.join(',');
      const response = await drive.files.update({
        fileId: fileId,
        addParents: newFolderId,
        removeParents: currentFolderId,
        fields: 'id, parents',
      });
  
      // console.log(`File ${fileId} moved successfully from folder ${currentFolderId} to folder ${newFolderId}.`);
    } catch (error) {
      console.error('Error moving file:', error);
    }
  }



const postToInsta = async (imageBuffer) => {
    const ig = new IgApiClient();
    ig.state.generateDevice('nodemixer');
    await ig.account.login('nodemixer', 'Varun1234');
    await ig.publish.photo({
      file: imageBuffer,
      // caption: 'Really nice photo from the internet!', // nice caption (optional)
    }); 

}

// authorize().then(uploadFile).catch("error",console.error()); // function call
// authorize().then(downloadFile).catch("error",console.error());
// authorize().then(listFiles).catch("error",console.error());
// authorize().then((auth)=>{
//     APIKEY = auth
//     return listFiles(auth)
// }).then((fileId)=>moveFile(fileId,APIKEY)).catch("error",console.error());


// authorize().then((auth)=>{
//   APIKEY = auth
//   return listFiles(auth)
// }).then((fileId)=>downloadImageFromDrive(APIKEY,fileId)).then((buffer)=>{
//   fs.writeFileSync('downloaded_image.jpg', buffer);
//   console.log('Image downloaded and saved successfully.');
// }).catch("error",console.error());


// authorize().then((auth)=>{
//     var APIKEY = auth
//     var file_Id = listFiles(auth)
//     return file_Id
// }).then((fileId)=>downloadImageFromDrive(APIKEY,fileId)).then(postToInsta).then(()=>{
//   return moveFile(file_Id,APIKEY)
// }).catch("error",console.error());


const http=require('http')
const server=http.createServer((req,res)=>{
  const url=req.url;
  if(url==='/'){
    var currentdate = new Date(); 
    let H = currentdate.getHours();
    let M = currentdate.getMinutes();
    let time = H+' '+M 
    res.writeHead(200,{'content-type':'text/html'})
    res.end(time);
  }
})
server.listen(5000);

const perform = async()=>{
  try {
    const auth = await authorize()
    const file_Id = await listFiles(auth)
    if(file_Id === null) return
    const imageBuffer = await downloadImageFromDrive(auth,file_Id)
    await postToInsta(imageBuffer)
    await moveFile(file_Id,auth)
  } catch (error) {
    console.log(error)
  }
}

setInterval(()=>{
  fetch('https://qwerty-eg0m.onrender.com')
  var currentdate = new Date(); 
  let H = currentdate.getHours();
  let M = currentdate.getMinutes();
  if( H == 3 &&  13 <= M && M < 23){
    perform()
  }
},600000)



