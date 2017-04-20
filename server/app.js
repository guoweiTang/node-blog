/**
 * 
 * @authors Your Name (you@example.org)
 * @date    2017-04-11 17:43:03
 * @version $Id$
 */
let express = require('express'),
	bodyParser = require('body-parser'),
	controller = require('./controller');

let app = express();

app.set('views', process.cwd() + '/webapp');
app.set('view engine', 'ejs');

//扩展
app.use(bodyParser.urlencoded({extended: false}), bodyParser.raw())
app.use(express.static('webapp'))

//监听url
// app.use(controller());

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
	res.render('passport/login');
})
.post(function(req, res, next){
	res.send('login ok!');
})

//首页
app.get(['/', '/index.html'], function(req, res, next){
	res.render('passport/login');
})
















//错误处理
app.use(function(err, req, res, next){
	// res.end(err.message);
	next(err);
})


app.listen(3000, function(){
	console.log('server is starting')
})