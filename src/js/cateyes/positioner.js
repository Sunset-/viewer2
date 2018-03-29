/**
 * 定位器
 *
 * author : fanll 
 *
 * createTime : 2015-07-20
 * 
 * @return {[type]} [description]
 */
(function () {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	var Positioner = Cateyes.Positioner = function (viewer) {
		this.viewer = viewer;
		this.init();
	};

	Positioner.prototype = {
		/**
		 * 初始化
		 * @return {[type]} [description]
		 */
		init: function () {
			this.state = {
				x: 0,
				y: 0,
				scale: 1,
				horizontal: 1,
				vertical: 1,
				rotate: 0,
				mpring: false
			};
			this.initEvents();
		},
		initEvents: function () {
			var self = this;
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function (series) {
				self.reset();
			});
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, function (dicom) {
				self.refreshCanvasSize();
			});
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_MPR_REBUILD, function (params) {
				self.calculateMprSize(params);
			});
		},
		/**
		 * 重置
		 * @return {[type]} [description]
		 */
		reset: function () {
			//1.重置state
			this.state = $.extend(this.state, {
				x: 0,
				y: 0,
				scale: 1,
				horizontal: 1,
				vertical: 1,
				rotate: 0
			});
			//2.调整canvas尺寸
			this.refreshCanvasSize();
			//3.居中
			this.center();
		},
		/**
		 * 刷新canvas尺寸
		 * @return {[type]} [description]
		 */
		refreshCanvasSize: function () {
			var viewer = this.viewer,
				dicom = this.viewer.getPlayer().getCurrentDicom();
			if (dicom) {
				dicom.then(() => {
					var dicomCanvas = this.viewer.getCanvas('DICOM');
					var change = false;
					if (dicomCanvas.width != dicom.info.width || dicomCanvas.height != dicom.info.height) {
						change = true;
					}
					dicomCanvas.width = dicom.info.width;
					dicomCanvas.height = dicom.info.height;
					change && this.center();
				});
			}
		},
		/**
		 * 居中
		 * @return {[type]} [description]
		 */
		center: function () {
			var state = this.state,
				$container = this.viewer.getContainer(),
				containerWidth = $container.width(),
				containerHeight = $container.height(),
				cvs = this.viewer.getCanvas('DICOM'),
				width = cvs.width,
				height = cvs.height;
			cvs._center();
			state.x = 0;
			state.y = 0;
			// state.x = (containerWidth - width) / 2; // 中央显示
			// state.y = (containerHeight - height) / 2;
			var scaleX = containerWidth / width,
				scaleY = containerHeight / height;
			// 放缩比例
			if (scaleX < scaleY) {
				state.scale = scaleX;
				state._scaleReferTo = 'X';
			} else {
				state.scale = scaleY;
				state._scaleReferTo = 'Y';
			}
			this.refresh();
		},
		/**
		 * 刷新位置
		 * @param  {[type]} state [description]
		 * @return {[type]}       [description]
		 */
		refresh: function (state, silent) {
			if (state) {
				$.extend(this.state, state);
			}
			this._offset();
			this._refresh();
			silent || this.viewer.publish('POSITION', this.state);
			silent || this.synchronizeCloud();
		},
		_offset: function () {
			var state = this.state,
				_ = state._;
			if (Cateyes.Utils.isDefined(_)) {
				for (var k in _) {
					state[k] = eval(state[k] + _[k]);
				}
				delete state._;
			}
			if (state.scale <= 0) {
				state.scale = 0.01;
			}
			if (isNaN(state.x)) {
				state.x = 0;
			}
			if (isNaN(state.y)) {
				state.y = 0;
			}
		},
		/**
		 * 刷新样式
		 * @return {[type]} [description]
		 */
		_refresh: function () {
			var state = this.state,
				viewer = this.viewer,
				cvs = viewer.getCanvas('DICOM'),
				stl = cvs.style,
				buff = [];
			buff.push("translate(");
			buff.push(state.x);
			buff.push("px,");
			buff.push(state.y);
			buff.push("px) ");
			buff.push("scale(");
			buff.push(state.scale * state.horizontal);
			buff.push(",");
			buff.push(state.scale * state.vertical);
			buff.push(") rotate(");
			buff.push(state.rotate * state.horizontal * state.vertical);
			buff.push("deg)");
			buff = buff.join("");
			// 兼容各浏览器
			stl.transform = buff;
			stl.oTransform = buff;
			stl.msTransform = buff;
			stl.mozTransform = buff;
			stl.webkitTransform = buff;
			//this.viewer.publishAsync(Cateyes.CustomEvents.AFTER_RENDER_DICOM);
			this.viewer.publishAsync(Cateyes.CustomEvents.ON_DICOM_CANVAS_RESIZE);
		},
		getState: function () {
			return this.state;
		},
		/**
		 * 获取鼠标在操作画布上的相对位置(停用)
		 */
		____getMouseXYofCanvas: function (x, y, isInArea) {
			var canvas = this.viewer.getCanvas('DICOM'),
				offset = canvas.$el.offset(),
				state = this.state,
				scale = state.scale,
				horizontal = state.horizontal,
				vertical = state.vertical,
				rotate = state.rotate,
				height = canvas.height,
				width = canvas.width;
			var result = {
				x: Math["floor"]((x - offset.left) / scale),
				y: Math["floor"]((y - offset.top) / scale),
				width: width,
				height: height
			};
			canvas.$el.css('border', '1px solid #09c')
			// 旋转/翻转坐标修正
			if (horizontal < 0) {
				result.x = width - result.x;
			}
			if (vertical < 0) {
				result.y = height - result.y;
			}
			rotate %= 360;
			if (rotate < 0) {
				rotate += 360;
			}
			//计算出左上角位置
			if (rotate == 90) {
				result.y = height - x;
				result.x = y;
			} else if (rotate == 180) {
				result.x = width - x;
				result.y = height - y;
			} else if (rotate == 270) {
				result.y = x;
				result.x = width - y;
			}
			if (isInArea === true) {
				//出界返回null
				if (result.x > result.width || result.x < 0 || result.y > result.height || result.y < 0) {
					return null;
				}
			} else if (isInArea === false) {
				//出界返回边界值
				result.x = result.x > result.width ? result.width : (result.x < 0 ? 0 : result.x);
				result.y = result.y > result.height ? result.height : (result.y < 0 ? 0 : result.y);
			}
			return result;
		},
		/**
		 * 获取鼠标在操作画布上的相对位置
		 */
		getMouseXYofCanvas: function (x, y, isInArea) {
			var canvas = this.viewer.getCanvas('DICOM'),
				offset = canvas.$el.offset(),
				state = this.state,
				scale = state.scale,
				horizontal = state.horizontal,
				vertical = state.vertical,
				rotate = state.rotate,
				height = canvas.height,
				width = canvas.width;
			var result = {
				width: width,
				height: height
			};
			// 旋转/翻转坐标修正
			// var x = result.x,
			// 	y = result.y;
			rotate %= 360;
			if (rotate < 0) {
				rotate += 360;
			}
			var cvsX, cvsY;
			if (rotate < 90) {
				cvsX = offset.left + width * scale * Math.sin(Math.PI / 180 * rotate);
				cvsY = offset.top;
			} else if (rotate >= 90 && rotate < 180) {
				var hypotenuse = Math.sqrt(width * width + height * height);
				cvsX = offset.left + hypotenuse * scale * Math.sin(Math.PI / 180 * (Math.atan(width / height) / (Math.PI / 180) + rotate - 90));
				cvsY = offset.top + height * scale * Math.sin(Math.PI / 180 * (rotate - 90));
			} else if (rotate >= 180 && rotate < 270) {
				var hypotenuse = Math.sqrt(width * width + height * height);
				cvsX = offset.left + width * scale * Math.cos(Math.PI / 180 * (rotate - 180));
				cvsY = offset.top + hypotenuse * scale * Math.sin(Math.PI / 180 * (Math.atan(height / width) / (Math.PI / 180) + rotate - 180));
			} else {
				cvsX = offset.left;
				cvsY = offset.top + width * scale * Math.cos(Math.PI / 180 * (rotate - 270));
			}
			//旋转向量
			var vX = x - cvsX,
				vY = y - cvsY;
			var sink = Math.sin(Math.PI / 180 * (-rotate)),
				cosk = Math.cos(Math.PI / 180 * (-rotate));
			result.x = 0 + (vX - 0) * cosk - (vY - 0) * sink;
			result.y = 0 + (vX - 0) * sink + (vY - 0) * cosk;
			//比例恢复
			result.x = Math["floor"](result.x / scale);
			result.y = Math["floor"](result.y / scale);

			// 旋转/翻转坐标修正
			result.x /= Math.abs(horizontal);
			result.y /= Math.abs(vertical);
			if (horizontal < 0) {
				result.x = width - result.x;
			}
			if (vertical < 0) {
				result.y = height - result.y;
			}
			if (isInArea === true) {
				//出界返回null
				if (result.x > result.width || result.x < 0 || result.y > result.height || result.y < 0) {
					return null;
				}
			} else if (isInArea === false) {
				//出界返回边界值
				result.x = result.x > result.width ? result.width : (result.x < 0 ? 0 : result.x);
				result.y = result.y > result.height ? result.height : (result.y < 0 ? 0 : result.y);
			}
			return result;
		},
		/**
		 * 获取canvas在$container中的位置
		 */
		getDicomCanvasPosition: function () {
			var cvs = this.viewer.getCanvas(),
				$cvs = cvs.$el,
				$container = this.viewer.getContainer(),
				cvsOffset = $cvs.offset(),
				containerOffset = $container.offset(),
				state = this.state;
			var ow = $cvs.width(),
				oh = $cvs.height();
			var w = Math.abs(ow * state.scale * state.horizontal),
				h = Math.abs(oh * state.scale * state.vertical);
			return $.extend({}, this.state, {
				top: state.y, //cvsOffset.top - containerOffset.top,
				left: state.x, //cvsOffset.left - containerOffset.left,
				width: w,
				height: h
			});
		},
		/**
		 * 计算MPR后的尺寸
		 */
		calculateMprSize: function (params) {
			var orientation = params.orientation,
				originalOrientation = params.originalOrientation,
				series = this.viewer.getSeries(),
				horizontal = this.state.horizontal,
				vertical = this.state.vertical;
			horizontal /= Math.abs(horizontal);
			vertical /= Math.abs(vertical);
			if (orientation != originalOrientation) {
				if (originalOrientation == 'AXIAL') {
					vertical = vertical * series.info.sizeTransform;
				} else {
					if (orientation == 'AXIAL') {
						vertical = vertical * series.info.sizeTransform;
					} else {
						horizontal = horizontal * series.info.sizeTransform;
					}
				}
			}
			this.state.horizontal = horizontal;
			this.state.vertical = vertical;
			this._refresh();
		},
		/**
		 * 云同步
		 * @return {[type]} [description]
		 */
		synchronizeCloud: function () {
			if (Cateyes.CatCloud.isOnline()) {
				Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_SEND_MESSAGE, this.getJson());
			}
		},
		getJson: function () {
			var json = {};
			this.calculateProportion();
			json['VIEWER_' + this.viewer.getViewerId() + '|positioner'] = JSON.stringify(this.state);
			return json;
		},
		setJson: function (json) {
			var params = JSON.parse(json);
			this.useProportion(params);
			this.refresh(params, true);
		},
		/**
		 * 获取canvas相对容器位置（比例）
		 */
		calculateProportion: function () {
			var state = this.state,
				$parentContainer = this.viewer.getContainer(),
				cvs = this.viewer.getCanvas('DICOM'),
				pWidth = $parentContainer.width(),
				pHeight = $parentContainer.height();
			state._ratioX = state.x / pWidth;
			state._ratioY = state.y / pHeight;
			state._ratioScaleX = cvs.width * state.scale / pWidth;
			state._ratioScaleY = cvs.height * state.scale / pHeight;
		},
		useProportion: function (params) {
			var $parentContainer = this.viewer.getContainer(),
				cvs = this.viewer.getCanvas('DICOM'),
				pWidth = $parentContainer.width(),
				pHeight = $parentContainer.height();
			params.x = params._ratioX * pWidth;
			params.y = params._ratioY * pHeight;
			if (params._scaleReferTo == 'X') {
				params.scale = pWidth * params._ratioScaleX / cvs.width;
			} else {
				params.scale = pHeight * params._ratioScaleY / cvs.height;
			}
		}
	}

	Positioner.prototype.constructor = Positioner;
})();