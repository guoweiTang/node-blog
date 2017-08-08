function Util(){
	this.config = {
		defaultPic: '/upload-sources/i/default-head.jpg'
	}
}
Util.prototype = {
	/**
	 * [factoryId 生成虚拟id的工厂]
	 * @return {[type]} [description]
	 */
	createFactoryId: function (){
		return '' + parseInt(Math.random()*Math.pow(10, 4)) + parseInt(Math.random()*Math.pow(10, 4))
	}
}

module.exports = new Util();
