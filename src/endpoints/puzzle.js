const router = require('express').Router();
const fs = require('fs');
const childProcess = require('child_process');
const Promise = require('bluebird');

module.exports = router;

/* function that reads the pieces file from the folder
    (potential problem)
*/
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

/* /check endpoint
  checks if the /processing flag is still in the folder i.e. identifying pieces
  if processing flag is not in folder && pieces file exits -> returns pieces data
*/
router.post('/check', (req, res, next) => {
  const hash = req.body.hash;
  // test if input provided is a hash
  if (!/^[0-9A-F]+$/i.test(hash)) {
    next(new Error('Puzzle not found'));
    return;
  }
  // checks whether puzzle exists from hash provided
  let file = process.env.UPLOAD_DIR + '/' + hash;
  if (!fs.existsSync(file)) {
    next(new Error('Puzzle not found'));
    return;
  }
  // checks if /processing flag exists
  let test = file + '/processing';
  if (fs.existsSync(test)) {
    res.json({ processing: true });
    return;
  }

  let piecesFile = file + '/pieces';
  // read pieces from file and returns the data
  readPieces(piecesFile)
    .then((data) => {
      res.json({
        processing: false,
        pieces: data
      });
    });
});

/*  /solution endpoint for request of a solution
    executes solver search for a compatible soultion.
    1) POST request will contain a 1D array of the current state of the board
    2) execute a call to solver to search for a compatible solution
    3) returns the solution based on stdout of solver program
*/
router.post('/solution', (req, res, next) => {
  const executable = process.env.PARTIAL_SOLVER_PATH; // configure solver search exec on .env
  const hash = req.body.hash; // hash retrieved from body of POST
  //checks if input is a hash
  if (!/^[0-9A-F]+$/i.test(hash)) {
    next(new Error('Puzzle not found'));
    return;
  }

  const state = req.body.state; //state retrieved from body of POST
  // check if input of state is valid
  if (!/^[\d\s]+$/i.test(state)) {
    next(new Error('Input Error'));
    return;
  }

  //prepare cmd for solver exec call
  const storage = process.env.UPLOAD_DIR + '/' + hash;
  let command = '"' + executable + '" "' + storage + '" "' + state + '"';
  childProcess.exec(command, (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    console.log(stdout);
    res.json({ solution: stdout }); //stdout of solver is the solution
  });
});
