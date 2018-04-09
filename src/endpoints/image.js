const router = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const os = require('os');
const childProcess = require('child_process');
const crypto = require('crypto');
const hashFile = require('./../lib/hashFile');
const noop = () => {};

module.exports = router;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    let buf = crypto.randomBytes(32);
    let name = buf.toString('hex');
    cb(null, name + '.jpg');
  }
});

function fileFilter(req, file, cb) {
  if (file.mimetype !== 'image/jpeg') {
    cb(new Error('File Upload Error'), false);
    return;
  }
  cb(null, true);
}

function processImage(file, hash) {
  const executable = process.env.IMAGE_PROCESSOR_PATH;
  const uploadDir = process.env.UPLOAD_DIR + '/' + hash;
  fs.writeFile(uploadDir + '/processing', '', (err) => {
    if (err) {
      console.log(err);
    }
  });
  let command = '"' + executable + '" "' + file + '" "' + uploadDir + '"';
  childProcess.exec(command, (error, stdout, stderr) => {
    console.log(error);
    console.log(stderr);
    console.log(stdout);
  });
}

function moveFileHashedRename(hash, oldFilename) {
  const newFilename = 'photo.jpg';
  const dir = process.env.UPLOAD_DIR + '/' + hash + '/';
  if (fs.existsSync(dir)) {
    fs.unlink(oldFilename, noop);
    return;
  }
  fs.mkdirSync(dir);
  const newDir = dir + newFilename;
  fs.rename(oldFilename, newDir, noop);
  processImage(newDir, hash);
}

const upload = multer({ storage: storage, fileFilter: fileFilter })
  .single('puzzle');

router.post('/upload', (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      next(err);
      return;
    }

    if (!req.file) {
      next(new Error('File Upload Error'));
      return;
    }

    const file = os.tmpdir() + '/' + req.file.filename;
    hashFile(file)
      .then((hash) => {
        moveFileHashedRename(hash, file);
        res.json({
          hash: hash
        });
      });
  });
});
