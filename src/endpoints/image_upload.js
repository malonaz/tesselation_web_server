const router = require('express').Router();
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
        cb(null, __dirname + '/puzzle_images/uploads')
    },
  filename: function(req, file, cb){
    console.log(file.mimetype);
    cb(null, file.originalname + '-' + Date.now() + getExtension(file));
  }
});

function getExtension(file) {
    var res = '';
    if (file.mimetype === 'image/jpeg') res = '.jpg';
    if (file.mimetype === 'image/png') res = '.png';
    return res;
}

var upload = multer({storage : storage}).single('puzzle');

module.exports = router;

router.post('/', (req, res, next) => {
  upload(req, res, function(err){
    if(err) {
      res.status(err.status || 500).json({ "error": { "status_code": err.status || 500, "message": err.code } });
      console.log("error: " + err.code);
      return;
    } else {
      console.log("file recieved: " + Date.now());
      return res.end('File received.');
    }
  });
});
