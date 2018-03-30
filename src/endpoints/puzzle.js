const router = require('express').Router();
const fs = require('fs');

module.exports = router;

function readPieces(filename, callback) {
  fs.readFile(filename, (err, data) => {
    if (err) {
      throw err;
    }
    callback(data);
  });
}

router.post('/check', (req, res, next) => {
  const hash = req.body.hash;
  if (!/^[0-9A-F]+$/i.test(hash)) {
    next(new Error('Puzzle not found'));
    return;
  }

  let file = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + hash
  if (!fs.existsSync(file)) {
    next(new Error('Puzzle not found'));
    return;
  }

  let test = file + '/processing';
  if (fs.existsSync(test)) {
    res.json({ processing: true });
    return;
  }

  let pieces_file = file + '/pieces';

  readPieces(pieces_file, (data) => {
    res.json({ processing: false, pieces: data });
  });
});

// router.post('/solution', (req, res, next)) => {
//
// }
