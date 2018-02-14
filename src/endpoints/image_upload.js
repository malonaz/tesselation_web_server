const router = require('express').Router();
const multer = require('multer');
const fs = require('fs')
const os = require('os');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');

module.exports = router;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, os.tmpdir());
  },
  fileFilter: function (req, file, cb) {
     if (file.mimetype !== 'image/jpg') {
       console.log('file type error');
       return cb(null, false, new Error('File Upload Error'));
     }
   },
  filename: function(req, file, cb){
    let buf = crypto.randomBytes(32);
    let temp_name = buf.toString('hex');
    cb(null, temp_name + '.jpg');
  }
});

const upload = multer({storage : storage}).single('puzzle');

function moveFileHashedRename(hash, old_filename) {
  console.log(hash);
  console.log(old_filename);
  const new_filename = 'photo.jpg';
  const dir = __dirname + '/puzzle_images/uploads/' + hash;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
    fs.rename(old_filename, dir + '/' + new_filename);
  }
  else {
    console.log('Puzzle Folder Already Exists');
  }
}

router.post('/', (req, res, next) => {
  upload(req, res, function(err){
    if(err) {
      res.status(err.status || 500).json({ "error": { "status_code": err.status || 500, "message": err.code } });
      console.log("error: " + err.code);
      return;
    } else if (!req.file) {
      console.log("File Upload Error")
      return res.end('File Upload Error')
    } else{
      const file = os.tmpdir() + '/' + req.file.filename;
      hashFile(file)
        .then((hash) => {
        moveFileHashedRename(hash, file);
        });
      console.log("File uploaded!" );
      return res.end('File uploaded!');
    }
  });
});
