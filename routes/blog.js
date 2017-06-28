let express = require('express');
let router = express.Router();
let fs = require('fs');
let util = require('./util');
//个人博客列表
router.all('/myblog.html', function(req, res, next){
	let user = req.session.user;
	//已登录
	if(user){
		let privateFileUrl = process.cwd() + '/database/private-articles/' + user.id + '.json';
		fs.stat(privateFileUrl, function(err, stat) {
			if(err){
				res.render('blog/myblog', {
					result: []
				});
			}else{
				util.readFileSync('private-articles/' + user.id + '.json', function(jsonData, fullUrl) {
					let result = jsonData.result;
					if(jsonData.totalCount > 0){
						for(let theResult of result){
							theResult.shortIntroduction = theResult.introduction.substr(0, 60) + '...';
						}
					}
					res.render('blog/myblog', {
						result: result
					});
				});
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
		let privateFileUrl = process.cwd() + '/database/private-articles/' + user.id + '.json';
		let date = new Date();
		let createTime = date.getFullYear() + '/' + ((date.getMonth() + 1) > 9 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)) + '/' + (date.getDate() > 9 ? date.getDate() : '0' + date.getDate());
		let articleId = util.createFactoryId();
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
					res.redirect('/blog/myblog.html');
				})
			}else{
				util.readFileSync('private-articles/' + user.id + '.json', function(jsonData, fullUrl) {
					let ws = fs.createWriteStream(privateFileUrl);
					jsonData.result.push(article);
					jsonData.totalCount ++;
					ws.end(JSON.stringify(jsonData));
					ws.on('close', function(){
						res.redirect('/blog/myblog.html');
					})
				})
			}
		})
		util.readFileSync('articles.json', function(jsonData, fullUrl) {
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
router.get('/detail/:id', function(req, res) {
	util.readFileSync('articles.json', function(jsonData, fullUrl) {
		let articlesList = jsonData.result;
		if(jsonData.totalCount){
			//查找文章
			for(article of articlesList){
				if(article.id === req.params.id){
					util.readFileSync('user.json', function(jsonData, fullUrl) {
						let userList = jsonData.result;
						//查找作者
						for(user of userList){
							if(user.id === article.author.id){
								// util.readFileSync('private-articles/' + user.id + '.json', function(jsonData, fullUrl){
								// 	if(jsonData.totalCount > 0){
								// 		for(privateArticle of jsonData.result){
								// 			if(privateArticle.id === article.id){
								// 				privateArticle.lookCount ++;
								// 				break;
								// 			}
								// 		}
								// 	}
								// 	fs.createWriteStream(fullUrl).end(JSON.stringify(jsonData));
								// })
								// article.lookCount ++;
								// let ws = fs.createWriteStream(fullUrl)
								// ws.end(JSON.stringify(jsonData));
								// ws.on('close', function() {
									article.author = user;
									res.render('blog/detail', {
										title: article.title,
										result: article
									})
								// })
								break;
							}
						}
					})

				}
			}
			
		}
	})
})
router.get('/user/:id', function(req, res) {
	util.readFileSync('private-articles/' + req.params.id + '.json', function(jsonData, fullUrl) {
		let articlesList = jsonData.result;
		if(jsonData.totalCount){
			for(let article of articlesList){
				article.shortIntroduction = article.introduction.substr(0, 60) + '...';
			}
			//查找文章
			util.readFileSync('user.json', function(jsonData, fullUrl) {
				let userList = jsonData.result;
				//查找作者
				for(user of userList){
					if(user.id === req.params.id){
						res.render('blog/myblog', {
							title: user.name + '的博客',
							author: user,
							result: articlesList
						})
						break;
					}
				}
			})
			
		}
	})
})

module.exports = router;
