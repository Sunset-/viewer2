/**
 * 标注
 */
(function () {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 * 标注池
	 * @type {Object}
	 */
	var MarkPool = {};

	var MarkFactory = Cateyes.MarkFactory = {
		TYPES: {},
		regist: function (type, markConstructor) {
			markConstructor.prototype.TYPE = type;
			return this.TYPES[type] = markConstructor;
		},
		create: function (type, params) {
			if (this.TYPES[type]) {
				MarkPool[type] = MarkPool[type] || [];
				var mark;
				if (MarkPool[type].length) {
					mark = MarkPool[type].shift();
					mark.params = null;
					mark.setParams(params);
				} else {
					mark = new this.TYPES[type](params);
					mark.id = Cateyes.UniqueID();
					mark.type = type;
				}
				return mark;
			}
		}
	}

	/**
	 * 标注器
	 */
	var Marker = Cateyes.namespace('Cateyes.Marker', Cateyes.ClassHelper.extend(Cateyes.PubSub, function (viewer, params) {
		this.init(viewer, params);
	}, {
		/**
		 * 初始化
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		init: function (viewer, params) {
			this.viewer = viewer;
			this.params = this.params || {};
			this.initEvent();
			this.inited = true;
		},
		initEvent: function () {
			if (!this.inited) {
				var self = this;
				this.viewer.subscribe('AFTER_RENDER_DICOM', function () {
					self.getCurrentDicom().then(function () {
						self.refresh();
					})
				});
				this.viewer.subscribe('AFTER_MARK_CHANGE', function () {
					self.synchronizeCloud();
					self.refreshBusiness();
				});
				this.viewer.subscribe('AFTER_MARK_RENDER', function () {
					self.synchronizeCloud();
				});
			}
		},
		getSeriesInfo: function () {
			return this.viewer.getSeries().getInfo();
		},
		getCurrentDicom: function () {
			return this.viewer.player.getCurrentDicom();
		},
		setCurrentMark: function (mark) {
			this._currentMark = mark;
		},
		getCurrentMark: function () {
			return this._currentMark;
		},
		setCreatingMark: function (mark) {
			this._creatingMark = mark;
		},
		getCreatingMark: function () {
			return this._creatingMark;
		},
		getMarks: function () {
			var dicom;
			if (dicom = this.viewer.player.getCurrentDicom()) {
				return this.viewer.player.getCurrentDicom().marks || (this.viewer.player.getCurrentDicom().marks = []);
			}
		},
		setMarks: function (marks) {
			var dicom;
			if (dicom = this.viewer.player.getCurrentDicom()) {
				this.viewer.player.getCurrentDicom().marks = marks || [];
			}
		},
		/**
		 * 添加标注
		 */
		addMark: function (markInfo, isCurrent) {
			if (markInfo) {
				var mark,
					toCreate = true;
				//特殊处理：涂鸦标注唯一
				if (markInfo.type == 'CT_SCRAWL') {
					var marks = this.getMarks(),
						have = false;
					for (var i = 0, m; m = marks[i++];) {
						if (m.type == markInfo.type) {
							toCreate = false;
							m.destory();
							mark = m;
							break;
						}
					}
				}
				if (toCreate) {
					mark = MarkFactory.create(markInfo.type, markInfo.params);
					this.getMarks().push(mark);
				}
				this.refresh();
				if (isCurrent) {
					this.setCurrentMark(mark);
				}
				this.viewer.publish('AFTER_MARK_CHANGE');
				return mark;
			}
		},
		/**
		 * 创建标注
		 * @return {[type]} [description]
		 */
		creatingMark: function (params) {
			var mark = this.getCreatingMark();
			if (mark) {
				mark.setParams(params);
				this.refresh();
				this.viewer.publish('AFTER_MARK_RENDER');
			}
		},
		/**
		 * 完成创建
		 * @return {[type]} [description]
		 */
		createdMark: function () {
			var mark = this.getCreatingMark();
			if (mark) {
				var a = mark.isCreated(this._getMarkCanvas(), this);
				a && this.setCreatingMark(null);
				Cateyes.GlobalPubSub.publish('AFTER_MARK_CREATED', mark);
				return a;
			}
		},
		/**
		 * 更新标注
		 * @return {[type]} [description]
		 */
		refreshMark: function (params) {
			var mark = this.getCurrentMark();
			if (mark) {
				if (mark.isMove()) {
					mark.move(params);
				} else if (mark.isModify()) {
					mark.modify(params);
				}
				this.refresh();
				this.viewer.publish('AFTER_MARK_RENDER');
			}
		},
		/**
		 * 激活
		 * @return {[type]} [description]
		 */
		active: function (params) {
			var marks = this.getMarks(),
				a;
			if (marks) {
				for (var i = 0, m; m = marks[i++];) {
					if (!a) {
						a = m.focus(params, this);
					} else {
						m.blur();
					}
				}
				this.setCurrentMark(a);
				var haveSomeActive = !!a,
					self = this;
				if (this._lastHaveSomeActive != haveSomeActive) {
					this.getCurrentDicom().then(function () {
						self.refresh();
					});
					this._lastHaveSomeActive = haveSomeActive;
				}
			}
			return !!a;
		},
		refresh: function (silent) {
			this._clear();
			this._reDraw();
		},
		_clear: function () {
			var cvs = this._getMarkCanvas();
			cvs.context.clearRect(0, 0, cvs.width, cvs.height);
		},
		_reDraw: function () {
			var marks = this.getMarks(),
				cvs = this._getMarkCanvas();
			if (marks) {
				for (var i = 0, m; m = marks[i++];) {
					m.draw(cvs, this);
				}
			}

		},
		revoke: function () {
			var m = this.getMarks().pop();
			m && m.remove();
			this.refresh();
			this.viewer.publish('AFTER_MARK_CHANGE');
		},
		clear: function () {
			var marks = this.getMarks();
			while (marks.length) {
				marks.pop().remove();
			}
			this.refresh();
			this.viewer.publish('AFTER_MARK_CHANGE');
		},
		/**
		 * 获取标注画布
		 * @return {[type]} [description]
		 */
		_getMarkCanvas: function () {
			var self = this;
			return this.viewer.getCanvas('MARK', 2, function (viewer) {
				var dicomCanvas = viewer.getCanvas('DICOM'),
					$dicomCanvas = dicomCanvas.$el,
					position = viewer.positioner.getDicomCanvasPosition();
				if (this.width != position.width || this.height != position.height) {
					this.width = position.width;
					this.height = position.height;
					self._reDraw();
				}
				var stl = this.style,
					buff = [];
				buff.push("scale(");
				buff.push(position.horizontal > 0 ? 1 : -1);
				buff.push(",");
				buff.push(position.vertical > 0 ? 1 : -1);
				buff.push(") rotate(");
				buff.push(position.rotate * position.horizontal * position.vertical);
				buff.push("deg)");
				buff = buff.join("");
				// 兼容各浏览器
				stl.transform = buff;
				stl.oTransform = buff;
				stl.msTransform = buff;
				stl.mozTransform = buff;
				stl.webkitTransform = buff;
				this.$el.css({
					'margin-top': position.top - (this.height / 2),
					'margin-left': position.left - (this.width / 2)
				});
			});
		},
		/**
		 * 锁住画布尺寸(坐标转换失效)
		 * @return {[type]} [description]
		 */
		lockSize: function (flag) {
			this._lockSize = !!flag;
		},
		/**
		 * 将DICOM坐标转换为标注画布坐标
		 * @param  {[type]} s [description]
		 * @return {[type]}   [description]
		 */
		covertPositionForMark: function (s, key) {
			if (this._lockSize) {
				return s;
			}
			var state = this.viewer.positioner.getState();
			if (Cateyes.Utils.isObject(s)) {
				var obj = {};
				for (var k in s) {
					if (s.hasOwnProperty(k)) {
						obj[k] = s[k] * state.scale;
						if (k.indexOf('x') == k.length - 1) {
							obj[k] *= state.horizontal;
						} else if (k.indexOf('y') == k.length - 1) {
							obj[k] *= state.vertical;
						}
					}
				}
				return obj;
			} else if (Cateyes.Utils.isArray(s)) {
				var arr = [],
					scale = state.scale,
					temp;
				for (var i = 0, l = s.length; i < l; i++) {
					temp = s[i] * state.scale;
					arr[i] = i % 2 == 0 ? (temp *= state.horizontal) : (temp *= state.vertical);
				}
				return arr;
			} else {
				s *= state.scale
				if (key.indexOf('x') == key.length - 1) {
					s *= state.horizontal;
				} else if (key.indexOf('y') == key.length - 1) {
					s *= state.vertical;
				}
				return s;
			}
		},
		/**
		 * 获取状态JSON信息
		 * @return {[type]} [description]
		 */
		synchronizeCloud: function () {
			if (Cateyes.CatCloud.isOnline()) {
				Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_SEND_MESSAGE, this.getJson());
			}
		},
		getJson: function () {
			var json = {};
			var marks = this.getMarks(),
				marksJson = [];
			for (var i = 0, m; m = marks[i++];) {
				marksJson.push(m.serialize());
			}
			json['VIEWER_' + this.viewer.getViewerId() + '|marker'] = JSON.stringify({
				marks: marksJson
			});
			return json;
		},
		setJson: function (json) {
			var params = JSON.parse(json),
				marksJson = params.marks,
				marks = [];
			for (var i = 0, m; m = marksJson[i++];) {
				marks.push(MarkFactory.create(m.type, m.params));
			}
			this.setMarks(marks);
			this.refresh();
			this.viewer.publish(Cateyes.CustomEvents.REFRESH_MARK_TAG);
		},
		/**
		 * 业务层传递参数
		 * @param  {[type]} ) {		var       cvs [description]
		 * @return {[type]}   [description]
		 */
		refreshBusiness: function () {
			var cpb;
			if (cpb = window.parent.window.CateyesPubSub) {
				var allStudies = Cateyes.DicomService.getAllStudies();
				var markDicomCount = 0;
				if (allStudies && allStudies.length) {
					var serieses,
						dicoms;
					for (var i = 0, study; study = allStudies[i++];) {
						serieses = study.serieses;
						if (serieses) {
							for (var j = 0, series; series = serieses[j++];) {
								dicoms = series._dicoms;
								if (dicoms) {
									for (var k = 0, dicom; dicom = dicoms[k++];) {
										if (dicom.marks && dicom.marks.length) {
											markDicomCount++;
										}
									}
								}
							}
						}
					}
				}
				cpb.trigger('AFTER_CATEYES_MARK', [markDicomCount]);
			}
		}

	}));

	//静态离屏Canvas
	Marker.getOffScreenCanvasBuffer = (function () {
		var cvs = document.createElement('canvas'),
			panel;
		cvs.context = cvs.getContext('2d');
		cvs.style.display = 'none';
		return function (width, height) {
			if (cvs.width == width && cvs.height == height && panel) {
				return panel;
			} else {
				cvs.width = width;
				cvs.height = height;
				return panel = cvs.context.getImageData(0, 0, width, height);
			}
		};
	})();


	// 全局常量
	var LINE_WIDTH = 2, // 线粗
		POINT_RADIUS = 10, // 触点半径
		NORMAL_COLOR = '#40E829',
		ACTIVE_COLOR = '#F6E93B',
		BORDER_WIDTH = 1.5,
		BORDER_COLOR = "#000",
		NORMAL_POINT_COLOR = "#CC0032", // 常规触点颜色
		ACTIVE_POINT_COLOR = "#ECC41C", // 激活触点颜色
		FONT_COLOR = "#E9363A", // 文字颜色
		FONT_STYLE = "bold 14px arial,sans-serif", // 文字样式
		ELLIPSE_POINT_X = 2 / 3, // 椭圆斜率
		ELLIPSE_POINT_Y = Math["sqrt"](5 / 9);


	/**
	 * 标注基类
	 */
	var Mark = function (params) {
		this.setParams(params);
	};
	Mark.prototype = {
		baseStyle: {
			COMMON_MARK_ALPHA: 0.2, //标记法透明值
			NORMAL_LINE_COLOR: '#00dddb',
			ACTIVE_LINE_COLOR: '#FFFF00',
			NORMAL_LINE_WIDTH: 2,
			NORMAL_POINT_COLOR: '#74fc8d',
			ACTIVE_POINT_COLOR: '#e9ff8f',
			CIRCLE_POINT_RADIUS: Cateyes.isPlat('PC') ? 7 : 12,
			POINT_RADIUS: 3,
			NORMAL_FONTPANEL_COLOR: '#7dfffe',
			ACTIVE_FONTPANEL_COLOR: '#7dfffe',
			NORMAL_FONT_COLOR: '#FBF41C',
			ACTIVE_FONT_COLOR: '#e745e9',
			NORMAL_FONT_STYLE: 'normal 14px arial,sans-serif',
			NORMAL_TEXT_BG_COLOR: 'RGBA(133,52,77,0.9)',
			ACTIVE_TEXT_BG_COLOR: 'RGBA(163,82,107,0.9)'
		},
		/**
		 * 设置参数
		 * @param {[type]} params [description]
		 */
		setParams: function (params, init) {
			this.params = $.extend({}, this.params || this.defaults, params);
			this.style = $.extend({}, this.baseStyle, this.defaultStyle, this.style, params.style);
			if (Cateyes.Utils.isDefined(this.params._)) {
				var _ = this.params._;
				for (var k in _) {
					this.params[k] = eval(this.params[k] + _[k]);
				}
				delete this.params._;
			}
			init && this.blur();
			this.updateTime = new Date().getTime();
		},
		isCreated: function () {
			return true;
		},
		startMove: function () {
			this.moveStartParams = $.extend(true, {}, this.params);
		},
		/**
		 * 移动
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		move: function (params) {
			this._move(params);
			this.updateTime = new Date();
		},
		/**
		 * 移动策略
		 * @return {[type]} [description]
		 */
		_move: function (params) {
			var posXAttrs = ['sx', 'ex', 'ax', 'csx', 'cex', 'dsx', 'dex', 'ssx', 'sex'],
				posYAttrs = ['sy', 'ey', 'ay', 'csy', 'cey', 'dsy', 'dey', 'ssy', 'sey'],
				_ = params._;
			if (!this.moveStartParams) {
				this.moveStartParams = this.params;
			}
			var tp = this.params = $.extend(true, {}, this.moveStartParams);
			if (_) {
				for (var i = 0, k; k = posXAttrs[i++];) {
					if (tp.hasOwnProperty(k)) {
						tp[k] = eval(tp[k] + _.x);
					}
				}
				for (var i = 0, k; k = posYAttrs[i++];) {
					if (tp.hasOwnProperty(k)) {
						tp[k] = eval(tp[k] + _.y);
					}
				}
			}
		},
		/**
		 * 修改
		 */
		modify: function (params) {
			if (!this.moveStartParams) {
				this.moveStartParams = this.params;
			}
			this.params = $.extend(true, {}, this.moveStartParams);
			this._modify(params);
			this.updateTime = new Date().getTime();
		},
		/**
		 * 修改策略
		 * @return {[type]} [description]
		 */
		_modify: function () {
			throw new Error('getModify 方法未在子类中实现');
		},
		/**
		 * 绘制
		 * @return {[type]} [description]
		 */
		draw: function () {
			this._draw.apply(this, [].slice.call(arguments));
			this.drawTime = new Date().getTime();
		},
		_draw: function () {
			throw new Error('draw 方法未在子类中实现');
		},
		/**
		 * 是否变化
		 * @return {Boolean} [description]
		 */
		isChanged: function () {
			return !(this.drawTime && this.updateTime && this.drawTime > this.updateTime);
		},
		refreshChanged: function () {
			this.updateTime = new Date().getTime();
		},
		/**
		 * 移除
		 * @return {[type]} [description]
		 */
		remove: function () {
			MarkPool[this.TYPE].push(this);
			this.destory();
		},
		destory: function () {

		},
		focus: function (params, marker) {
			this.blur();
			//测量结果激活判定
			this.measureResultFoucs(params, marker);
			//调用子类的激活判断
			if (!this._isMove && !this._isModify) {
				this._focus(params, marker);
			}
			if (this.isMove() || this.isModify()) {
				this.startMove();
				return this;
			}
		},
		isActive: function () {
			return this._isMove || this._isModify;
		},
		isMove: function () {
			return this._isMove;
		},
		isModify: function () {
			return this._isModify;
		},
		blur: function () {
			this._isMove = this._isModify = false;
			this._blur();
		},
		_blur: function () {
			throw new Error('_blur 方法未在子类中实现');
		},
		/**
		 * 绘制测量结果
		 * @param  {[type]} cvs  [description]
		 * @param  {[type]} text [description]
		 * @return {[type]}      [description]
		 */
		drawMeasureResult: function (cvs, pos, marker) {
			var text = this.getText(cvs, marker);
			if (!text) {
				return;
			}
			var ctx = cvs.context,
				style = this.style;

			var state = this._calculateTextBgSize(text, style.NORMAL_FONT_STYLE);
			if (pos.x + state.width > cvs.width) {
				pos.x -= state.width;
			}
			ctx.save();
			//1.绘制背景
			ctx.beginPath();
			ctx.fillStyle = this.isActive() ? style.ACTIVE_TEXT_BG_COLOR : style.NORMAL_TEXT_BG_COLOR;
			ctx.rect(pos.x, pos.y, state.width, state.height);
			ctx.fill();
			//2.绘制文字
			ctx.fillStyle = style.NORMAL_FONT_COLOR;
			ctx.font = style.NORMAL_FONT_STYLE;
			var textY = pos.y + 14 + 2;
			for (var i = 0, t; t = text[i++];) {
				var tempX = pos.x + 3;
				if (Cateyes.Utils.isString(t)) {
					ctx.fillText(t, tempX, textY);
				} else if (Cateyes.Utils.isArray(t)) {
					t.forEach(f => {
						if (Cateyes.Utils.isString(f)) {
							ctx.fillStyle = style.NORMAL_FONT_COLOR;
							ctx.fillText(f, tempX, textY);
						} else {
							ctx.fillStyle = f.color || style.NORMAL_FONT_COLOR;
							ctx.fillText(f.text, tempX, textY);
						}
						tempX += text.length * 14;
					})
					ctx.fillStyle = 'blue';
				}
				textY += 14 + 2;
			}
			ctx.restore();
			this.MeasureResultPosition = $.extend(state, pos);
		},
		/**
		 * 测量结果激活判定
		 */
		measureResultFoucs: function (params, marker) {
			var pos;
			if (pos = this.MeasureResultPosition) {
				var cp = marker.covertPositionForMark({
					x: params.x,
					y: params.y
				});
				if (Cateyes.MathUtils.isBetween(cp.x, pos.x, pos.x + pos.width) && Cateyes.MathUtils.isBetween(cp.y, pos.y, pos.y + pos.height)) {
					this._isMove = true;
				}
			}
		},
		/**
		 * 计算文字容器的尺寸
		 */
		_calculateTextBgSize: function (text, fontStyle) {
			var html = ['<div style="position:absolute;">'];
			for (var i = 0, t; t = text[i++];) {
				html.push('<div>');
				if (Cateyes.Utils.isString(t)) {
					html.push(t);
				} else if (Cateyes.Utils.isArray(t)) {
					t.forEach(f => {
						if (Cateyes.Utils.isString(f)) {
							html.push(f);
						} else {
							html.push(f.text);
						}
					})
				}
				html.push('</div>');
			}
			html.push('</div>');
			var $el = $(html.join('')).css({
				visibility: 'hidden',
				font: fontStyle
			}).appendTo($('body'));
			var state = {
				width: $el.width() + 6,
				height: $el.height() + 6 + 2 * (text.length - 1)
			};
			$el.remove();
			return state;
		},
		/**
		 * 获取标注测量结果文本
		 * @return {[type]} [description]
		 */
		getText: function () {
			var text = this._text;
			if (!text || this.isChanged()) {
				text = this._text = this._getText.apply(this, [].slice.call(arguments));
			}
			return text;
		},
		_getText: function () {
			throw new Error('_getText 方法未在子类中实现');
		},
		serialize: function () {
			return {
				type: this.type,
				params: this.params
			};
		}
	};
	Mark.prototype.contrunctor = Mark;


	//直线测量
	MarkFactory.regist('PYS_LENGTH', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: params.sx,
					sy: params.sy,
					ex: params.ex,
					ey: params.ey
				});
			ctx.save();
			// line
			ctx.beginPath();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.lineColor;
			ctx.moveTo(cp.sx, cp.sy);
			ctx.lineTo(cp.ex, cp.ey);
			ctx.stroke();
			// point
			ctx.strokeStyle = ctx.fillStyle = style.startPointColor;
			ctx.beginPath();
			ctx.arc(cp.sx, cp.sy, style.CIRCLE_POINT_RADIUS, 0, Math.PI * 2, true);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(cp.sx, cp.sy, 2, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.closePath();
			ctx.strokeStyle = ctx.fillStyle = style.endPointColor;
			ctx.beginPath();
			ctx.arc(cp.ex, cp.ey, style.CIRCLE_POINT_RADIUS, 0, Math.PI * 2, true);
			ctx.stroke();
			ctx.beginPath();
			ctx.arc(cp.ex, cp.ey, 2, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.closePath();
			//text
			this.drawMeasureResult(canvas, {
				x: Math.max(cp.ex, cp.sx) + 15,
				y: (cp.ex > cp.sx ? cp.ey : cp.sy) - 35
			}, marker);
			ctx.restore();
		},
		_getText: function (cvs, marker) {
			return;
			var currentDicom = marker.getCurrentDicom(),
				params = this.params,
				pixelSpacing = currentDicom.dicomInfo.pixelSpacing;
			return [Cateyes.MathUtils.measureHypotenuse((params.sx - params.ex) * pixelSpacing[0], (params.sy - params.ey) * (pixelSpacing[1] || pixelSpacing[0])).toFixed(2) + 'mm'];
		},
		/**
		 * 激活
		 * @param  {[type]} params [description]
		 * @param  {[type]} marker [description]
		 * @return {[type]}        [description]
		 */
		_focus: function (params, marker) {
			var thisParams = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: thisParams.sx,
					sy: thisParams.sy,
					ex: thisParams.ex,
					ey: thisParams.ey,
					cx: params.x,
					cy: params.y
				});
			if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.sx, cp.sy) <= style.CIRCLE_POINT_RADIUS + 5) {
				this._activePoint = 'START';
				style.startPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.ex, cp.ey) <= style.CIRCLE_POINT_RADIUS + 5) {
				this._activePoint = 'END';
				style.endPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else {
				this._isMove = this._isMove || Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.ex, cp.ey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.sx, cp.ex) && Cateyes.MathUtils.isBetween(cp.cy, cp.sy, cp.ey);
				if (this._isMove) {
					style.lineColor = style.ACTIVE_LINE_COLOR;
				}
			}
		},
		_blur: function () {
			var style = this.style;
			this._activePoint = null;
			style.startPointColor = style.endPointColor = style.NORMAL_POINT_COLOR;
			style.lineColor = style.NORMAL_LINE_COLOR;
		},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {
			if (this._activePoint == 'START') {
				this.params.sx = eval(this.params.sx + params._.x);
				this.params.sy = eval(this.params.sy + params._.y);
			} else if (this._activePoint == 'END') {
				this.params.ex = eval(this.params.ex + params._.x);
				this.params.ey = eval(this.params.ey + params._.y);
			}
		}
	}));

	//角度测量
	MarkFactory.regist('PYS_ANGLE', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0,
			ax: null,
			ay: null
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				creating = params.ax == null,
				cp = marker.covertPositionForMark({
					sx: params.sx,
					sy: params.sy,
					ex: params.ex,
					ey: params.ey,
					ax: creating ? params.ex : params.ax,
					ay: creating ? params.ey : params.ay
				}),
				sx = cp.sx,
				sy = cp.sy,
				ex = cp.ex,
				ey = cp.ey,
				ax = cp.ax,
				ay = cp.ay;
			ctx.save();
			// line
			ctx.beginPath();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.lineColor;
			ctx.moveTo(sx, sy);
			ctx.lineTo(ax, ay);
			ctx.lineTo(ex, ey);
			ctx.stroke();
			// point
			var points = ["start", "angle", "end"];
			for (var i = 0; i < 3; i++) {
				ctx.strokeStyle = ctx.fillStyle = style[points[i] + "PointColor"];
				ctx.beginPath();
				var x = cp[points[i][0] + "x"],
					y = cp[points[i][0] + "y"];
				ctx.arc(x, y, style.CIRCLE_POINT_RADIUS, 0, Math.PI * 2, true);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(x, y, 2, 0, Math.PI * 2, true);
				ctx.fill();
				ctx.closePath();
			}
			ctx.strokeStyle = FONT_COLOR;
			if (!creating) {
				// text
				this.drawMeasureResult(canvas, {
					x: (ex + sx + ax) / 3,
					y: (ey + sy + ay) / 3
				}, marker);
			}
			ctx.restore();
		},
		_getText: function (cvs, marker) {
			var params = this.params;
			var angle = parseInt(Cateyes.MathUtils.getAngle(params.sx, params.sy, params.ex, params.ey, params.ax,
				params.ay));
			return [(isNaN(angle) ? '0' : angle) + "°"];
		},
		isCreated: function () {
			if (this.params.ax == null) {
				this.params.ax = this.params.ex;
				this.params.ay = this.params.ey;
			} else {
				return true;
			}
		},
		/**
		 * 激活
		 * @param  {[type]} params [description]
		 * @param  {[type]} marker [description]
		 * @return {[type]}        [description]
		 */
		_focus: function (params, marker) {
			var thisParams = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: thisParams.sx,
					sy: thisParams.sy,
					ex: thisParams.ex,
					ey: thisParams.ey,
					ax: thisParams.ax,
					ay: thisParams.ay,
					cx: params.x,
					cy: params.y
				});
			if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.sx, cp.sy) <= 10) {
				this._activePoint = 'START';
				style.startPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.ex, cp.ey) <= 10) {
				this._activePoint = 'END';
				style.endPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.ax, cp.ay) <= 10) {
				this._activePoint = 'ANGLE';
				style.anglePointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else {
				this._isMove = this._isMove || Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.ex, cp.ey) <= 10;
				if (this._isMove) {
					style.lineColor = style.ACTIVE_LINE_COLOR;
				}
			}
		},
		_blur: function () {
			var style = this.style;
			this._activePoint = null;
			style.startPointColor = style.endPointColor = style.anglePointColor = style.NORMAL_POINT_COLOR;
			style.lineColor = style.NORMAL_LINE_COLOR;
		},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {
			if (this._activePoint == 'START') {
				this.params.sx = eval(this.params.sx + params._.x);
				this.params.sy = eval(this.params.sy + params._.y);
			} else if (this._activePoint == 'END') {
				this.params.ex = eval(this.params.ex + params._.x);
				this.params.ey = eval(this.params.ey + params._.y);
			} else if (this._activePoint == 'ANGLE') {
				this.params.ax = eval(this.params.ax + params._.x);
				this.params.ay = eval(this.params.ay + params._.y);
			}
		}
	}));

	//单点CT测量标注
	MarkFactory.regist('CT_POINT', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0
		},
		defaultStyle: {
			r: 5,
			fillStyle: 'rgba(83,83,82,0.7)',
			strokeStyle: '#ababab'
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				sx = params.sx,
				sy = params.sy,
				msx = marker.covertPositionForMark(sx, 'msx'),
				msy = marker.covertPositionForMark(sy, 'msy');
			// //point
			ctx.save();
			ctx.lineWidth = style.lineWidth;
			ctx.strokeStyle = style.NORMAL_TEXT_BG_COLOR;
			ctx.fillStyle = style.NORMAL_TEXT_BG_COLOR;
			ctx.beginPath();
			ctx.arc(msx, msy, 2, 0, Math.PI * 2, true);
			ctx.fill();
			ctx.beginPath();
			ctx.moveTo(msx, msy);
			ctx.lineTo(msx + 10, msy - 10);
			ctx.stroke();
			ctx.restore();
			//text
			this.drawMeasureResult(canvas, {
				x: msx + 10,
				y: msy - 31
			}, marker);
		},
		_getText: function (cvs, marker) {
			var params = this.params,
				seriesInfo = marker.getSeriesInfo(),
				currentDicom = marker.getCurrentDicom();
			if (seriesInfo.samplesPerPixel == 1) {
				//灰度图
				var gray = currentDicom.getPixelData()[Math.round(params.sy) * currentDicom.dicomInfo.width + Math.round(params.sx)];
				return (currentDicom.dicomInfo.deviceType == 'CT' ? [Cateyes.DicomHelper.grayToCT(gray, currentDicom.dicomInfo) + 'Hu' + '(' + Math.round(params.sx) + ',' + Math.round(params.sy) + ')'] : [gray + '(' + Math.round(params.sx) + ',' + Math.round(params.sy) + ')']);
			} else {
				return null;
			}
		},
		_focus: function (params, marker) {
			var thisParams = this.params,
				cp = marker.covertPositionForMark({
					sx: thisParams.sx,
					sy: thisParams.sy,
					cx: params.x,
					cy: params.y
				});
			this._isMove = this._isMove || Cateyes.MathUtils.isBetween(cp.cx, cp.sx + 3, cp.sx + 53) && Cateyes.MathUtils.isBetween(cp.cy, cp.sy - 30, cp.sy - 10);
		},
		_blur: function () {
			this._isMove = false;
		}
	}));


	//矩形CT测量
	MarkFactory.regist('CT_RECT', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0,
			POINT_HALF_WIDTH: 3,
			POINTS: ["LT", "RT", "RB", "LB"],
			POINTS_OFFSET: [0, 0, 1, 0, 1, 1, 0, 1]
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: params.sx,
					sy: params.sy,
					ex: params.ex,
					ey: params.ey
				}),
				sx = cp.sx,
				sy = cp.sy,
				ex = cp.ex,
				ey = cp.ey,
				w = ex - sx,
				h = ey - sy,
				r = style.POINT_RADIUS,
				d = 2 * r;
			ctx.save();
			// line
			ctx.beginPath();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.lineColor;
			ctx.strokeRect(sx, sy, w, h);
			// point
			var points = params.POINTS,
				offsets = params.POINTS_OFFSET;
			for (var i = 0, l = points.length; i < l; i++) {
				ctx.fillStyle = style[points[i]];
				ctx.fillRect(sx + offsets[i * 2] * w - r, sy + offsets[i * 2 + 1] * h - r, d, d);
			}
			ctx.restore();
			//text
			this.drawMeasureResult(canvas, {
				x: Math.max(cp.sx, cp.ex) + 10,
				y: Math.min(cp.sy, cp.ey) - 65
			}, marker);
		},
		_getText: function (cvs, marker) {
			return;
			// 计算区域内平平均CT值
			var params = this.params,
				x1 = Math.round(Math.min(params.sx, params.ex)),
				x2 = Math.round(Math.max(params.sx, params.ex)),
				y1 = Math.round(Math.min(params.sy, params.ey)),
				y2 = Math.round(Math.max(params.sy, params.ey)),
				currentDicom = marker.getCurrentDicom(),
				columns = currentDicom.dicomInfo.width,
				slope = currentDicom.dicomInfo.rescaleSlope,
				intercept = currentDicom.dicomInfo.rescaleIntercept,
				pixels = currentDicom.getPixelData(),
				offset,
				temp,
				cts = [];
			for (var i = y1; i < y2; i++) {
				offset = i * columns;
				for (var j = x1; j < x2; j++) {
					if (!isNaN(temp = pixels[offset + j])) {
						cts.push(temp * slope + intercept);
					}
				}
			}
			var ctObj = Cateyes.MathUtils.measureMeanAndSD(cts);
			var text = [];
			text.push("Min / Max：" + ctObj.min + " / " + ctObj.max);
			text.push("Mean ± SD：" + ctObj.mean + " ± " + ctObj.sd);
			// 面积
			text.push("AREA：" + Cateyes.MathUtils.measureArea(currentDicom.dicomInfo.pixelSpacing[0] * currentDicom.dicomInfo.pixelSpacing[1], cts.length));
			return text;
		},
		_points: {
			LT: ['sx', 'sy'],
			RT: ['ex', 'sy'],
			LB: ['sx', 'ey'],
			RB: ['ex', 'ey']
		},
		_focus: function (params, marker) {
			var thisParams = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: thisParams.sx,
					sy: thisParams.sy,
					ex: thisParams.ex,
					ey: thisParams.ey,
					cx: params.x,
					cy: params.y
				});
			var ps = this._points;
			for (var k in ps) {
				if (ps.hasOwnProperty(k)) {
					if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp[ps[k][0]], cp[ps[k][1]]) <= 10) {
						this._activePoint = k;
						style[k] = style.ACTIVE_POINT_COLOR;
						this._isModify = true;
						return;
					}
				}
			}
			this._isMove = this._isMove || Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.sx, cp.ey) <= 10 && Cateyes.MathUtils.isBetween(cp.cy, cp.sy, cp.ey) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.ex, cp.sy) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.sx, cp.ex) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.ex, cp.ey, cp.sx, cp.ey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.sx, cp.ex) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.ex, cp.ey, cp.ex, cp.sy) <= 10 && Cateyes.MathUtils.isBetween(cp.cy, cp.sy, cp.ey);
			if (this._isMove) {
				style.lineColor = style.ACTIVE_LINE_COLOR;
			}
		},
		_blur: function () {
			var style = this.style;
			this._activePoint = null;
			style.lineColor = style.NORMAL_LINE_COLOR;
			style.LT = style.RT = style.LB = style.RB = style.NORMAL_POINT_COLOR;
		},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {
			var p = this._points[this._activePoint];
			if (p) {
				this.params[p[0]] = eval(this.params[p[0]] + params._.x);
				this.params[p[1]] = eval(this.params[p[1]] + params._.y);
			}
		}
	}));

	//椭圆CT测量
	MarkFactory.regist('CT_ELLIPSE', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0,
			POINT_HALF_WIDTH: 3,
			POINTS: ["LT", "RT", "RB", "LB"],
			POINTS_OFFSET: [-1, -1, 1, -1, 1, 1, -1, 1]
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				cp = this._cp = marker.covertPositionForMark({
					sx: params.sx,
					sy: params.sy,
					ex: params.ex,
					ey: params.ey
				}),
				sx = cp.sx,
				sy = cp.sy,
				ex = cp.ex,
				ey = cp.ey,
				a = cp.a = Math.abs(ex - sx) / 2,
				b = cp.b = Math.abs(ey - sy) / 2,
				x = (sx + ex) / 2,
				y = (sy + ey) / 2,
				r = style.POINT_RADIUS,
				d = 2 * r,
				ox = 0.5 * a,
				oy = 0.6 * b;
			ctx.save();
			// line
			ctx.save();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.lineColor;
			ctx.translate(x, y);
			ctx.beginPath();
			// 从椭圆纵轴下端开始逆时针方向绘制
			ctx.moveTo(0, b);
			ctx.bezierCurveTo(ox, b, a, oy, a, 0);
			ctx.bezierCurveTo(a, -oy, ox, -b, 0, -b);
			ctx.bezierCurveTo(-ox, -b, -a, -oy, -a, 0);
			ctx.bezierCurveTo(-a, oy, -ox, b, 0, b);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
			// point
			var points = params.POINTS,
				offsets = params.POINTS_OFFSET;
			for (var i = 0, l = points.length; i < l; i++) {
				ctx.fillStyle = style[points[i]];
				ctx.fillRect(x + offsets[i * 2] * a - r, y + offsets[i * 2 + 1] * b - r, d, d);
			}
			ctx.restore();

			//text
			this.drawMeasureResult(canvas, {
				x: Math.max(cp.sx, cp.ex) + 10,
				y: Math.min(cp.sy, cp.ey) - 70
			}, marker);
		},
		_getText: function (canvas, marker) {
			return;
			var params = this.params,
				cp = this._cp,
				currentDicom = marker.getCurrentDicom(),
				scale = canvas.width * 1.0 / currentDicom.dicomInfo.width,
				x1 = Math.round(Math.min(params.sx, params.ex)),
				x2 = Math.round(Math.max(params.sx, params.ex)),
				y1 = Math.round(Math.min(params.sy, params.ey)),
				y2 = Math.round(Math.max(params.sy, params.ey)),
				canvasWidth = canvas.width,
				imageData = canvas.context.getImageData(0, 0, canvas.width, canvas.height),
				pixels = imageData.data,
				alp255 = Math
				.floor(255 * this.style.COMMON_MARK_ALPHA),
				min = alp255 - 5,
				max = alp255 + 5,
				offset,
				index,
				gray,
				alp,
				points = [],
				point,
				cts = [];
			//椭圆内的点,计算CT
			var a = (x2 - x1) / 2,
				aa = a * a,
				b = (y2 - y1) / 2,
				bb = b * b,
				ox = (x2 + x1) / 2,
				oy = (y2 + y1) / 2,
				x,
				y;
			x1 -= ox;
			x2 -= ox;
			y1 -= oy;
			y2 -= oy;
			var dicomWidth = currentDicom.dicomInfo.width,
				dicomHeight = currentDicom.dicomInfo.height,
				slope = currentDicom.dicomInfo.rescaleSlope,
				intercept = currentDicom.dicomInfo.rescaleIntercept,
				grayArray = marker.getCurrentDicom().getPixelData(),
				ps, x,
				y,
				gray;
			for (var i = y1; i < y2; i++) {
				for (var j = x1; j < x2; j++) {
					if (Math.pow(j, 2) / aa + Math.pow(i, 2) / bb < 1) {
						gray = grayArray[(i + oy) * dicomWidth + j + ox];
						if (!isNaN(gray)) {
							cts.push(gray * slope + intercept);
						}
					}
				}
			}
			var ctObj = Cateyes.MathUtils.measureMeanAndSD(cts),
				text = [];
			text.push("Min / Max：" + ctObj.min + " / " + ctObj.max);
			text.push("Mean ± SD：" + ctObj.mean + " ± " + ctObj.sd);
			// 面积
			text.push("AREA：" + Cateyes.MathUtils.measureArea(currentDicom.dicomInfo.pixelSpacing[0] * currentDicom.dicomInfo.pixelSpacing[1], cts.length) + "(" + cts.length + " px)");
			return text;
		},
		_points: {
			LT: ['sx', 'sy'],
			RT: ['ex', 'sy'],
			LB: ['sx', 'ey'],
			RB: ['ex', 'ey']
		},
		_focus: function (params, marker) {
			var thisParams = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					sx: thisParams.sx,
					sy: thisParams.sy,
					ex: thisParams.ex,
					ey: thisParams.ey,
					cx: params.x,
					cy: params.y
				});
			var ps = this._points;
			for (var k in ps) {
				if (ps.hasOwnProperty(k)) {
					if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp[ps[k][0]], cp[ps[k][1]]) <= 10) {
						this._activePoint = k;
						style[k] = style.ACTIVE_POINT_COLOR;
						this._isModify = true;
						return;
					}
				}
			}
			this._isMove = this._isMove || Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.sx, cp.ey) <= 10 && Cateyes.MathUtils.isBetween(cp.cy, cp.sy, cp.ey) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.sx, cp.sy, cp.ex, cp.sy) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.sx, cp.ex) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.ex, cp.ey, cp.sx, cp.ey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.sx, cp.ex) ||
				Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.ex, cp.ey, cp.ex, cp.sy) <= 10 && Cateyes.MathUtils.isBetween(cp.cy, cp.sy, cp.ey);
			if (this._isMove) {
				style.lineColor = style.ACTIVE_LINE_COLOR;
			}
		},
		_blur: function () {
			var style = this.style;
			this._activePoint = null;
			style.lineColor = style.NORMAL_LINE_COLOR;
			style.LT = style.RT = style.LB = style.RB = style.NORMAL_POINT_COLOR;
		},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {
			var p = this._points[this._activePoint];
			if (p) {
				this.params[p[0]] = eval(this.params[p[0]] + params._.x);
				this.params[p[1]] = eval(this.params[p[1]] + params._.y);
			}
		}
	}));

	//涂鸦CT测量
	MarkFactory.regist('CT_SCRAWL', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.key = null;
		this.trace = [];
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0,
			POINT_HALF_WIDTH: 3,
			POINTS: ["LT", "RT", "RB", "LB"],
			POINTS_OFFSET: [-1, -1, 1, -1, 1, 1, -1, 1]
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				key = params.sx + '-' + params.sy,
				start = false;

			var LINE_WIDTH = 1;
			ctx.lineWidth = LINE_WIDTH;
			ctx.strokeStyle = "#00FF37";
			if (this.key != key) {
				this.key = key;
				this.trace = [params.sx, params.sy, params.ex, params.ey];
				this._minX = Math.min(params.sx, params.ex);
				this._maxX = Math.max(params.sx, params.ex);
				this._minY = Math.min(params.sy, params.ey);
				this._maxY = Math.max(params.sy, params.ey);
				start = true;
			} else {
				this.trace = this.trace || [];
				this.trace.splice(this.trace.length, 0, params.ex, params.ey);
				this._minX = Math.min(this._minX, params.ex);
				this._maxX = Math.max(this._maxX, params.ex);
				this._minY = Math.min(this._minY, params.ey);
				this._maxY = Math.max(this._maxY, params.ey);
			}

			var trace = marker.covertPositionForMark(this.trace);
			ctx.beginPath();
			ctx.moveTo(trace[0], trace[1]);
			for (var i = 2; i < trace.length; i += 2) {
				ctx.lineTo(trace[i], trace[i + 1]);
			}
			ctx.stroke();
			if (this._finished) {
				this.isCreated(canvas, marker);
			}
		},
		isCreated: function (canvas, marker) {
			var trace = this.trace,
				ctx = canvas.context,
				cp = marker.covertPositionForMark({
					sx: trace[trace.length - 2],
					sy: trace[trace.length - 1],
					ex: trace[0],
					ey: trace[1]
				});
			ctx.moveTo(cp.sx, cp.sy);
			ctx.lineTo(cp.ex, cp.ey);
			ctx.stroke();
			this._finished = true;

			ctx.save();
			ctx.fillStyle = "#000";
			ctx.globalAlpha = this.style.COMMON_MARK_ALPHA; // 标记区域信号
			ctx.fill();
			ctx.restore();
			//text
			var cp = this._cp = marker.covertPositionForMark({
				sx: this._minX,
				sy: this._minY,
				ex: this._maxX,
				ey: this._maxY
			});
			this.refreshChanged();
			this.drawMeasureResult(canvas, {
				x: ((cp.sx + cp.ex) >> 1) + 10,
				y: cp.ey + 10
			}, marker);
			return true;
		},
		destory: function () {
			this._finished = false;
			this.key = null;
			this.trace = [];
		},
		_getText: function (canvas, marker) {
			var params = this.params,
				cp = this._cp,
				currentDicom = marker.getCurrentDicom(),
				scale = canvas.width * 1.0 / currentDicom.dicomInfo.width,
				x1 = Math.round(Math.min(cp.sx, cp.ex)),
				x2 = Math.round(Math.max(cp.sx, cp.ex)),
				y1 = Math.round(Math.min(cp.sy, cp.ey)),
				y2 = Math.round(Math.max(cp.sy, cp.ey)),
				canvasWidth = canvas.width,
				imageData = canvas.context.getImageData(0, 0, canvas.width, canvas.height),
				pixels = imageData.data,
				alp255 = Math
				.floor(255 * this.style.COMMON_MARK_ALPHA),
				min = alp255 - 5,
				max = alp255 + 5,
				offset,
				index,
				gray,
				alp,
				points = {},
				point,
				cts = [];
			//1.收集标记点
			for (var i = y1; i < y2; i++) {
				offset = i * canvasWidth;
				for (var j = x1; j < x2; j++) {
					index = offset * 4 + j * 4;
					gray = pixels[index];
					alp = pixels[index + 3];
					if (alp >= min && alp <= max) {
						pixels[index + 3] = 1; // 取消透明标记
						point = Math.round(j / scale) + ',' + Math.round(i / scale);
						points[point] = true;
					}
				}
			}
			//canvas.context.putImageData(imageData, 0, 0);
			//2.计算CT
			var dicomWidth = currentDicom.dicomInfo.width,
				dicomHeight = currentDicom.dicomInfo.height,
				slope = currentDicom.dicomInfo.rescaleSlope,
				intercept = currentDicom.dicomInfo.rescaleIntercept,
				grayArray = marker.getCurrentDicom().getPixelData(),
				ps, x,
				y,
				gray;
			for (var p in points) {
				if (points.hasOwnProperty(p)) {
					ps = p.split(",");
					x = ps[0], y = ps[1];
					gray = grayArray[+y * dicomWidth + +x];
					if (!isNaN(gray)) {
						cts.push(gray * slope + intercept);
					}
				}
			}
			var ctObj = Cateyes.MathUtils.measureMeanAndSD(cts);
			var text = [];
			text.push("Min / Max：" + ctObj.min + " / " + ctObj.max);
			text.push("Mean ± SD：" + ctObj.mean + " ± " + ctObj.sd);
			// 面积
			text.push("AREA：" + Cateyes.MathUtils.measureArea(currentDicom.dicomInfo.pixelSpacing[0] * currentDicom.dicomInfo.pixelSpacing[1], cts.length) + "(" + cts.length + " px)");
			return text;
		},
		_points: {
			LT: ['sx', 'sy'],
			RT: ['ex', 'sy'],
			LB: ['sx', 'ey'],
			RB: ['ex', 'ey']
		},
		_focus: function (params, marker) {
			this._isMove = false;
		},
		_blur: function () {},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {}
	}));


	//涂鸦
	MarkFactory.regist('SCRAWL', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0,
			POINT_HALF_WIDTH: 3,
			POINTS: ["LT", "RT", "RB", "LB"],
			POINTS_OFFSET: [-1, -1, 1, -1, 1, 1, -1, 1]
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style;

			var LINE_WIDTH = 2;
			ctx.lineWidth = LINE_WIDTH;
			ctx.strokeStyle = "#00dddb";
			var trace = this.params.trace || (this.params.trace = []);
			trace.splice(trace.length, 0, params.ex, params.ey);
			trace = marker.covertPositionForMark(trace);
			ctx.beginPath();
			ctx.moveTo(trace[0], trace[1]);
			for (var i = 2; i < trace.length; i += 2) {
				ctx.lineTo(trace[i], trace[i + 1]);
			}
			ctx.stroke();
			if (this._finished) {
				this.isCreated(canvas, marker);
			}
		},
		isCreated: function (canvas, marker) {
			canvas.context.stroke();
			this._finished = true;
			return true;
		},
		destory: function () {
			this._finished = false;
			this.params.trace = [];
		},
		_focus: function (params, marker) {
			this._isMove = false;
		},
		_blur: function () {}
	}));

	//箭头标注
	MarkFactory.regist('ARROWS', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				sx = marker.covertPositionForMark(params.sx, 'sx'),
				sy = marker.covertPositionForMark(params.sy, 'sy'),
				ex = marker.covertPositionForMark(params.ex, 'ex'),
				ey = marker.covertPositionForMark(params.ey, 'ey'),
				dx = ex - sx,
				dy = ey - sy,
				rotation = Math["atan2"](dy, dx) + Math["PI"] / 2,
				style = this.style;
			ctx.save();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.NORMAL_LINE_COLOR;
			ctx.beginPath();
			ctx.moveTo(sx, sy);
			ctx.lineTo(ex, ey);
			ctx.fill();
			ctx.stroke();
			ctx.closePath();
			ctx.save();
			ctx.translate(ex, ey);
			ctx.rotate(rotation);
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.beginPath();
			ctx.moveTo(0, 2);
			ctx.lineTo(-2, 4);
			ctx.lineTo(0, 0);
			ctx.lineTo(2, 4);
			ctx.lineTo(0, 2);
			ctx.closePath();
			ctx.stroke();
			ctx.restore();
			ctx.restore();
		},
		_focus: function (params) {
			var tp = this.params;
			return Cateyes.MathUtils.isBetween(params.x, tp.sx, tp.ex) && Cateyes.MathUtils.isBetween(params.y, tp.sy, tp.ey);
		},
		_blur: function () {

		}
	}));


	//文字标注
	MarkFactory.regist('TEXT', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: 0,
			sy: 0,
			ex: 0,
			ey: 0
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				sx = marker.covertPositionForMark(params.sx, 'sx'),
				sy = marker.covertPositionForMark(params.sy, 'sy'),
				style = this.style;
			//text
			this.drawMeasureResult(canvas, {
				x: sx,
				y: sy
			}, marker);
		},
		_getText: function (cvs, marker) {
			return [this.params.text];
		},
		_focus: function (params) {
			var tp = this.params;
			return Cateyes.MathUtils.isBetween(params.x, tp.sx, tp.ex) && Cateyes.MathUtils.isBetween(params.y, tp.sy, tp.ey);
		},
		_blur: function () {

		}
	}));

	//杯盘比
	MarkFactory.regist('CUP_DISC_RATIO', Cateyes.ClassHelper.extend(Mark, function (params) {
		this.setParams(params, true);
	}, {
		defaults: {
			sx: null,
			sy: null,
			ex: null,
			ey: null,
			dsx: null,
			dsy: null,
			dex: null,
			dey: null,
			cupFinish: false,
			discStart: false,
			discFinish: false
		},
		_draw: function (canvas, marker) {
			var ctx = canvas.context,
				params = this.params,
				style = this.style,
				discStart = params.discStart,
				discFinish = params.discFinish,
				cp = marker.covertPositionForMark({
					csx: params.csx,
					csy: params.csy,
					cex: params.cex,
					cey: params.cey,
					dsx: params.dsx,
					dsy: params.dsy,
					dex: params.dex,
					dey: params.dey
				}),
				csx = cp.csx,
				csy = cp.csy,
				cex = cp.cex,
				cey = cp.cey,
				dsx = cp.dsx,
				dsy = cp.dsy,
				dex = cp.dex,
				dey = cp.dey;
			ctx.save();
			// line
			ctx.beginPath();
			ctx.lineWidth = style.NORMAL_LINE_WIDTH;
			ctx.strokeStyle = style.cLineColor;
			ctx.moveTo(csx, csy);
			ctx.lineTo(cex, cey);
			ctx.stroke();
			if (discStart || discFinish) {
				ctx.strokeStyle = style.dLineColor;
				ctx.beginPath();
				ctx.moveTo(dsx, dsy);
				ctx.lineTo(dex, dey);
				ctx.stroke();
				//dashed
				var dashed = {
					ssx: (params.csx + params.cex) / 2,
					ssy: (params.csy + params.cey) / 2,
					sex: (params.dsx + params.dex) / 2,
					sey: (params.dsy + params.dey) / 2
				};
				Object.assign(this.params, dashed);
				var covertDashed = marker.covertPositionForMark(dashed);
				ctx.setLineDash([5, 4]);
				ctx.strokeStyle = style.sLineColor;
				ctx.beginPath();
				ctx.moveTo(covertDashed.ssx, covertDashed.ssy);
				ctx.lineTo(covertDashed.sex, covertDashed.sey);
				ctx.stroke();
				ctx.setLineDash([0, 0]);
			}
			// point
			var points = ["cstart", "cend", "dstart", "dend"];
			for (var i = 0; i < points.length; i++) {
				ctx.strokeStyle = ctx.fillStyle = style[points[i] + "PointColor"];
				ctx.beginPath();
				var x = cp[points[i].substr(0, 2) + "x"],
					y = cp[points[i].substr(0, 2) + "y"];
				ctx.arc(x, y, style.CIRCLE_POINT_RADIUS, 0, Math.PI * 2, true);
				ctx.stroke();
				ctx.beginPath();
				ctx.arc(x, y, 2, 0, Math.PI * 2, true);
				ctx.fill();
				ctx.closePath();
			}
			ctx.strokeStyle = FONT_COLOR;
			if (discStart || discFinish) {
				// text
				this.drawMeasureResult(canvas, {
					x: dex + (dex > dsx ? 15 : -85),
					y: dey + (dey > dsy ? 15 : -45)
				}, marker);
			}
			ctx.restore();
		},
		_getText: function (cvs, marker) {
			var params = this.params;
			var ratio = (Cateyes.MathUtils.measureHypotenuse((params.csx - params.cex), (params.csy - params.cey)) / Cateyes.MathUtils.measureHypotenuse((params.dsx - params.dex), (params.dsy - params.dey))).toFixed(2);
			return [
				[{
					text: '杯',
					color: '#0000FF'
				}, {
					text: '盘',
					color: '#00FF00'
				}, `比:${ratio}`]
			];
			// var params = this.params;
			// var angle = parseInt(Cateyes.MathUtils.getAngle(params.sx, params.sy, params.ex, params.ey, params.ax,
			// 	params.ay));
			// return [(isNaN(angle) ? '0' : angle) + "°"];
		},
		isCreated: function () {
			if (!this.params.discStart) {
				this.params.cupFinish = true;
				if (Cateyes.Mouse.isDowned) {
					this.params.discStart = true;
				}
			} else {
				this.params.discStart = false;
				this.params.discFinish = true;
				return true;
			}
		},
		/**
		 * 激活
		 * @param  {[type]} params [description]
		 * @param  {[type]} marker [description]
		 * @return {[type]}        [description]
		 */
		_focus: function (params, marker) {
			var thisParams = this.params,
				style = this.style,
				cp = marker.covertPositionForMark({
					csx: thisParams.csx,
					csy: thisParams.csy,
					cex: thisParams.cex,
					cey: thisParams.cey,
					dsx: thisParams.dsx,
					dsy: thisParams.dsy,
					dex: thisParams.dex,
					dey: thisParams.dey,
					ssx: thisParams.ssx,
					ssy: thisParams.ssy,
					sex: thisParams.sex,
					sey: thisParams.sey,
					cx: params.x,
					cy: params.y
				});
			if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.csx, cp.csy) <= 10) {
				this._activePoint = 'CSTART';
				style.cstartPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.cex, cp.cey) <= 10) {
				this._activePoint = 'CEND';
				style.cendPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.dsx, cp.dsy) <= 10) {
				this._activePoint = 'DSTART';
				style.dstartPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.getDistance(cp.cx, cp.cy, cp.dex, cp.dey) <= 10) {
				this._activePoint = 'DEND';
				style.dendPointColor = style.ACTIVE_POINT_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.csx, cp.csy, cp.cex, cp.cey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.csx, cp.cex) && Cateyes.MathUtils.isBetween(cp.cy, cp.csy, cp.cey)) {
				this._activePoint = 'CLINE';
				style.cLineColor = style.ACTIVE_LINE_COLOR;
				this._isModify = true;
			} else if (Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.dsx, cp.dsy, cp.dex, cp.dey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.dsx, cp.dex) && Cateyes.MathUtils.isBetween(cp.cy, cp.dsy, cp.dey)) {
				this._activePoint = 'DLINE';
				style.dLineColor = style.ACTIVE_LINE_COLOR;
				this._isModify = true;
			} else {
				this._isMove = (Cateyes.MathUtils.verticalLineLength(cp.cx, cp.cy, cp.ssx, cp.ssy, cp.sex, cp.sey) <= 10 && Cateyes.MathUtils.isBetween(cp.cx, cp.ssx, cp.sex) && Cateyes.MathUtils.isBetween(cp.cy, cp.ssy, cp.sey));
				this._isMove && (style.sLineColor = style.ACTIVE_LINE_COLOR);
			}
		},
		_blur: function () {
			var style = this.style;
			this._activePoint = null;
			style.cstartPointColor = style.cendPointColor = style.dstartPointColor = style.dendPointColor = style.NORMAL_POINT_COLOR;
			style.cLineColor = '#0000FF';
			style.dLineColor = '#00FF00';
			style.sLineColor = '#00dddb';
		},
		/**
		 * 修改
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		_modify: function (params) {
			if (this._activePoint == 'CSTART') {
				this.params.csx = eval(this.params.csx + params._.x);
				this.params.csy = eval(this.params.csy + params._.y);
			} else if (this._activePoint == 'CEND') {
				this.params.cex = eval(this.params.cex + params._.x);
				this.params.cey = eval(this.params.cey + params._.y);
			} else if (this._activePoint == 'DSTART') {
				this.params.dsx = eval(this.params.dsx + params._.x);
				this.params.dsy = eval(this.params.dsy + params._.y);
			} else if (this._activePoint == 'DEND') {
				this.params.dex = eval(this.params.dex + params._.x);
				this.params.dey = eval(this.params.dey + params._.y);
			} else if (this._activePoint == 'CLINE') {
				this.params.csx = eval(this.params.csx + params._.x);
				this.params.csy = eval(this.params.csy + params._.y);
				this.params.cex = eval(this.params.cex + params._.x);
				this.params.cey = eval(this.params.cey + params._.y);
			} else if (this._activePoint == 'DLINE') {
				this.params.dsx = eval(this.params.dsx + params._.x);
				this.params.dsy = eval(this.params.dsy + params._.y);
				this.params.dex = eval(this.params.dex + params._.x);
				this.params.dey = eval(this.params.dey + params._.y);
			}
		}
	}));

})();