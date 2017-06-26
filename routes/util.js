//文件处理（node内置）
let fs = require('fs');
function Util(){
	this.config = {
		defaultPic: '/upload-sources/i/default-head.jpg'
	}
}
Util.prototype = {
	/**
	 * [readFile 读取特定格式文件内容并json化]
	 * @param  {[type]}   fileName [文件名]
	 * @param  {Function} callback [回调]
	 */
	readFileSync: function(fileName, callback){
		let fullUrl = process.cwd() + '/database/' + fileName;
		let fileText = fs.readFileSync(fullUrl, 'utf-8');

		fileText = fileText || '{}';
		let jsonFileData = JSON.parse(fileText);
		jsonFileData.result = jsonFileData.result || [];
		jsonFileData.totalCount = jsonFileData.totalCount || 0;
		typeof callback === 'function' && callback(jsonFileData, fullUrl);
	},
	/**
	 * [factoryId 生成虚拟id的工厂]
	 * @return {[type]} [description]
	 */
	createFactoryId: function (){
		return '' + parseInt(Math.random()*Math.pow(10, 4)) + parseInt(Math.random()*Math.pow(10, 4))
	}
}

module.exports = new Util();
