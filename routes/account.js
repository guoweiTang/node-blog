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
let upload = multer({ storage: storage });

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

router.post('/uploadPicture.json', upload.single('headPic'), function(req, res, next) {
	console.log(req.file);
	if(req.file.size > 1024 * 5){
		res.send({
			status: -1,
			message: '上传头像不能超过5MB'
		})
		return;
	}
	let extName = file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
	if(!(/^(jpg|png|gif)$/.test(extName))){
		res.send({
			status: -1,
			message: '上传头像只支持扩展名为jpg、png、gif的文件'
		})
		return;
	}
	let sessionUser = req.session.user;
	let serverFileName = req.file.filename;
	let serverPicturePath = '/upload-sources/i/' + serverFileName;
	sessionUser.picture = serverPicturePath;
	util.readFileSync('user.json', function(jsonData, fullUrl) {
		let result = jsonData.result;

		//更新用户头像
		for(let user of result){
			if(user.id === sessionUser.id){
				user.picture = serverPicturePath;
				break;
			}
		}

		let ws = fs.createWriteStream(fullUrl);
		ws.end(JSON.stringify(jsonData));
		ws.on('close', function(){
			res.send({
				result: {
					picture: serverPicturePath
				},
				status: 1,
				message: 'success'
			})
		})
	});
})

module.exports = router;
