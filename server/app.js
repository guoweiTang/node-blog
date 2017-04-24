/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-04-11 17:43:03
 * @version $Id$
 */
let express = require('express');
let colors = require('colors');
let bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
let cookieSession = require('cookie-session');
let fs = require('fs');

let sessionMap = new Map();

let app = express();

app.set('views', process.cwd() + '/webapp');
app.set('view engine', 'ejs');

//扩展
app.use(cookieParser())
app.use(bodyParser.urlencoded({extended: false}), bodyParser.raw())
app.use(express.static('webapp'))





//注册
app.route('/register.html')
.get(function(req, res, next){
	res.render('passport/register');
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	findWithFile(res, 'user.json');
	res.on('readEnd', function(fileData, url) {
		fileData.result = fileData.result || [];
		let ws = fs.createWriteStream(url);

		for(let user of fileData.result){
			//该用户名已注册
			if(user.name === body.user){
				res.end('The nickname has registered, please change other nickname <a href="javascript:history.go(-1)">register again</a> or <a href="/login.html">quick login</a>');
				return;
			}
		}

		let userDetail = {
			name: body.user,
			password: body.password,
			picture: '',
		};
		//用户列表添加数据
		fileData.result.push(userDetail);
		fileData.totalCount = (fileData.totalCount || 0) + 1;
		ws.end(JSON.stringify(fileData));

		ws.on('close', function(){
			addCookieSession(res, userDetail);
		})
	})
})

//登录
app.route('/login.html')
.get(function(req, res, next){
	res.render('passport/login', {
		isOnLine: false
	});
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	findWithFile(res, 'user.json');
	res.on('readEnd', function(fileData, url) {
		let userList = fileData.result || [];
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
			addCookieSession(res, userDetail);
		}else{
			res.end('The nickname or password is error, please <a href="javascript:history.go(-1)">input again</a>');
		}
	})
})

app.get('/logout', function(req, res, next) {
	res.clearCookie('session');
	res.redirect('/index.html');
})

//首页
app.all(['/', '/index.html'], function(req, res, next){
	let session = req.cookies.session;
	let data = {};
	//已登录，不考虑过期
	if(session){
		data.isOnLine = true;
		data.userProfile = sessionMap.get(session);
	}
	//查询文章列表
	findWithFile(res, 'articles.json');
	res.on('readEnd', function(fileData) {
		data.result = fileData.result || [];
		res.render('index/index', data);
	})
});



/**
 * [findWithFile 文件中查询json数据，并触发目标对象事件]
 * @param  {[type]} res      [目标对象]
 * @param  {[type]} fileName [文件名，含扩展名]
 * @return {[type]}          [description]
 */
function findWithFile(res, fileName){
	let url = __dirname + '/data/' + fileName;
	let rs = fs.createReadStream(url),
		fileData = '';
	rs.on('data', function(data) {
		fileData += data;
	})
	rs.on('end', function() {
		fileData = fileData || '{}';
		let jsonFileData = JSON.parse(fileData);
		res.emit('readEnd', jsonFileData, url);
	})
}

function addCookieSession(res, user){
	let sessionValue = (new Date()).getTime() + '';
	sessionMap.set(sessionValue, user);
	res.cookie('session', sessionValue);
	res.redirect('/index.html');
}






//错误处理
app.use(function(err, req, res, next){
	// res.end(err.message);
	next(err);
})


app.listen(3000, function(req){
	console.log('');
	console.log('The server of port %s is running!'.underline.white, '3000');
	console.log('');
})