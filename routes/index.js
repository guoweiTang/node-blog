let express = require('express');
let router = express.Router();
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
//首页
router.all(['/', '/index.html'], function(req, res, next){
	//查询文章
	articleModel.find({}, function(err, data) {
		if(err) throw err;
		if(data.length){
			for(article of data){
				//查询作者
				userModel.findOne({
					id: article.author.id
				}, function(err, userData) {
					if(err) throw err;
					article.author.name = userData.name;
					article.author.picture = userData.picture || util.config.defaultPic;
					article.shortIntroduction = article.introduction.substr(0, 160) + '...';
				})
			}
			res.render('index', {
				result: data
			});
		}else{
			res.render('index', {
				result: []
			});
		}
	})
});

module.exports = router;
