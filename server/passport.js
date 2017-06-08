/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-04-11 17:43:03
 * @version $Id$
 */
let fs = require('fs');
module.exports = function(){
	return function(req, res, next){
		let app = req.app;
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
		next();
	}
}
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


