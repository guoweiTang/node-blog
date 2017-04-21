/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-04-11 17:43:03
 * @version $Id$
 */
let express = require('express'),
	bodyParser = require('body-parser'),
	cookieSession = require('cookie-session'),
	fs = require('fs');

let app = express();

app.set('views', process.cwd() + '/webapp');
app.set('view engine', 'ejs');

app.set('trust proxy', 1) // trust first proxy 
 
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
  maxAge: 24 * 60 * 60 * 1000
}))

//扩展
app.use(bodyParser.urlencoded({extended: false}), bodyParser.raw())
app.use(express.static('webapp'))





//注册
app.route('/register.html')
.get(function(req, res, next){
	res.render('passport/register');
})
.post(function(req, res, next){
	res.send('register ok!');
})

//登录
app.route('/login.html')
.get(function(req, res, next){
	res.render('passport/login', {
		isOnLine: false
	});
})
.post(function(req, res, next){
	res.send('login ok!');
})

app.get('/logout', function(req, res) {
	
})

//首页
app.get(['/', '/index.html'], function(req, res, next){
	let rs = fs.createReadStream(__dirname + '/data/articles.json'),
		fileData = '';
	rs.on('data', function(data) {
		fileData += data;
	})
	rs.on('end', function() {
		let jsonFileData = JSON.parse(fileData);
		res.render('index/index', {
			result: jsonFileData.result
		});
	})
})
















//错误处理
app.use(function(err, req, res, next){
	// res.end(err.message);
	next(err);
})


app.listen(3000, function(){
	console.log('server is starting')
})