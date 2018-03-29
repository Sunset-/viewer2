module.exports = {

	/**
	 * 单例
	 * @param {[type]} target [description]
	 */
	Singleton: function(target) {
		let instance,
			clazz = function() {
				var args = [].slice.call(arguments);
				if (instance) {
					return instance;
				} else {
					this.__proto__ = target.prototype;
					target.prototype.constructor.apply(this, args);
					return instance = this;
				}
			}
		clazz.prototype = target.prototype;
		return clazz;
	}

};