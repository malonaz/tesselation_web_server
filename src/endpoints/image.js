const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
const noop = () => {};

module.exports = router;

//////////////////////////// aux functions ////////////////////////////////////
/* function that processeses the image file uploaded
  inputs: file directory of the image and hash
  1) takes in the hash of the image file to set up the upload directory for processing flag
  2) calls the solver executable; provides image directory and upload directory
*/
function processImage(file, hash) {
  const executable = process.env.IMAGE_PROCESSOR_PATH;
  const uploadDir = process.env.UPLOAD_DIR + '/' + hash;
  fs.writeFile(uploadDir + '/processing', '', (err) => {
    if (err) {
      console.log(err);
    }
  });
  let command = '"' + executable + '" "' + file + '" "' + uploadDir + '"'; //prepared cmd for the shell execution
  childProcess.exec(command, (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    console.log(stdout);
  });
}

/* function that takes in generated hash and creates a folder for the specific Puzzle
  based on the hash provided.
*/
function moveFileHashedRename(hash, oldFilename) {
  const newFilename = 'photo.jpg'; //puzzle picture name is photo - so creative
  const dir = process.env.UPLOAD_DIR + '/' + hash + '/'; // folder directory with hash as name
  if (fs.existsSync(dir)) {
    fs.unlink(oldFilename, noop); // do nothing if the hash already exists
    return;
  }
  fs.mkdirSync(dir); // creates a new folder with hash as folder name
  const newDir = dir + newFilename; // new directory
  fs.rename(oldFilename, newDir, noop); //renames to the very creative name of photo
  processImage(newDir, hash); // calls processImage to send image to solver
}

///////////////////////////////////////////////////////////////////////////////

/* multer to configure the storage of file on disk */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // stores onto temporary directory
  },
  filename: (req, file, cb) => { // sanitize the name of uploaded file
    let buf = crypto.randomBytes(32); // temporary filename
    let name = buf.toString('hex');
    cb(null, name + '.jpg');
  }
});

/* function that checks the mimetype of the file uploaded */
function fileFilter(req, file, cb) {
  if (file.mimetype !== 'image/jpeg') { // only accepts jpeg file
    cb(new Error('File Upload Error'), false);
    return;
  }
  cb(null, true);
}

/* configuration for upload: single file upload, storage and filter */
const upload = multer({ storage: storage, fileFilter: fileFilter })
  .single('puzzle');

/* handling the upload on /upload */
router.post('/upload', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }
    /* error handling for file upload issues */
    if (!req.file) {
      next(new Error('File Upload Error'));
      return;
    }
    /* stores file on the temp dir with temp name as configured */
    const file = os.tmpdir() + '/' + req.file.filename;
    hashFile(file) // exciting part of hashing the contents of the image to use as unique id
      .then((hash) => { //async process; waits for the hashing to be completed before sending hash to next process
        moveFileHashedRename(hash, file); // read the function description >.<
        res.json({
          hash: hash //returns hash as json
        });
      });
  });
});
