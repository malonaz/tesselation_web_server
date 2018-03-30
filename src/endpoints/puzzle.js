const router = require('express').Router();
const fs = require('fs');

module.exports = router;

function readPieces(filename){
  fs.readFile(filename, (err, data) => {
  if (err) throw err;
  return data;
  });
}

router.post('/check', (req, res, next) => {
  const hash = req.body.hash;
  if (!/^[0-9A-F]+$/i.test(hash)) {
    return res.json({msg: 'error! puzzle not found'});
  }
  let file = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + hash
  if (!fs.existsSync(file)) {
    return res.json({msg: 'error! puzzle not found'});
  }
  let test = file + '/processing';
  if (!fs.existsSync(test)) {
    let pieces_file = file + '/pieces';
    let pieces_data = readPieces(pieces_file);
    res.json({processing: false, pieces: pieces_data});
  } else {
    res.json({processing: true});
  }
});

// router.post('/solution', (req, res, next)) => {
//
// }
