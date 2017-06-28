let express = require('express');
let path = require('path');
let favicon = require('serve-favicon');
let logger = require('morgan');
let cookieParser = require('cookie-parser');
let bodyParser = require('body-parser');

let util = require('./routes/util');
//首页
let index = require('./routes/index');
//通行证相关代码（登录，登出，注册）
let passport = require('./routes/passport');
//账号相关（修改密码、修改个人信息）
let account = require('./routes/account');
//我的博客，发布，博客详情
let blog = require('./routes/blog');
let db = require('./routes/db');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 设置图标
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));

//解析请求体到req.body字段中（https://github.com/expressjs/body-parser）
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

//规范设置及获取cookie方式（https://github.com/expressjs/cookie-parser）
app.use(cookieParser());

//基于cookie-parser的会话设置（https://github.com/expressjs/cookie-session）
let cookieSession = require('cookie-session');

app.use(express.static(path.join(__dirname, 'public')));

app.set('trust proxy', 1) // trust first proxy
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2']
}))

//注入全局变量
app.use(function(req, res, next){
	let user = req.session.user;
	if(user && !user.picture){
		user.picture = util.config.defaultPic;
	}
	app.locals.session = req.session;
	next();
})

app.use(index);
app.use('/passport', passport);
app.use('/account', account);
app.use('/blog', blog);
app.use(db);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
