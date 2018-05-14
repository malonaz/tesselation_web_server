const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
const noop = () => {};
const Promise = require('bluebird');

module.exports = router;

function moveFile(target, destination) {
  fs.renameSync(target, destination, function (err) {
    if (err) {
      console.log(err);
    }
  // delete original file
  fs.unlink(target, noop);
  });
}

function processPuzzle(hash, pieces, solution) {

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
    const newPieces = puzzleDir + "pieces";
    const newSolution = puzzleDir + "first";
    moveFile(pieces, newPieces);
    moveFile(pieces, newSolution);
}

function generatePuzzle(puzzleSize, callback){
  let buf = crypto.randomBytes(32);
  let tempF = buf.toString('hex');
  fs.mkdirSync(tempF);
  const exec1 = process.env.GENERATOR_PATH;
  let dir = './' + tempF;
  let cmd = '"' + exec1 + '" "' + puzzleSize + '"';
  childProcess.exec(cmd, [dir], (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    console.log(stdout);
  });
  let puzzlePiecesFile = './' + tempF + '/pieces';
  let puzzleSolutionsFile = './' + tempF + '/first';

  hashFile(puzzlePiecesFile).then((hash) => {
  // process puzzle - file management
  processPuzzle(hash, puzzlePiecesFile, puzzleSolutionsFile);
  });

  //delete temp file
  fs.unlink(tempF, noop);

  // returns generated hash
  callback(null, hash);
}

///
router.post('/', (req, res, next) => {

    // get size from the request
    const puzzleSize = req.body.size;

    // make sure the request's size is valid
    if (!/^[0-9]+$/i.test(puzzleSize)) {
      next(new Error('Input Error'));
      return;
    }

    generatePuzzle(puzzleSize, hash);

    // compute name of puzzle upload directory
    let puzzleDir = process.env.UPLOAD_DIR + '/' + hash;

    // read pieces from file and returns the data
    let piecesFile = puzzleDir + '/pieces';
    readPieces(piecesFile)
    .then((data) => {
      res.json({
      hash: hash,
      pieces: data
    });
  });
});
