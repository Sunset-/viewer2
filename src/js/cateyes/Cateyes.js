/**
 *  猫瞳医学影像浏览工具
 *
 *  Version : 0.1
 *
 *  author : fanll
 *
 *  createTime : 2015-07-20
 *
 *  updateTime : 2015-07-20
 *
 */

(function (window, undefined) {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 *  
	 */
	(function () {
		function getQueryString(name) {
			var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
			var r = window.location.search.substr(1).match(reg);
			if (r != null) return unescape(r[2]);
			return null;
		}
		Cateyes.getQueryString = getQueryString;
		var which = getQueryString('which');
		Cateyes.IMAGE_RESOUCE_PREFIX = "/upload/api/1.0.0/file/acquisition/";
	})();


	/**
	 * 唯一ID生成器
	 */
	Cateyes.UniqueID = (function () {
		var index = 1;
		return function () {
			return index++;
		}
	})();


	Cateyes.TimeID = function () {
		return new Date().getTime();
	};

	/**
	 * 类帮助
	 * 
	 */
	Cateyes.ClassHelper = {
		/**
		 * 继承
		 * @param  {function} C [子类]
		 * @param  {function} P [父类]
		 * @param  {object} ext [扩展]
		 * @return {undifined}    无
		 */
		extend: (function () {
			var F = function () {};
			return function (P, C, ext) {
				F.prototype = P.prototype;
				var cp = C.prototype = new F();
				cp.__super = P.prototype; //添加父类原型引用
				if (ext) {
					for (var k in ext) {
						if (ext.hasOwnProperty(k)) {
							cp[k] = ext[k];
						}
					}
				}
				C.prototype.constructor = C;
				return C;
			}
		})()
	};

	/**
	 * 函数帮助
	 */
	Cateyes.Function = {
		/**
		 * 函数节流
		 * @param  {[type]} viewer [description]
		 * @return {[type]}        [description]
		 */
		throttle: function (func, time) {
			var timer = null;
			return function () {
				if (timer) {
					//节流
					clearTimeout(timer);
				}
				var self = this,
					args = [].slice.call(arguments);
				timer = setTimeout(function () {
					func.apply(self, args);
					timer = null;
				}, time);
			};
		},
		/**
		 * AOP after
		 * @param  {[type]} viewer [description]
		 * @return {[type]}        [description]
		 */
		after: function (func, aop) {
			return function () {
				var self = this,
					args = [].slice(arguments);
				var res = func.apply(self, args);
				aop.apply(self, args);
				return res;
			}
		}
	}

	Cateyes.namespace = function (nsStr, obj) {
		if (nsStr && nsStr.length) {
			var p = Cateyes,
				ns = nsStr.split(".");
			if (ns[0] == 'Cateyes') {
				ns.shift();
			}
			if (ns.length) {
				var n;
				while (ns.length > 1) {
					n = ns.shift();
					p = (p[n] = p[n] || {});
				}
				p[ns.shift()] = obj;
			}
			return obj;
		}
	};

	/**
	 * 事件订阅发布
	 * 
	 */
	var PubSub = Cateyes.PubSub = function (context) {
		this.context = context;
		this.callbacks = {};
	}
	PubSub.prototype = {
		/**
		 * 获取回调集合
		 */
		_getCallbacks: function () {
			return this.callbacks || (this.callbacks = {});
		},
		/**
		 * 注册事件
		 * @param  {[type]}   ev       事件名称
		 * @param  {Function} callback 回调
		 * @return {[type]}            [description]
		 */
		subscribe: function (ev, callback) {
			var callbacks = this._getCallbacks();
			if (typeof callback == "function") {
				(callbacks[ev] || (callbacks[ev] = [])).push(callback);
			} else if (Object.prototype.toString.call(callback) === '[object Array]') {
				var singleCb;
				for (var i = 0, l = callback.length; i < l; i++) {
					if (typeof (singleCb = callback[i]) == "function") {
						(callbacks[ev] || (callbacks[ev] = [])).push(singleCb);
					}
				}
			}
		},
		/**
		 * 发布事件
		 * @return {[type]} [description]
		 */
		publish: function () {
			var callbacks = this._getCallbacks();
			var args = Array.prototype.slice.call(arguments, 0),
				ev = args.shift(),
				calls = callbacks[ev];
			if (ev && calls) {
				var l;
				if ((l = calls.length) == 1) {
					return calls[0].apply(this.context, args);
				} else {
					for (var i = 0; i < l; i++) {
						calls[i].apply(this.context, args);
					}
				}
			}
		},
		/**
		 * 发布事件
		 * @return {[type]} [description]
		 */
		publishAsync: function () {
			var callbacks = this._getCallbacks();
			var args = Array.prototype.slice.call(arguments, 0),
				ev = args.shift(),
				calls = callbacks[ev],
				self = this;
			if (ev && calls) {
				var l;
				if ((l = calls.length) == 1) {
					setTimeout(function () {
						calls[0].apply(self.context, args);
					});
				} else {
					for (var i = 0; i < l; i++) {
						(function (i) {
							setTimeout(function () {
								calls[i].apply(self.context, args);
							});
						})(i);
					}
				}
			}
		},
		/**
		 * 取消订阅
		 * @param  {[type]}   ev       事件名称
		 * @param  {Function} callback 回调函数
		 * @return {[type]}            [description]
		 */
		unsubscribe: function (ev, callback) {
			var callbacks = this._getCallbacks();
			var cbs;
			if (cbs = callbacks[ev]) {
				if (callback) {
					for (var i = 0, l = cbs.length; i < l; i++) {
						if (cbs[i] === callback) {
							cbs.slice(i);
						}
					}
				} else {
					callbacks[ev] = null;
				}
			}
		},
		/**
		 * 注册事件集合
		 * @param  {[type]} events [description]
		 * @return {[type]}        [description]
		 */
		regist: function (events) {
			if (events) {
				for (var ev in events) {
					if (events.hasOwnProperty(ev)) {
						this.subscribe(ev, events[ev]);
					}
				}
			}
			return this;
		}
	};

	Cateyes.GlobalPubSub = new PubSub();

	/**
	 * 基础工具
	 */
	Cateyes.Utils = {
		nativeToString: Object.prototype.toString,
		isObject: function (obj) {
			return (this.nativeToString.call(obj) == "[object Object]");
		},
		isUndefined: function (val) {
			return (typeof (val) == "undefined");
		},
		isArray: function (obj) {
			return (this.nativeToString.call(obj) == "[object Array]");
		},
		isObjectOrArray: function (src) {
			return this.isObject(src) || this.isArray(src);
		},
		isNumber: function (num) {
			return !isNaN(num);
		},
		isEmpty: function (v, allowBlank) {
			return v === null || v === undefined || ((Ext.isArray(v) && !v.length)) || (!allowBlank ? v === '' : false);
		},
		isDate: function (v) {
			return this.nativeToString.apply(v) === '[object Date]';
		},
		isPrimitive: function (v) {
			return Ext.isString(v) || Ext.isNumber(v) || Ext.isBoolean(v);
		},
		isFunction: function (v) {
			return this.nativeToString.apply(v) === '[object Function]';
		},
		isNumber: function (v) {
			return typeof v === 'number' && isFinite(v);
		},
		isString: function (v) {
			return typeof v === 'string';
		},
		isBoolean: function (v) {
			return typeof v === 'boolean';
		},
		isElement: function (v) {
			return !!v && v.tagName;
		},
		isDefined: function (v) {
			return typeof v !== 'undefined';
		},
		formatDate: function (date, fmt) {
			date = +date;
			var reg = {
				'yyyy': 'getFullYear',
				'MM': 'getMonth',
				'dd': 'getDate',
				'HH': 'getHours',
				'mm': 'getMinutes',
				'ss': 'getSeconds'
			};
			fmt = fmt || 'yyyy-MM-dd HH:mm:ss';
			if (!isNaN(date)) {
				var d = new Date(date);
				for (var k in reg) {
					var v;
					if (reg.hasOwnProperty(k)) {
						v = d[reg[k]]();
						if (k == 'MM') {
							v++;
						}
						if (k != 'yyyy' && v < 10) {
							v = '0' + v;
						}
						fmt = fmt.replace(k, v);
					}
				}
				return fmt;
			} else {
				return '';
			}
		},
		range(number, min, max) {
			return Math.min(max, Math.max(number, min));
		},
		max() {
			var args = arguments;
			if (args.length == 1) {
				return args[0];
			} else if (args.length > 1) {
				var max = args[0];
				for (var i = 1, l = args.length; i < l; i++) {
					max = Math.max(args[i], max);
				}
				return max;
			}
		},
		min() {
			var args = arguments;
			if (args.length == 1) {
				return args[0];
			} else if (args.length > 1) {
				var min = args[0];
				for (var i = 1, l = args.length; i < l; i++) {
					min = Math.min(args[i], min);
				}
				return min;
			}
		},
		/**
		 * 遍历
		 */
		each: function (obj, callback) {
			if (this.isArray(obj)) {
				for (var i = 0, l = obj.length; i < l; i++) {
					callback(obj[i], i);
				}
			} else if (this.isObject(obj)) {
				for (var k in obj) {
					if (obj["hasOwnProperty"](k)) {
						callback(obj[k], k);
					}
				}
			}
		},
		/**
		 * 过滤
		 */
		filter: function (obj, filter) {
			var result = [];
			if (this.isArray(obj)) {
				for (var i = 0, l = obj.length; i < l; i++) {
					filter(i, obj[i]) && result.push(obj[i]);
				}
			} else if (this.isObject(obj)) {
				for (var k in obj) {
					if (obj["hasOwnProperty"](k)) {
						filter(k, obj[k]) && result.push(obj[k]);
					}
				}
			}
			return result;
		},
		/**
		 * 过滤初一个满足条件者
		 */
		filterOne: function (obj, filter) {
			if (this.isArray(obj)) {
				for (var i = 0, l = obj.length; i < l; i++) {
					if (filter(i, obj[i])) {
						return obj[i];
					}
				}
			} else if (this.isObject(obj)) {
				for (var k in obj) {
					if (obj["hasOwnProperty"](k)) {
						if (filter(k, obj[k])) {
							return obj[k];
						}
					}
				}
			}
			return null;
		},
		/**
		 * 存在满足条件
		 * @param  {[type]}   items [description]
		 * @param  {Function} cb    [description]
		 * @return {[type]}         [description]
		 */
		some: function (items, cb) {
			if (!items || items.length == 0) {
				return null;
			}
			if (typeof cb != 'function') {
				throw new Error('filter arguments[1] is not a function');
			}
			for (var i = 0, l = items.length; i < l; i++) {
				if (cb(items[i], i)) {
					return true;
				}
			}
			return false;
		},
		/**
		 * 拷贝(默认为浅拷贝)
		 */
		copy: function (src, isDeep) {
			if (!this.isObjectOrArray(src)) {
				return src;
			}
			var result = null;
			if (isDeep) {
				// 深拷贝
				if (this.isObject(src)) {
					result = {};
					for (var k in src) {
						if (src["hasOwnProperty"](k)) {
							if (this.isObjectOrArray(src[k])) {
								result[k] = this.copy(src[k]);
							} else {
								result[k] = src[k];
							}
						}
					}
				} else if (this.isArray(src)) {
					result = [];
					for (var i = 0, l = src.length; i < l; i++) {
						if (this.isObjectOrArray(src[i])) {
							result[i] = this.copy(src[i]);
						} else {
							result[i] = src[i];
						}
					}
				}
			} else {
				// 浅拷贝
				if (this.isObject(src)) {
					result = {};
					for (var k in src) {
						if (src["hasOwnProperty"](k)) {
							result[k] = src[k];
						}
					}
				} else if (this.isArray(src)) {
					result = [];
					for (var i = 0, l = src.length; i < l; i++) {
						result[i] = src[i];
					}
				}
			}
			return result;
		},
		/**
		 * 获取命名空间下属性
		 * @param  {[type]} parent    [description]
		 * @param  {[type]} namespace [description]
		 * @return {[type]}           [description]
		 */
		getAttribute: function (parent, namespace) {
			if (parent && namespace) {
				var ns = namespace.split(".");
				var obj = parent,
					child;
				for (var i = 0, l = ns.length; i < l; i++) {
					child = obj[ns[i]];
					if (this.isFunction(child)) {
						obj = child.call(obj);
					} else {
						obj = child;
					}
					if (obj == null || obj == void 0) {
						return obj;
					}
				}
				return obj;
			}
			return parent;
		},
		/**
		 * 设置命名空间下的属性
		 * @param {[type]} parent    [description]
		 * @param {[type]} namespace [description]
		 * @param {[type]} value     [description]
		 */
		setAttribute: function (parent, namespace, value) {
			var lio,
				obj = parent;
			if (lio = namespace.lastIndexOf(".")) {
				var ns = namespace.split("."),
					obj = parent,
					attrName = namespace.substring(lio + 1);
				for (var i = 0, l = ns.length - 1; i < l; i++) {
					if (obj[ns[i]] == null || obj[ns[i]] === void 0) {
						obj[ns[i]] = {};
					}
					obj = obj[ns[i]];
				}
				obj[attrName] = value;
			} else {
				obj[namespace] = value;
			}
		},
		/**
		 * 根据className获取节点 （用于扩大事件响应范围）
		 */
		getElByClass: function (tgt, className) {
			var $result = null,
				$temp;
			if (tgt.className.indexOf(className) >= 0) {
				$result = $(tgt);
			} else if (($temp = $(tgt).parents("." + className)).length) {
				$result = $temp;
			}
			return $result;
		}
	};



	/*
	 *
	 * 数学工具类
	 *
	 */
	Cateyes.MathUtils = {
		/**
		 * 计算两点间距离
		 */
		getDistance: function (sx, sy, ex, ey) {
			var w = ex - sx,
				h = ey - sy;
			return this.measureHypotenuse(w, h);
		},
		/**
		 * 计算直角三角形斜边
		 */
		measureHypotenuse: function (l1, l2) {
			return Math["sqrt"](l1 * l1 + l2 * l2);
		},
		/**
		 * 计算三点所成角度 s : 第一边上的点 e : 第二边上的点 p : 顶点
		 */
		getAngle: function (sx, sy, ex, ey, px, py) {
			var ps = [sx - px, sy - py];
			var pe = [ex - px, ey - py];
			var pJ = ps[0] * pe[0] + ps[1] * pe[1];
			var cosAngle = pJ / ((Math["sqrt"](ps[0] * ps[0] + ps[1] * ps[1])) * (Math
				.sqrt(pe[0] * pe[0] + pe[1] * pe[1])));
			return (Math["acos"](cosAngle) / 2 / Math["PI"] * 360);
		},
		/**
		 * 判断值是否在两值之间
		 */
		isBetween: function (testVal, val_1, val_2) {
			return ((testVal >= val_1 && testVal <= val_2) || (testVal >= val_2 && testVal <= val_1));
		},
		/**
		 * 点到直线距离
		 */
		verticalLineLength: function (px, py, x1, y1, x2, y2) {
			return Math.abs((py - y1) * (x2 - x1) - (px - x1) * (y2 - y1)) / Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
		},
		/**
		 * 计算一组数据最大值，最小值，平均值，标准差
		 */
		measureMeanAndSD: function (array) {
			var min = array[0],
				max = array[0],
				sum = 0,
				mean, sd, count = array.length,
				i, temp;
			for (i = 0; i < count; i++) {
				temp = array[i];
				min = Math["min"](min, temp);
				max = Math["max"](max, temp);
				sum += temp;
			}
			mean = (sum * 1.0 / count).toFixed(1);
			// 计算标准差
			sum = 0;
			for (i = 0; i < count; i++) {
				temp = array[i];
				sum += Math["pow"]((temp - mean), 2);
			}
			sd = Math["sqrt"](sum / count).toFixed(1);
			return {
				min: min,
				max: max,
				mean: mean,
				sd: sd,
				count: count
			};
		},
		/**
		 * 计算面积 sideLength:单元边长(毫米) count:单元个数
		 */
		measureArea: function (singlePixelArea, count) {
			var result;
			result = singlePixelArea * count;
			if (result > 1000000) {
				result = (result / 1000000.0).toFixed(2) + "m²";
			} else if (result > 100) {
				result = (result / 100.0).toFixed(2) + "cm²";
			} else {
				result = result.toFixed(2) + "mm²";
			}
			return result;
		}
	};

	/*******************************************LOADING****************************************************/
	(function () {
		var LOADING_HTML = '<div class="cateyes-loading-container"><div class="cateyes-loading-bg"></div><div class="cateyes-loading-msg"></div></div>';
		Cateyes.loading = function (msg, $parent) {
			var $el = $('.cateyes-loading-container');
			$parent = $parent || $('body');
			if (msg === false) {
				$el && $el.hide();
				return;
			}
			if (!$el.length) {
				$el = $(LOADING_HTML)
			}
			$('.cateyes-loading-msg', $el.appendTo($parent).show()).html(msg);
		}
	})();


	/*******************************************获取平台****************************************************/
	(function () {
		var browser = {
			versions: function () {
				var u = navigator.userAgent,
					app = navigator.appVersion;
				return { //移动终端浏览器版本信息   
					trident: u.indexOf('Trident') > -1, //IE内核  
					presto: u.indexOf('Presto') > -1, //opera内核  
					webKit: u.indexOf('AppleWebKit') > -1, //苹果、谷歌内核  
					gecko: u.indexOf('Gecko') > -1 && u.indexOf('KHTML') == -1, //火狐内核  
					mobile: !!u.match(/AppleWebKit.*Mobile.*/), //是否为移动终端  
					ios: !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/), //ios终端  
					android: u.indexOf('Android') > -1 || u.indexOf('Linux') > -1, //android终端或者uc浏览器  
					iPhone: u.indexOf('iPhone') > -1, //是否为iPhone或者QQHD浏览器  
					iPad: u.indexOf('iPad') > -1, //是否iPad    
					webApp: u.indexOf('Safari') == -1 //是否web应该程序，没有头部与底部  
				};
			}(),
			language: (navigator.browserLanguage || navigator.language).toLowerCase()
		};
		var Events = {
			PC: {
				MOUSE_DOWN: "mousedown touchstart",
				MOUSE_MOVE: "mousemove touchmove",
				MOUSE_UP: "mouseup touchend",
				MOUSE_ENTER: "mouseenter touchstart",
				MOUSE_LEAVE: "mouseleave",
				CLICK: "click"
			},
			PAD: {
				MOUSE_DOWN: "touchstart",
				MOUSE_MOVE: "touchmove",
				MOUSE_UP: "touchend",
				MOUSE_ENTER: "touchstart",
				MOUSE_LEAVE: "",
				CLICK: "touchstart"
			},
			PHONE: {
				MOUSE_DOWN: "touchstart",
				MOUSE_MOVE: "touchmove",
				MOUSE_UP: "touchend",
				MOUSE_ENTER: "touchstart",
				MOUSE_LEAVE: "",
				CLICK: "touchstart"
			}
		}

		var platform = 'PC';
		if (browser.versions.mobile || browser.versions.ios || browser.versions.android ||
			browser.versions.iPhone || browser.versions.iPad) {
			platform = "PHONE";
		}
		Cateyes.EVENTS = Events[platform];

		Cateyes.isPlat = function (plat) {
			return plat == platform;
		};
		Cateyes.getPlat = function () {
			return platform;
		}
		Cateyes.isPad = function (plat) {
			return browser.versions.iPad;
		};
	})();

	/**********************  业务事件  **********************/
	Cateyes.CustomEvents = {
		//阅片器状态变化
		'AFTER_VIEWER_STATUS_CHANGE': 'AFTER_VIEWER_STATUS_CHANGE',
		//DICOM加载完成
		'AFTER_DICOM_LOADED': 'AFTER_DICOM_LOADED',
		//阅片器激活
		'ON_VIEWER_ACTIVE': 'ON_VIEWER_ACTIVE',
		//阅片器绑定序列后
		'AFTER_BIND_SERIES': 'AFTER_BIND_SERIES',
		//定位器变化
		'ON_DICOM_CANVAS_RESIZE': 'ON_DICOM_CANVAS_RESIZE',
		//影像浏览切换后
		'AFTER_BROWSE_DICOM': 'AFTER_BROWSE_DICOM',
		//影像浏览切换后
		'AFTER_BROWSE_DICOM_SILIENT': 'AFTER_BROWSE_DICOM_SILIENT',
		//图像渲染前
		'BEFORE_RENDER_DICOM': 'BEFORE_RENDER_DICOM',
		//图像渲染后
		'AFTER_RENDER_DICOM': 'AFTER_RENDER_DICOM',
		'AFTER_TINT_DICOM': 'AFTER_TINT_DICOM',
		//阅片器缓冲
		'VIEWER_LOADING': 'VIEWER_LOADING',
		//暂停/播放切换后
		'AFTER_PLAY_OR_STOP': 'AFTER_PLAY_OR_STOP',
		//位置变化
		'POSITION': 'POSITION',
		//绘制定位线
		'DRAW_POSITIONLINE': 'DRAW_POSITIONLINE',
		//MPR重建
		'AFTER_MPR_REBUILD': 'AFTER_MPR_REBUILD',
		//标注变化
		'AFTER_MARK_CHANGE': 'AFTER_MARK_CHANGE',
		//单个标注变化
		'AFTER_SINGLE_MARK_CHANGE': 'AFTER_SINGLE_MARK_CHANGE',
		//刷新标注标签
		'REFRESH_MARK_TAG': 'REFRESH_MARK_TAG',
		//窗宽窗位变化
		'ON_VIEWER_WINDOW_CHANGE': 'ON_VIEWER_WINDOW_CHANGE'
	};


	/**********************  原生增强  **********************/
	/**
	 * 全替换
	 * @param  {[type]} reallyDo    [description]
	 * @param  {[type]} replaceWith [description]
	 * @param  {[type]} ignoreCase  [description]
	 * @return {[type]}             [description]
	 */
	String.prototype.replaceAll = function (reallyDo, replaceWith, ignoreCase) {
		if (!RegExp.prototype.isPrototypeOf(reallyDo)) {
			return this.replace(new RegExp(reallyDo, (ignoreCase ? "gi" : "g")), replaceWith);
		} else {
			return this.replace(reallyDo, replaceWith);
		}
	};

	/**
	 * 日期转换
	 * @param  {[type]} reallyDo    [description]
	 * @param  {[type]} replaceWith [description]
	 * @param  {[type]} ignoreCase  [description]
	 * @return {[type]}             [description]
	 */
	(function () {
		var reg = {
			'yyyy': 'getFullYear',
			'MM': 'getMonth',
			'dd': 'getDate',
			'HH': 'getHours',
			'mm': 'getMinutes',
			'ss': 'getSeconds'
		};

		Date.prototype.format = function (fmt) {
			var date = this;
			if (!isNaN(date)) {
				var d = new Date(date);
				for (var k in reg) {
					var v;
					if (reg.hasOwnProperty(k)) {
						v = d[reg[k]]();
						if (k == 'MM') {
							v++;
						}
						if (k != 'yyyy' && v < 10) {
							v = '0' + v;
						}
						fmt = fmt.replace(k, v);
					}
				}
				return fmt;
			} else {
				return '';
			}
		}
	})();

	var LOADING_HTML = '<div class="sunset-global-loader loader"><div class="loader-inner ball-spin-fade-loader"><div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div></div></div>'

	Cateyes.loading = function (hide) {
		var $loading = $('.sunset-global-loader');
		if (hide === false) {
			$loading.hide();
		} else {
			if ($loading.length == 0) {
				$loading = $(LOADING_HTML).appendTo($('body'));
			}
			$loading.show();
		}
	}

})(window);