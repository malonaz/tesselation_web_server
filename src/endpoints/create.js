const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
var rimraf = require('rimraf');
const noop = () => {};
const Promise = require('bluebird');

module.exports = router;

function readPieces(filename) {

  return new Promise((resolve) => {
    fs.readFile(filename, 'utf8', (err, data) => {
      if (err) {
        throw err;
      }
      resolve(data);
    });
  });
}

function moveFile(target, destination) {
  fs.renameSync(target, destination, function (err) {
    if (err) {
      console.log(err);
    }
  // delete original file
  fs.unlink(target, noop);
  });
}

function processPuzzle(hash, pieces, solution, tempDir) {
    console.log('process puzzle');

    // compute name of directory for puzzle with the given hash
    const puzzleDir = process.env.UPLOAD_DIR + '/' + hash + '/';

    // compute name of directory for this puzzle's solutions
    const puzzleSolutionsDir = process.env.UPLOAD_DIR + '/' + hash + '/solutions/';

    // if directory already exists, simply return
    if (fs.existsSync(puzzleDir)) {
      return;
    }

    // create the puzzle & puzzle solution directories
    fs.mkdirSync(puzzleDir);
    fs.mkdirSync(puzzleSolutionsDir);

    // set up new file directories for pieces and first solution
    const newPieces = puzzleDir + "pieces";
    const newSolution = puzzleSolutionsDir + "first";

    if (!fs.existsSync(pieces) && !fs.existsSync(solution)){
      console.log('files not found...exit');
      return;

    }
    moveFile(pieces, newPieces);
    moveFile(solution, newSolution);

    //delete temp folder and its comments
    rimraf(tempDir, function () { console.log('deleted ' + tempDir);});

    console.log('process puzzle completed');
}

function generatePuzzle(puzzleSize, callback){
  console.log('generating puzzle...');
  // creates a temp folder to create execute the random generator
  let buf = crypto.randomBytes(32);
  let tempF = buf.toString('hex');

  fs.mkdirSync(tempF); // created in /home/tps/web i.e. process.env.WEB_PATH

  const exec1 = process.env.GENERATOR_PATH;
  let dir = process.env.WEB_PATH + '/' + tempF;
  let cmd =  exec1 + ' ' + puzzleSize;

  console.log(dir);
  console.log(cmd);

  childProcess.exec(cmd, { cwd:dir }, (error, stdout, stderr) => {
    console.log('executing puzzle generator');
    console.log(error);
    console.log(stderr);
    console.log(stdout);

    let puzzlePiecesFile = process.env.WEB_PATH + '/' + tempF + '/pieces';
    let puzzleSolutionsFile = process.env.WEB_PATH + '/' + tempF + '/first';

    console.log(puzzlePiecesFile);
    console.log(puzzleSolutionsFile);

    if (!fs.existsSync(puzzlePiecesFile)){
      console.log('pieces file not found!');
      return;
    }

    if (!fs.existsSync(puzzleSolutionsFile)){
      console.log('solutions file not found!');
      return;
    }

    hashFile(puzzlePiecesFile).then((hash) => {
      // process puzzle - file management
      console.log(hash);
      processPuzzle(hash, puzzlePiecesFile, puzzleSolutionsFile, dir);
      // returns generated hash
      callback(hash);
    });
  });
}

/// MAIN ///
router.post('/', (req, res, next) => {

    // get size from the request
    const puzzleSize = req.body.size;

    // make sure the request's size is valid
    if (!/^[0-9]+$/i.test(puzzleSize)) {
      next(new Error('Input Error'));
      return;
    }

    console.log('generate puzzle');
    console.log(puzzleSize);

    generatePuzzle(puzzleSize, (hash) => {

      // compute name of puzzle upload directory
      let puzzleDir = process.env.UPLOAD_DIR + '/' + hash;

      console.log(puzzleDir);

      if (!fs.existsSync(puzzleDir)){
        console.log('ERROR PUZZLE NOT FOUND');
        res.json({
          msg: "puzzle not found"
        });
        return;
      }

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
});
