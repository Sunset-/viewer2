import WebGLTinter from './tinters/webgl';
/**
 *  阅片器
 *
 *  createTime : 2015-07-20
 *
 *  updateTime : 2015-07-20
 *
 */
(function (window, undefined) {

	var Cateyes = window.Cateyes || (window.Cateyes = {});


	Cateyes.ViewerFactory = {
		map: {},
		list: [],
		/**
		 * 创建
		 * @param  {[type]} el  [description]
		 * @param  {[type]} ops [description]
		 * @return {[type]}     [description]
		 */
		create: function ($el, id) {
			var viewer;
			//if (this.list.length) {
			//viewer = this.list.shift();
			//viewer.init($el, id);
			//} else {
			viewer = new Viewer($el, id);
			this.map[id] = viewer;
			//}
			return viewer;
		},
		/**
		 * 回收
		 * @param  {[type]} viewer [description]
		 * @return {[type]}        [description]
		 */
		recover: function (viewer) {
			if (Cateyes.Utils.isString(viewer)) {
				viewer = this.get(viewer);
			}
			viewer.close();
			this.list.push(viewer);
		},
		/**
		 * 获取
		 * @param  {[type]} id [description]
		 * @return {[type]}    [description]
		 */
		get: function (id) {
			return this.map[id];
		}
	}

	/**
	 * Dicom浏览器
	 */
	var Viewer = Cateyes.Viewer = function ($el, id) {
		this.init($el, id);
		this.canvas = {};
	}
	var plugins = Cateyes.getPlat() == 'PHONE' ? ['QuadrangleInfo', 'Loading'] : ['QuadrangleInfo', 'FullScreen', 'SwipeControl', 'Loading'];
	if (Cateyes.isPad()) {
		plugins.push('SwipeControl');
		plugins.push('PositionLine');
	}
	Cateyes.ClassHelper.extend(Cateyes.PubSub, Viewer, {
		BASE_PLUGINS: plugins,
		/**
		 * 初始化
		 * @return {[type]} [description]
		 */
		init: function ($el, id) {
			this.id = id;
			this._initDom($el);
			this._initEvents();
			this._initTinter();
			this._initPositioner();
			this._initMarker();
			this._initPlayer();
			this.initPlugins();
			this.inited = true;
		},
		getViewerId: function () {
			return this.id;
		},
		/**
		 * 初始化结构
		 */
		_initDom: function ($el) {
			var self = this;
			this.$container = $el.addClass("cateyes-viewer").data("cateyes-viewer-id", this.id);
			this.$container.parent().on(Cateyes.EVENTS.MOUSE_DOWN, function () {
				self.active();
			});
			//初始化头部
			var $header = this.$header = $('<div class="cateyes-viewer-header"></div>').insertBefore(this.$container);
		},
		/**
		 * 初始化事件
		 */
		_initEvents: function () {

		},
		getContainer: function () {
			return this.$container;
		},
		/**
		 * 变更画布尺寸
		 * @param  {[type]} width  [description]
		 * @param  {[type]} height [description]
		 * @return {[type]}        [description]
		 */
		changeWrapSize: function (width, height) {
			for (var witch in this.canvas) {
				if (this.canvas.hasOwnProperty(witch)) {
					this.canvas[witch].width = width;
					this.canvas[witch].height = height;
				}
			}
		},
		/**
		 * 获取画布
		 * @param  {[type]} type    画布标识
		 * @param  {[type]} zIndex  层级
		 * @param  {[type]} refresh 尺寸刷新回调
		 * @return {[type]}         [description]
		 */
		getCanvas: function (type, zIndex, refresh, inited) {
			type = type || 'DICOM';
			var $container = this.getContainer();
			if (this.canvas[type]) {
				return this.canvas[type];
			} else {
				var $cvs = $('<canvas class="' + type + '"></canvas>').appendTo($container).css({
						'position': 'absolute',
						'top': '50%',
						'bottom': '0px',
						'left': '50%',
						'right': '0px',
						'z-index': zIndex || 0
					}),
					self = this;
				var cvs = this.canvas[type] = $cvs[0];
				cvs.$el = $cvs;
				if (type == 'DICOM') {
					cvs.WebGLTinter = new WebGLTinter(cvs);
					cvs.type = "WEBGL";
					$cvs.attr('data-type', cvs.type);
				}
				try {
					cvs.context = cvs.getContext('2d');
				} catch (e) {
					console.log('2d canvas error');
				}
				cvs._center = function () {
					cvs.$el.css({
						'margin-top': (-cvs.height) / 2 + 'px',
						'margin-left': (-cvs.width) / 2 + 'px'
					});
				}
				if (refresh) {
					refresh.call(cvs, self);
					this.subscribe(Cateyes.CustomEvents.ON_DICOM_CANVAS_RESIZE, function (series) {
						refresh.call(cvs, self);
					});
				}
				if (inited) {
					inited.call(cvs, self);
				};
				return cvs;
			}
		},
		destroyCanvas(type) {
			if (this.canvas[type]) {
				$('.' + type, this.getContainer()).remove();
				delete this.canvas[type];
			}
		},
		/**
		 * 绑定序列
		 * @param {[type]} series [description]
		 */
		setSeries: function (series, silent) {
			this._series = series;
			this.destroyCanvas('DICOM');
			this.publish('AFTER_BIND_SERIES', series);
			silent || this.synchronizeCloud();
			this.render();
			return this;
		},
		/**
		 * 获取序列
		 * @return {[type]} [description]
		 */
		getSeries: function () {
			return this._series;
		},
		/**
		 * 获取DICOM迭代器
		 * @return {[type]} [description]
		 */
		getDicomIterator: function () {
			return this._dicomIterator;
		},
		/**
		 * 着色器
		 * @type {Array}
		 */
		tinter: null,
		getTinter: function () {
			if (this.tinter) {
				return this.tinter;
			} else {
				return this._initTinter();
			}
		},
		_initTinter: function () {
			if (!this.tinter) {
				this.tinter = Cateyes.TinterFactory.create('WINDOW', this);
			} else {
				this.tinter.reset();
			}
			return this.tinter;
		},
		/**
		 * 定位器
		 */
		positioner: null,
		_initPositioner: function () {
			if (!this.positioner) {
				this.positioner = new Cateyes.Positioner(this);
			} else {
				this.positioner.refresh();
			}
		},
		/**
		 * 标注器
		 */
		marker: null,
		_initMarker: function () {
			if (!this.marker) {
				this.marker = new Cateyes.Marker(this);
			} else {
				this.marker.refresh();
			}
		},
		/**
		 * 播放器
		 */
		player: null,
		getPlayer: function () {
			if (this.player) {
				return this.player;
			} else {
				return this._initPlayer();
			}
		},
		_initPlayer: function () {
			if (!this.player) {
				this.player = new Cateyes.Player(this);
			} else {
				this.player.init();
			}
			return this.player;
		},
		/**
		 * 初始化基础插件
		 * @return {[type]} [description]
		 */
		initPlugins: function () {
			var ps = this.PLUGINS = (this.PLUGINS || Cateyes.Utils.copy(this.BASE_PLUGINS));
			for (var i = 0, p; p = ps[i++];) {
				this._initPlugins(p);
			}
		},
		/**
		 * 获取插件
		 * @param  {[type]} pluginType [description]
		 * @return {[type]}            [description]
		 */
		getPlugins: function (pluginType) {
			return this._initPlugins(pluginType);
		},
		/**
		 * 初始化插件
		 */
		_initPlugins: function (pluginType) {
			this.plugins = this.plugins || {};
			if (!this.plugins[pluginType]) {
				this.plugins[pluginType] = Cateyes.PluginFactory.create(pluginType, this);
			}
			return this.plugins[pluginType];
		},
		/**
		 * 渲染
		 * @param  {array} series    dicom序列
		 * @return {[type]}           [description]
		 */
		render: function (silint) {
			this._series && this.publish('BEFORE_RENDER_DICOM', {
				dicomProxy: this.player.getCurrentDicom(),
				silint: silint
			});
		},
		/**
		 * 移动
		 * @param  {[type]} ops [description]
		 * @return {[type]}     [description]
		 */
		transform: function (ops) {
			this.positioner.refresh(ops);
		},
		reset: function (reTinter) {
			this.positioner.center();
			this.player.refreshMarkFragment();
			reTinter && this.tinter.reset();
		},
		/**
		 * 快照
		 * @return {[type]} [description]
		 */
		timer: null,
		snapshoot: function () {
			var self = this;
			this.player.getCurrentDicom().then(function (dicom) {
				self.tinter.tint(self.getCanvas('DICOM'), dicom, true, true);
				SnapshootCreate(self.getCanvas('DICOM'), self.getCanvas('MARK'), self.marker, self.player.getCurrentDicom().marks, self.getSeries());
			});
		},
		/**
		 * 获取快照Base64
		 * @return {[type]} [description]
		 */
		getSnapshootBase64: function () {

		},
		/**
		 * 执行指令
		 * @return {[type]} [是否阻塞后续事件]
		 */
		executeCommond: function (cmd) {
			return cmd && cmd.execute(this);
		},
		/**
		 * 激活
		 * @return {[type]} [description]
		 */
		active: function () {
			Cateyes.ViewerManager.setCurrentViewer(this);
			this.publish('ON_VIEWER_ACTIVE');
			Cateyes.GlobalPubSub.publish('ON_VIEWER_ACTIVE', {
				viewerId: this.id
			});
			return this;
		},
		/**
		 * 关闭
		 * @return {[type]} [description]
		 */
		close: function () {
			//this.setSeries(null);
		},
		/**
		 * 标记关键影像
		 */
		keyImage: function () {
			var keyImageMarker = this.getPlugins('KeyImageMarker');
			if (keyImageMarker) {
				keyImageMarker.toggle();
			}
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
			var json = {},
				series = this.getSeries();
			json['VIEWER_' + this.id] = JSON.stringify({
				studyId: series.study.studyInfo.studyInstanceUID,
				seriesId: series.info.seriesInstanceUID
			});
			return json;
		},
		getFullJson: function () {
			var json = this.getJson();
			$.extend(json, this.tinter.getJson(), this.positioner.getJson(), this.player.getJson());
			return json;
		},
		setJson: function (json) {
			var params = JSON.parse(json);
			var series = Cateyes.DicomService.getSeries(params.studyId, params.seriesId);
			if (series) {
				var self = this;
				series.then(function (s) {
					self.setSeries(s, true);
				})
			}
		}
	});

	/**
	 * 快照生成器
	 */
	var SnapshootCreate = (function () {
		var cvs = document.createElement('canvas');
		cvs.context = cvs.getContext('2d');
		cvs.style.display = 'none';
		var $snapshootBox = $('<div class="cateyes-snapshoot-box"><img/><div style="text-align:center;" class="cateyes-snapshoot-tools"><button style="display:none;" class="button" value="插入报告" type="button" style="font-size:16px;">插入报告</button><a title="快照" download="影像快照.png"  style="font-size:16px;"><button>下载照片</button></a></div></div>').hide().appendTo($('body')),
			$button = $('.button', $snapshootBox),
			$input = $('input', $input),
			$img = $('img', $snapshootBox),
			$link = $('a', $snapshootBox);
		var cpb;
		try {
			cpb = window.parent.window.CateyesPubSub

		} catch (e) {
			cpb = window.CateyesPubSub
		}

		$snapshootBox.on(Cateyes.EVENTS.CLICK, function () {
			setTimeout(function () {
				$snapshootBox.hide();
			}, 0)
		});
		return function (dicomCanvas, markCanvas, marker, marks, Series) {
			let type = Series.info.seriesDescription

			if (type !== 'OS') {
				type = 'OD'
			}
			//1.绘制dicom
			cvs.width = markCanvas.width;
			cvs.height = markCanvas.height;
			cvs.context.save();
			cvs.context.scale(markCanvas.width / dicomCanvas.width, markCanvas.height / dicomCanvas.height);
			let canvas;
			// if (false&&dicomCanvas.type == 'WEBGL') {
			// 	canvas = dicomCanvas.ST.changeToCanvas(function (canvas) {
			// 		cvs.context.drawImage(canvas, 0, 0);
			// 		//2.绘制标注
			// 		cvs.context.restore();
			// 		cvs.context.drawImage(markCanvas, 0, 0);
			// 		//3.显示快照
			// 		var data = cvs.toDataURL("image/png");
			// 		$img.attr('src', data);
			// 		$link.attr('href', data);
			// 		$snapshootBox.show();
			// 		$button.off('click');
			// 		$button.click(function () {
			// 			cpb.trigger('SNAPSHOOT_SELECT', {
			// 				image: data,
			// 				type: type
			// 			});
			// 		})
			// 	});
			// } else {
				canvas = dicomCanvas;
				cvs.context.drawImage(canvas, 0, 0);

				//2.绘制标注
				cvs.context.restore();
				cvs.context.drawImage(markCanvas, 0, 0);
				//3.显示快照
				var data = cvs.toDataURL("image/png");
				$img.attr('src', data);
				$link.attr('href', data);
				$snapshootBox.show();
				$button.off('click');
				$button.click(function () {
					cpb.trigger('SNAPSHOOT_SELECT', {
						image: data,
						type: type
					});
				});
				//Cateyes.GlobalPubSub.publish('AFTER_MARK_CREATED', mark);
			// }
		}
	})();

})(window);