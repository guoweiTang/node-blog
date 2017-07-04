let express = require('express');
let router = express.Router();
let util = require('./util');
//专为form表单上传文件而生（https://github.com/expressjs/multer）
let multer  = require('multer');
let mongoose = require('mongoose');
let db = mongoose.createConnection('localhost', 'myblogs');
let userSchema = new mongoose.Schema({
	id: String,
	name: String,
	password: String,
	picture: String
});
let userModel = db.model('users', userSchema);

//上传头像
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/upload-sources/i')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + file.originalname.substr(file.originalname.lastIndexOf('.')))
  }
})
let upload = multer({
	storage: storage,
	fileFilter: function (req, file, cb) {
		let extName = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
		if(!isAbleUploadPic(file)){
			cb(new Error('上传头像只支持扩展名为jpg、png、gif的文件'));
			return;
		}
		cb(null, true);
	},
	limits: {
		fileSize: 1024 * 1024 * 4,
		files: 1
	}
});
function isAbleUploadPic(file){
	return (/^image\/(jpeg|gif|png)$/).test(file.mimetype);
}
//设置
router.route('/profile.html')
.get(function(req, res, next){
	//已登录
	if(req.session.user){
		res.render('account/profile');
	}else{
		res.redirect('/passport/login.html');
	}
})
.post(function(req, res, next){
	let sessionUser = req.session.user;
	sessionUser.picture = req.body.headPic;
	sessionUser.name = req.body.user;

	userModel.findOneAndUpdate({
		id: sessionUser.id
	},{
		name: sessionUser.name,
		picture: sessionUser.picture
	}, function(err, data) {
		if(err) throw err;
		res.send({
			status: 1,
			message: 'success'
		})
	})
})

router.post('/uploadPicture.json', function(req, res, next) {
	upload.single('headPic')(req, res, function(err){
		if(err){
			if(err.code === 'LIMIT_FILE_SIZE'){
				err.message = '上传文件不能超过5MB';
			}
			res.send({
				status: -1,
				message: err.message
			})
			return;
		}
		let serverFileName = req.file.filename;
		let serverPicturePath = '/upload-sources/i/' + serverFileName;
		res.send({
			result: {
				picture: serverPicturePath
			},
			status: 1,
			message: 'success'
		})
	})
})

module.exports = router;
