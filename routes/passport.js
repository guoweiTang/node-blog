let express = require('express');
let router = express.Router();
let fs = require('fs');
let util = require('./util');
let mongoose = require('mongoose');
let db = mongoose.createConnection('localhost', 'myblogs');
let userSchema = new mongoose.Schema({
	id: String,
	name: String,
	password: String,
	picture: String
});
let userModel = db.model('users', userSchema);
//注册
router.route('/register.html')
.get(function(req, res, next){
	res.render('passport/register');
})
.post(function(req, res, next){
	res.set('Content-Type', 'text/html');
	let body = req.body;
	//检测该用户名是否已注册
	userModel.findOne({
		name: body.user
	}, function(err, baseUser){
		if(err){
			throw err;
			return;
		}
		let message;
		if(!!baseUser){
			res.send({
				status: -1,
				message: '该用户名已注册'
			})
		}else{
			if(!body.user || !body.password || !body.repassword){
				message = '表单不能为空';
			}else{
				if(body.password !== body.repassword){
					message = '两次输入密码不一致';
				}
			}
			if(message){
				console.log(message)
				res.send({
					status: -1,
					message: message
				})
			}
			let userSource = {
				id: util.createFactoryId(),
				name: body.user,
				password: body.password
			};
			userModel.create(userSource, function(err, data) {
				if(err){
					throw err;
					return;
				}
				req.session.user = userSource;
				res.send({
					status: 1,
					message: 'success',
					result: {
						url: '/'
					}
				})
			})
		}
	})
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
	userModel.findOne({
		name: body.user,
		password: body.password
	}, function(err, data) {
		if(err){
			throw err;
			return;
		}
		if(!data){
			res.end('The nickname or password is error, please <a href="javascript:history.go(-1)">input again</a>');
		}else{
			req.session.user = data;
			res.redirect('/');
		}
	})
})

//登出
router.get('/logout', function(req, res, next) {
	req.session = null
	res.redirect(req.get('Referer'));
})

module.exports = router;
