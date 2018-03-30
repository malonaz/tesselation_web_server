const router = require('express').Router();
const fs = require('fs');

module.exports = router;

function readPieces(filename) {
  fs.readFile(filename, (err, data) => {
    if (err) {
      throw err;
    }
    return data;
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
  let pieces_data = readPieces(pieces_file);
  res.json({ processing: false, pieces: pieces_data });
});

// router.post('/solution', (req, res, next)) => {
//
// }
