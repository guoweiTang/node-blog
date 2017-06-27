let express = require('express');
let router = express.Router();
let fs = require('fs');
let util = require('./util');
//注册
router.route('/register.html')
.get(function(req, res, next){
	res.render('passport/register');
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	util.readFileSync('user.json', function(jsonData, fullUrl) {
		let result = jsonData.result;

		//检测该用户名是否已注册
		for(let user of result){
			if(user.name === body.user){
				res.end('The nickname has registered, please change other nickname <a href="javascript:history.go(-1)">register again</a> or <a href="/login.html">quick login</a>');
				return;
			}
		}

		let userDetail = {
			id: util.createFactoryId(),
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
			res.redirect('/');
		})
		//新建个人博客文件
		fs.createWriteStream(process.cwd() + '/database/private-articles/' + userDetail.id + '.json').end('');
	});
})

//登录
router.route('/login.html')
.get(function(req, res, next){
	//已登录
	if(req.session.user){
		res.redirect('/');
	}else{
		res.render('passport/login');
	}
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	util.readFileSync('user.json', function(jsonData, fullUrl) {
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
			res.redirect('/');
		}else{
			res.end('The nickname or password is error, please <a href="javascript:history.go(-1)">input again</a>');
		}
	})
})

//登出
router.get('/logout', function(req, res, next) {
	req.session = null
	res.redirect(req.get('Referer'));
})

module.exports = router;
