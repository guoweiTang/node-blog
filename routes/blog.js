let express = require('express');
let router = express.Router();
let fs = require('fs');
let util = require('./util');
let mongoose = require('mongoose');
let db = mongoose.createConnection('localhost', 'myblogs');
let articleSchema = new mongoose.Schema({
	author: {
		id: String
	},
	id: String,
	title: String,
	introduction: String,
	createTime: Date,
	updateTime: Date,
	lookCount: Number
})
let userSchema = new mongoose.Schema({
	id: String,
	name: String,
	password: String,
	picture: String
});
let articleModel = db.model('articles', articleSchema);
let userModel = db.model('users', userSchema);
//个人博客首页
router.all(['/myblog.html', '/user/:id'], function(req, res, next){
	let isMyblog = req.path === '/myblog.html';
	let userId;
	if(isMyblog){
		userId = req.session.user ? req.session.user.id : undefined;
	}else{
		userId = req.params.id;
	}
	//已登录
	if(userId){
		articleModel.find({
			author: {
				id: userId
			}
		}, function(err, data) {
			if(data.length){
				for(let article of data) {
					article.createTimeDate = [article.createTime.getFullYear(), article.createTime.getMonth() + 1, article.createTime.getDate()].join('/');
					article.shortIntroduction = article.introduction.substr(0, 60) + '...';
				}
			}
			//访问我的博客
			if(isMyblog){
				res.render('blog/myblog', {
					result: data
				});
			//访问别人博客
			}else{
				userModel.findOne({
					id: userId
				}, function(err, userData) {
					res.render('blog/myblog', {
						title: userData.name + '的博客',
						result: data,
						author: {
							id: userData.id,
							name: userData.name,
							picture: userData.picture
						}
					});
				})
			}
		})
	}else{
		res.redirect('/passport/login.html');
	}
});

router.route('/publish.html')
.get(function(req, res, next){
	//已登录
	if(req.session.user){
		res.render('blog/publish');
	}else{
		res.redirect('/passport/login.html');
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
		articleModel.create({
			author: {
				id: user.id
			},
			id: util.createFactoryId(),
			title: body.articleTitle,
			introduction: body.articleDesc,
			createTime: new Date(),
			updateTime: new Date(),
			lookCount: 0
		}, function(err, data) {
			if(err) throw err;
			res.send({
				result: {
					url: '/blog/myblog.html'
				},
				status: 1,
				message: 'success'
			})
		})
	}else{
		res.send({
			status: -1,
			message: '请登录后操作'
		})
	}
});
router.get('/detail/:id', function(req, res) {
	articleModel.findOne({
		id: req.params.id
	}, function(err, article) {
		if(err) throw err;
		article.createTimeDate = [article.createTime.getFullYear(), article.createTime.getMonth() + 1, article.createTime.getDate()].join('/');
		userModel.findOne({
			id: article.author.id
		}, function(err, user) {
			if(err) throw err;
			article.author.name = user.name,
			article.author.picture = user.picture,
			res.render('blog/detail', {
				result: article
			})
		})
	})
})

module.exports = router;
