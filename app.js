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
        return files[Math.floor(Math.random() * files.length)].id
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
  fetch('https://qwerty-igbj.onrender.com')
  var currentdate = new Date(); 
  let H = currentdate.getHours();
  let M = currentdate.getMinutes();
  if( (H == 3|| H == 9) &&  20 <= M && M < 30){
    perform()
  }
},600000)



