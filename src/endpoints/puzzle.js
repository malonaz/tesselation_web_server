const router = require('express').Router();
const fs = require('fs');

module.exports = router;

router.post('/check', (req, res, next) => {
  const hash = req.body.hash;
  console.log(hash);
  if (!/^[0-9A-F]+$/i.test(hash)) {
    console.log('not a hash');
    return res.json({msg: 'error! puzzle not found'})
  }
  let file = process.env.PRJ_DIR + process.env.UPLOAD_DIR + '/' + hash
  if (!fs.existsSync(file)) {
    console.log(file);
    return res.json({msg: 'error! puzzle not found'})
  }
  pieces_array = [];
  solutions_array =[];
  let test = file + '/solving';
  if (!fs.existsSync(test)) {
    res.json({solving: false, pieces: pieces_array, solutions: solutions_array});
  } else {
    res.json({solving: true});
  }
});

/* TODO when solver complete

*/
