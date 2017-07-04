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
	let message;

	if(!body.user || !body.password || !body.repassword){
		message = '表单不能为空';
	}else{
		if(body.password !== body.repassword){
			message = '两次输入密码不一致';
		}
	}
	if(message){

		res.send({
			status: -1,
			message: message
		})
		return;
	}
	//检测该用户名是否已注册
	userModel.findOne({
		name: body.user
	}, function(err, baseUser){
		if(err){
			throw err;
			return;
		}
		console.log(baseUser);
		if(!!baseUser){
			res.send({
				status: -1,
				message: '该用户名已注册'
			})
		}else{
			let userSource = {
				id: util.createFactoryId(),
				name: body.user,
				password: body.password,
				picture: util.config.defaultPic
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
	let message;

	if(!body.user || !body.password){
		res.send({
			status: -1,
			message: '表单不能为空'
		})
	}
	userModel.findOne({
		name: body.user,
		password: body.password
	}, function(err, data) {
		if(err){
			throw err;
		}
		if(!data){
			res.send({
				status: -1,
				message: '帐号或密码错误'
			})
		}else{
			req.session.user = data;
			res.send({
				status: 1,
				message: 'success',
				result: {
					url: '/'
				}
			})
		}
	})
})

//登出
router.get('/logout', function(req, res, next) {
	req.session = null
	res.redirect(req.get('Referer'));
})

module.exports = router;
