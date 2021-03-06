const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
const noop = () => {};

module.exports = router;

////////////////////////////// HELPER FUNCTIONS ////////////////////////////////

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
function sendToImageProcessor(filename, hash) {

    // create upload directory
    const uploadDir = process.env.UPLOAD_DIR + '/' + hash;
    fs.writeFile(uploadDir + '/processing', '', logError);

    // get path to image processor binary
    const image_processor_path = process.env.IMAGE_PROCESSOR_PATH;

    // get path to the solver binary
    const solver_path = process.env.PARTIAL_SOLVER_PATH;
    
    // setup the command we will pass to a child process
    let command = '"' + image_processor_path + '" "' + filename + '" "' + uploadDir + '" "' + solver_path + '"';

    // start child process
    childProcess.exec(command, (error, stdout, stderr) => {
      console.log(error);
      console.log(stderr);
      console.log(stdout);
    });
}


/**
 * Helper function which copies target to destination, then deletes target
 *   @params
 *    target: path of file to be copied
 *    destination: path we want to copy the file to
 */

function moveFile(target, destination) {
  fs.renameSync(target, destination, function (err) {
    if (err) {
      console.log(err);
    }
  // delete original file
  fs.unlink(target, noop);
  });
}

/**
 * Helper function that sets up a puzzle for the given file, creating the necessary
 * directories as well as process the image.
 *  @params
 *   hash: hash of the image that was just uploaded
 *   filename: path of the image that was just uploaded
 */
function processImage(hash, filename) {

    // compute name of directory for puzzle with the given hash
    const puzzleDir = process.env.UPLOAD_DIR + '/' + hash + '/';

    // compute name of directory for this puzzle's solutions
    const puzzleSolutionsDir = process.env.UPLOAD_DIR + '/' + hash + '/solutions/';

    // if directory already exists, simply delete the upload's tmp file and return
    if (fs.existsSync(puzzleDir)) {
      fs.unlink(filename, noop);
      return;
    }

    // create the puzzle & puzzle solution directories
    fs.mkdirSync(puzzleDir);
    fs.mkdirSync(puzzleSolutionsDir);

    // move from tmp folder to appropriate folder 
    const newFilename = puzzleDir + "photo.jpg";
    moveFile(filename, newFilename);

    // send image to image processor module
    sendToImageProcessor(newFilename, hash);
}

/**
 * Helper function that checks the mimetype of a file uploaded, ensuring it a jpeg file
 *   @params
 *    req: http request
 *    file: file uploaded through POST request
 *    callback: callback function
 */
function fileFilter(req, file, callback) {

  // if file is not jpeg, pass a new error and false to the callback function
  if (file.mimetype !== 'image/jpeg') {
    callback(new Error('File Upload Error'), false);
    return;
  }

    // pass no error and true to the callback function
    callback(null, true);
}


/////////////////////////////////// MAIN ///////////////////////////////////////

// configure muster for storage of uploaded files on disk
const storage = multer.diskStorage({
    destination: (req, file, callback) => {
      // store uploaded files into user os' temporary directory
    callback(null, os.tmpdir());
  },
  filename: (req, file, callback) => {
    // sanitize the name of uploaded file by randomizing it
    let buf = crypto.randomBytes(32);
    let name = buf.toString('hex');
    callback(null, name + '.jpg');
  }
});


// configure upload to single file upload, storage and filter function
const upload = multer({ storage: storage, fileFilter: fileFilter }).single('puzzle');


/**
 * /upload endpoint
 * accepts an uploaded file, moves it to storage folder and sends it to image processor
 * to get generate pieces file
 *   @requires
 *    file must be in jpeg format or else upload will fail
 *   @returns
 *    returns the hash of the upload image file as JSON
 */
router.post('/upload', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }

      // error handling for file upload issues
    if (!req.file) {
      next(new Error('File Upload Error'));
      return;
    }

    // stores file on the temp dir with temp name as configured
    // compute filename that we will save the uploaded file, in the user os' tmp folder
    const file = os.tmpdir() + '/' + req.file.filename;

    // hash the file. async process so we wait until hashing is completed before proceeded to next step
    hashFile(file).then((hash) => {
    // process image
    processImage(hash, file);
    // return hash as JSON
    res.json({ hash: hash });
    });
  });
});
