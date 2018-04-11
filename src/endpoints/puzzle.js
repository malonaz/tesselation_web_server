const router = require('express').Router();
const fs = require('fs');
const childProcess = require('child_process');
const Promise = require('bluebird');

module.exports = router;

////////////////////////////// HELPER FUNCTIONS ////////////////////////////////////

/* Helper function that reads the pieces from a file
 *  @params
 *   filename: path of file containing the pieces
 * (potential problem)
 *  @returns
 *   a promise to resolve the data of the pieces file.
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

/////////////////////////////////// MAIN ////////////////////////////////////////////

/**
 * /check endpoint
 *  - checks if the /processing flag is still in the folder i.e. identifying pieces
 *  - if processing flag is not in folder && pieces file exits -> returns pieces data
 */
router.post('/check', (req, res, next) => {

    // get hash from the request
    const hash = req.body.hash;
    
    // make sure the request's hash is valid
    if (!/^[0-9A-F]+$/i.test(hash)) {
	next(new Error('Puzzle not found'));
	return;
    }

    // compute name of puzzle upload directory
    let puzzleDir = process.env.UPLOAD_DIR + '/' + hash;
 
    // make sure this puzzle's directory exists
    if (!fs.existsSync(puzzleDir)) {
	next(new Error('Puzzle not found'));
	return;
    }
    
    // checks if processing flag exists
    let processingFlag = puzzleDir + '/processing';
    if (fs.existsSync(processingFlag)) {
	res.json({ processing: true });
	return;
    }

    // read pieces from file and returns the data
    let piecesFile = puzzleDir + '/pieces';
    readPieces(piecesFile)
	.then((data) => {
	    res.json({
		processing: false,
		pieces: data
	    });
	});
});


/**
 * /solution endpoint
 * Executes solver search for a solution
 *   @requires
 *    POST request must contain a 1D array of the current puzzle state 
 *   @returns
 *    returns the solution based of solver program's stdout
 */
router.post('/solution', (req, res, next) => {

    // get path to partial solver exec
    const executable = process.env.PARTIAL_SOLVER_PATH;

    // get hash from POST request's body
    const hash = req.body.hash;
    
    // make sure hash is valid
    if (!/^[0-9A-F]+$/i.test(hash)) {
	next(new Error('Puzzle not found'));
	return;
    }

    // get puzzle state from POST request's body
    const puzzleState = req.body.state;
    
    // check if state is valid
    if (!/^[\d\s]+$/i.test(puzzleState)) {
	next(new Error('Input Error'));
	return;
    }

    // setup the command we will pass to a child process
    const flag = 1;
    const storage = process.env.UPLOAD_DIR + '/' + hash;
    let command = '"' + executable + '" "' + storage + '" "' + puzzleState + '" "' + flag + '"';

    // start child proces
    childProcess.exec(command, (error, stdout, stderr) => {
	console.log(error);
	console.log(stderr);
	console.log(stdout);

	// return solver's stdout in JSON
	res.json({ solution: stdout }); 
    });
});
