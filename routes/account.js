let express = require('express');
let router = express.Router();
let fs = require('fs');
let util = require('./util');
//专为form表单上传文件而生（https://github.com/expressjs/multer）
let multer  = require('multer');

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
		res.redirect('/login.html');
	}
})
.post(function(req, res, next){
	let sessionUser = req.session.user;
	sessionUser.picture = req.body.headPic;
	util.readFileSync('user.json', function(jsonData, fullUrl) {
		let result = jsonData.result;

		//更新用户信息
		for(let user of result){
			if(user.id === sessionUser.id){
				user.name = req.body.user;
				user.picture = sessionUser.picture;
				break;
			}
		}

		let ws = fs.createWriteStream(fullUrl);
		ws.end(JSON.stringify(jsonData));
		ws.on('close', function(){
			res.send({
				status: 1,
				message: 'success'
			})
		})
	});
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
