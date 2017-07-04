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
			let article;
			for(let i = 0, len = data.length; i < len; i ++){
				article = data[i];
				article.shortIntroduction = article.introduction.substr(0, 160) + '...';
				article.createTimeDate = [article.createTime.getFullYear(), article.createTime.getMonth() + 1, article.createTime.getDate()].join('/');
				//查询作者
				(function(index){
					userModel.findOne({
						id: data[index].author.id
					}, function(err, userData) {
						if(err) throw err;
						data[index].author.name = userData.name;
						data[index].author.picture = userData.picture;
						if(index === data.length - 1){
							res.render('index', {
								result: data
							});
						}
					})
				}(i))
			}
		}else{
			res.render('index', {
				result: []
			});
		}
	})
});

module.exports = router;
