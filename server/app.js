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

let sessionMap = new Map();
let app = express();
let upload = multer({
	dest: 'upload-sources/i'
});

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

//注入全局变量：isOnLine、userProfile
app.use(function(req, res, next){
	let user = req.session.user;
	if(user && !user.picture){
		user.picture = '/i/default-head.jpg';
	}
	app.locals.session = req.session;
	next();
})

//注册
app.route('/register.html')
.get(function(req, res, next){
	res.render('passport/register');
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	findWithFile('user.json', function(jsonData, fullUrl) {
		let result = jsonData.result;

		//检测该用户名是否已注册
		for(let user of result){
			if(user.name === body.user){
				res.end('The nickname has registered, please change other nickname <a href="javascript:history.go(-1)">register again</a> or <a href="/login.html">quick login</a>');
				return;
			}
		}

		let userDetail = {
			id: factoryId(),
			name: body.user,
			password: body.password,
			picture: '',
		};
		//用户列表添加数据
		result.push(userDetail);
		jsonData.totalCount ++;

		let ws = fs.createWriteStream(fullUrl);
		ws.end(JSON.stringify(jsonData));
		ws.on('close', function(){
			req.session.user = userDetail;
			res.redirect('/index.html');
		})
	});
})

//登录
app.route('/login.html')
.get(function(req, res, next){
	//已登录
	if(app.locals.isOnLine){
		res.redirect('/index.html');
	}else{
		res.render('passport/login');
	}
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	findWithFile('user.json', function(jsonData, fullUrl) {
		let userList = jsonData.result;
		//登录是否成功标识
		let loginSign = false;
		let userDetail = null;
		for(let user of userList){
			if(user.name === body.user && user.password === body.password){
				loginSign = true;
				userDetail = user;
				break;
			}
		}
		//登录成功
		if(loginSign){
			req.session.user = userDetail;
			res.redirect('/index.html');
		}else{
			res.end('The nickname or password is error, please <a href="javascript:history.go(-1)">input again</a>');
		}
	})
})

//登出
app.get('/logout', function(req, res, next) {
	req.session = null
	res.redirect(req.get('Referer'));
})

//首页
app.all(['/', '/index.html'], function(req, res, next){
	//查询文章列表
	findWithFile('articles.json', function(jsonData, fullUrl) {
		let result = jsonData.result;
		for(let article of result){
			if(!article.author.picture){
				article.author.picture = '/i/default-head.jpg';
			}
		}
		res.render('index/index', {
			result: result
		});
	});
});


//个人博客列表
app.all('/profile.html', function(req, res, next){
	//已登录
	if(req.session.user){
		findWithFile('articles.json', function(jsonData, fullUrl) {
			res.render('profile/profile', {
				result: jsonData.result
			});
		});
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
		let fullUrl = __dirname + '/data/articles.json';
		let ws = fs.createWriteStream(fullUrl);
		let user = req.session.user;
		let date = new Date();
		let article = {
            "id": factoryId(),
            "author": {
                "id": user.id,
                "name": user.name,
                "picture": user.picture
            },
            "title": body.articleTitle,
            "shortIntroduction": body.articleDesc,
            "time": date.getFullYear() + '/' + ((date.getMonth() + 1) > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)) + '/' + (date.getDate() > 9 ? date.getDate() : '0' + date.getDate()),
            "lookCount": 0
		}
		ws.end(JSON.stringify(article));
		ws.on('close', function(){
			res.redirect('/profile.html');
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
.post(upload.single('headPic'), function(req, res, next){
	res.end('ok')
})


/**
 * [findWithFile 文件中查询json数据]
 * @param  {[type]} fileName [文件名，含扩展名]
 * @return {[type]}          [description]
 */
function findWithFile(fileName, callback){
	let fullUrl = __dirname + '/data/' + fileName;
	let rs = fs.createReadStream(fullUrl),
		fileData = '';
	rs.on('data', function(data) {
		fileData += data;
	})
	rs.on('end', function() {
		fileData = fileData || '{}';
		let jsonFileData = JSON.parse(fileData);
		jsonFileData.result = jsonFileData.result || [];
		jsonFileData.totalCount = jsonFileData.totalCount || 0;
		typeof callback === 'function' && callback(jsonFileData, fullUrl);
	})
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