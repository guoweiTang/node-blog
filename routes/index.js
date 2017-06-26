let express = require('express');
let router = express.Router();
let util = require('./util');
//首页
router.all(['/', '/index.html'], function(req, res, next){
	//查询文章列表
	util.readFileSync('articles.json', function(jsonData, fullUrl) {
		let articlesResult = jsonData.result;
		if(jsonData.totalCount > 0){

			//查询文章作者基本信息
			util.readFileSync('user.json', function(userJsonData, userFullUrl) {
				let userResult = userJsonData.result;
				for(let theResult of articlesResult){
					for(let user of userResult){
						if(user.id === theResult.author.id){
							theResult.author.name = user.name;
							theResult.author.picture = user.picture || util.config.defaultPic;
							theResult.shortIntroduction = theResult.introduction.substr(0, 160) + '...';
							break;
						}
					}
				}
			});

		}
		res.render('index', {
			result: articlesResult
		});
	});
});

module.exports = router;
