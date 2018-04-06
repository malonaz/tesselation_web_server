const router = require('express').Router();
const fs = require('fs');
const childProcess = require('child_process');
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

router.post('/check', (req, res, next) => {
  const hash = req.body.hash;
  if (!/^[0-9A-F]+$/i.test(hash)) {
    next(new Error('Puzzle not found'));
    return;
  }

  let file = process.env.UPLOAD_DIR + '/' + hash;
  if (!fs.existsSync(file)) {
    next(new Error('Puzzle not found'));
    return;
  }

  let test = file + '/processing';
  if (fs.existsSync(test)) {
    res.json({ processing: true });
    return;
  }

  let piecesFile = file + '/pieces';

  readPieces(piecesFile)
    .then((data) => {
      res.json({
        processing: false,
        pieces: data
      });
    });
});

router.post('/solution', (req, res, next) => {
  const executable = process.env.PARTIAL_SOLVER_PATH;
  const hash = req.body.hash;
  console.log(hash);
  if (!/^[0-9A-F]+$/i.test(hash)) {
    next(new Error('Puzzle not found'));
    return;
  }
  const state = req.body.state;
  console.log(state);
  if (!/^[\d\s]+$/i.test(state)) {
    next(new Error('Input Error'));
    return;
  }
  let command = '"' + executable + '" "' + hash + '" "' + state + '"';
  childProcess.exec(command, (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    console.log(stdout);
    res.json({ solution: stdout });
  });
});
