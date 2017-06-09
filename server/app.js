/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-04-11 17:43:03
 * @version $Id$
 */
let express = require('express');
let colors = require('colors');
let bodyParser = require('body-parser');
let multer  = require('multer');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let fs = require('fs');
let passport = require('./passport');

let sessionMap = new Map();
let app = express();
//上传头像
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'upload-sources/i')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + '.' + getExtName(file))
  }
})
function getExtName(file){
	switch(file.mimetype){
		case 'image/jpeg':
			return 'jpg';
			break;
		case 'image/png':
			return 'png';
			break;
		case 'image/gif':
			return 'gif';
			break;
		default: 
			return file.originalname.substr(file.originalname.lastIndexOf('.') + 1);
	}
}
let upload = multer({ storage: storage });

app.set('trust proxy', 1) // trust first proxy
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

app.set('views', process.cwd() + '/webapp');
app.set('view engine', 'ejs');

//cookie && body
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
//设置静态目录
app.use(express.static('webapp'));
app.use(express.static('upload-sources'));

//注入全局变量
app.use(function(req, res, next){
	let user = req.session.user;
	if(user && !user.picture){
		user.picture = '/i/default-head.jpg';
	}
	app.locals.session = req.session;
	next();
})

//账号管理
app.use(passport());

//首页
app.all(['/', '/index.html'], function(req, res, next){
	//查询文章列表
	findWithFile('articles.json', function(jsonData, fullUrl) {
		let articlesResult = jsonData.result;
		if(jsonData.totalCount > 0){
			for(let theResult of articlesResult){
				//查询作者基本信息
				findWithFile('user.json', function(jsonData, fullUrl) {
					let result = jsonData.result;
					for(let user of result){
						if(user.id === theResult.author.id){
							theResult.author.name = user.name;
							theResult.author.picture = user.picture || '/i/default-head.jpg';
							theResult.shortIntroduction = theResult.introduction.substr(0, 160) + '...';
							break;
						}
					}
				});
			}
			res.render('index/index', {
				result: articlesResult
			});
		}
	});
});


//个人博客列表
app.all('/profile.html', function(req, res, next){
	let user = req.session.user;
	//已登录
	if(user){
		let privateFileUrl = __dirname + '/data/private-articles/' + user.id + '.json';
		fs.stat(privateFileUrl, function(err, stat) {
			if(err){
				res.render('profile/profile', {
					result: []
				});
			}else{
				findWithFile('private-articles/' + user.id + '.json', function(jsonData, fullUrl) {
					let result = jsonData.result;
					if(jsonData.totalCount > 0){
						for(let theResult of result){
							theResult.shortIntroduction = theResult.introduction.substr(0, 60) + '...';
						}
					}
					res.render('profile/profile', {
						result: result
					});
				});
			}
		})
		
	}else{
		res.redirect('/login.html');
	}
});

app.route('/publish.html')
.get(function(req, res, next){
	//已登录
	if(req.session.user){
		res.render('article/publish');
	}else{
		res.redirect('/login.html');
	}
})
.post(function(req, res, next){
	//已登录
	if(req.session.user){
		let body = req.body;
		let user = req.session.user;
		if(!body.articleTitle || !body.articleDesc){
			res.send({
				status: -1,
				message: '标题和内容都是必填'
			})
			return;
		}
		let privateFileUrl = __dirname + '/data/private-articles/' + user.id + '.json';
		let date = new Date();
		let createTime = date.getFullYear() + '/' + ((date.getMonth() + 1) > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)) + '/' + (date.getDate() > 9 ? date.getDate() : '0' + date.getDate());
		let articleId = factoryId();
		let article = {
            "id": articleId,
            "title": body.articleTitle,
            "introduction": body.articleDesc,
            "time": createTime,
            "lookCount": 0
		}
		//检测文件是否存在
		fs.stat(privateFileUrl, function(err, stat) {
			if(err){
				let ws = fs.createWriteStream(privateFileUrl);
				let data = {};
				data.result = [article];
				data.totalCount = 1;
				ws.end(JSON.stringify(data));
				ws.on('close', function(){
					res.redirect('/profile.html');
				})
			}else{
				findWithFile('private-articles/' + user.id + '.json', function(jsonData, fullUrl) {
					let ws = fs.createWriteStream(privateFileUrl);
					jsonData.result.push(article);
					jsonData.totalCount ++;
					ws.end(JSON.stringify(jsonData));
					ws.on('close', function(){
						res.redirect('/profile.html');
					})
				})
			}
		})
		findWithFile('articles.json', function(jsonData, fullUrl) {
			let ws = fs.createWriteStream(fullUrl);
			let article = {
				"author": {
	                "id": user.id
				},
	            "id": articleId,
	            "title": body.articleTitle,
	            "introduction": body.articleDesc,
	            "time": createTime,
	            "lookCount": 0
			}
			jsonData.result.push(article);
			jsonData.totalCount ++;
			ws.end(JSON.stringify(jsonData));
		})
		
	}
});

//设置
app.route('/settings.html')
.get(function(req, res, next){
	//已登录
	if(req.session.user){
		res.render('profile/settings');
	}else{
		res.redirect('/login.html');
	}
})

app.post('/uploadPicture.json', upload.single('headPic'), function(req, res, next) {
	let sessionUser = req.session.user;
	let serverFileName = req.file.path.substr(req.file.path.lastIndexOf('/') + 1);
	let serverPicturePath = '/i/' + serverFileName;
	sessionUser.picture = serverPicturePath;
	findWithFile('user.json', function(jsonData, fullUrl) {
		let result = jsonData.result;

		//检测该用户名是否已注册
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

/**
 * [findWithFile 文件中查询json数据]
 * @param  {[type]} fileName [文件名，含扩展名]
 * @return {[type]}          [description]
 */
function findWithFile(fileName, callback){
	let fullUrl = __dirname + '/data/' + fileName;
	let fileText = fs.readFileSync(fullUrl, 'utf-8');
	fileText = fileText || '{}';
	let jsonFileData = JSON.parse(fileText);
	jsonFileData.result = jsonFileData.result || [];
	jsonFileData.totalCount = jsonFileData.totalCount || 0;
	typeof callback === 'function' && callback(jsonFileData, fullUrl);
}

/**
 * [factoryId 生成虚拟id的工厂]
 * @return {[type]} [description]
 */
function factoryId(){
	return '' + parseInt(Math.random()*Math.pow(10, 4)) + parseInt(Math.random()*Math.pow(10, 4))
}





//错误处理
app.use(function(err, req, res, next){
	next(err);
})


app.listen(3000, function(req){
	console.log('');
	console.log('The server of port %s is running!'.underline.white, '3000');
	console.log('');
})