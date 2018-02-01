const router = require('express').Router();
var multer = require('multer');
var storage = multer.diskStorage({
  destination:  __dirname + '/puzzle_images/uploads',
  filename: function(req, file, cb){
    cb(null, file.filename + '-' + Date.now() + path.extname(file.orignalname));
  }
});

var upload = multer({storage : storage}).single('puzzle');
module.exports = router;

router.post('/', (req, res, next) => {
  upload(req, res, function(err){
    if(err) {
      return res.end("Error uploading file.")
    } else if (!req.file) {
      res.write('No file recieved!');
      return res.end({success: false});
    } else {
      res.write('File recieved.');
      return res.end({success: true})
    }
  });
});
