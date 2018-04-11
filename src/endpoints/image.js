const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
const noop = () => {};

module.exports = router;

//////////////////////////// HELPER FUNCTIONS ////////////////////////////////////

/**
 * Helper function which logs a given error to the console.
 *   @params
 *    err: error to be logged
 */
const logError = function(err){
    if (err)
	console.log(err);
};


/**
 * Helper function that sends the given image file to our image processor executable
 * using a child process.
 *   @params
 *    filename: filepath of image to be processed
 *    hash: hash of the image
 */
function processImage(filename, hash) {
    
    // create upload directory
    const uploadDir = process.env.UPLOAD_DIR + '/' + hash;
    fs.writeFile(uploadDir + '/processing', '', logError);

    // get path to image processor
    const executable = process.env.IMAGE_PROCESSOR_PATH;

    // setup the command we will pass to a child process
    let command = '"' + executable + '" "' + filename + '" "' + uploadDir + '"';

    // start child process
    childProcess.exec(command, (error, stdout, stderr) => {
	console.log(error);
	console.log(stderr);
	console.log(stdout);
    });
}


/**
 * Helper function which copies target to destination, then deletes target.
 *   @params
 *    target: path of file to be copied
 *    destination: path we want to copy the file to
 */
function moveFile(target, destination) {
    fs.readFile(target, function(err, data) {
	if (err) throw err;
	fs.writeFile(destination, data, noop);
    });
    fs.unlink(target, noop);
}


/** 
 * Helper function that takes in generated hash and creates a folder for the specific Puzzle
 * based on the hash provided.
 */
function moveFileHashedRename(hash, oldFilename) {
    
    const dir = process.env.UPLOAD_DIR + '/' + hash + '/'; // folder directory with hash as name
    if (fs.existsSync(dir)) {
	fs.unlink(oldFilename, noop); // do nothing if the hash already exists
	return;
    }
    fs.mkdirSync(dir); // creates a new folder with hash as folder name
    
    // copy from tmp folder to appropriate folder and delete old file
    const newFilename = dir + "photo.jpg";
    moveFile(oldFilename, newFilename);
    fs.unlink(oldFilename, noop); 
    
    processImage(newFilename, hash); // calls processImage to send image to solver
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
