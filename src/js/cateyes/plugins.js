/**
 * 插件管理器
 */
(function () {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 * 插件工厂
	 * @type {[type]}
	 */
	var PluginFactory = Cateyes.PluginFactory = {
		TYPES: {},
		regist: function (type, constructor) {
			constructor.prototype.TYPE = type;
			return this.TYPES[type] = constructor;
		},
		create: function (type, viewer, params) {
			if (this.TYPES[type]) {
				return new this.TYPES[type](viewer, params);
			}
		}
	};

	/**
	 * 插件基类
	 */
	var Plugin = function () {

	};
	Plugin.prototype = {
		init: function (viewer) {
			this.viewer = viewer;
			this.initDom(this.viewer);
		},
		show: function () {
			throw new Error('show 方法未在子类中实现');
		},
		hide: function () {
			throw new Error('hide 方法未在子类中实现');
		}
	};
	Plugin.prototype.constructor = Plugin;



	/**
	 * 四角信息插件
	 */
	var HIDE_PATIENT_INFO = !(Cateyes.getQueryString('show') == 'true');
	var QuadrangleInfoConfig = {
		PC: {
			LT: [{
					display: "姓名",
					name: "patientName",
					prop: "{{_series.study.info.patientName}}",
					level: "SERIES"
				}, {
					display: "IM",
					name: "instanceNumber",
					prop: "IM：<<{{player.state.index}}+1>> / {{player.state.total}}",
					level: "DICOM"
				}, {
					display: "SE",
					name: "seriesNumber",
					prop: "SE：{{_series.info.seriesName}}",
					level: "SERIES"
				}, {
					display: "性别",
					name: "patientSex",
					prop: "<<{'0':'男','1':'女','2':'未知'}[{{_series.info.studyInfo.sex}}]>>",
					level: "SERIES"
				}, {
					display: "年龄",
					name: "patientAge",
					prop: "{{_series.study.info.patientAge}}",
					level: "SERIES"
				},{
					display: "检查日期",
					name: "studyDate",
					prop: "<<Cateyes.Utils.formatDate({{_series.study.info.studyDate}},'yyyy-MM-dd')>>",
					level: "SERIES"
				}, {
					display: "序列描述",
					name: "seriesDescription",
					prop: "{{_series.study.info.deviceType}}",
					level: "SERIES"
				}, {
					display: "患者编号",
					name: "patientNo",
					prop: "患者编号:{{_series.info.studyInfo.patientId}}",
					level: "SERIES",
					isHide: HIDE_PATIENT_INFO
				}
			],
			RT: [],
			LB: [{
				display: "",
				name: "scale",
				prop: "ZOOM：<<Math.floor({{positioner.state.scale}}*100)>>%&nbsp;&nbsp;&nbsp;<<{{positioner.state.rotate}}%360?('ANGLE：'+({{positioner.state.rotate}}%360<0?({{positioner.state.rotate}}%360+360):{{positioner.state.rotate}}%360)):''>>",
				level: "RENDER"
			}],
			RB: []
		},
		PHONE: {
			LT: [
				//{
				//		display: "SE",
				//		name: "seriesNumber",
				//		prop: "SE：{{_series.info.seriesNumber}}",
				//		level: "SERIES"
				//	},  {
				// 		display: "姓名",
				// 		name: "patientName",
				// 		prop: "* * *", //{{_series.info.studyInfo.name}}
				// 		level: "SERIES"
				// 	}, 
				{
					display: "性别",
					name: "patientSex",
					prop: "<<{'0':'男','1':'女','2':'未知'}[{{_series.info.studyInfo.sex}}]>>",
					level: "SERIES"
				}, {
					display: "年龄",
					name: "patientAge",
					prop: "AGE:{{_series.info.studyInfo.age}}",
					level: "SERIES"
				},
				// {
				// 	display: "身高",
				// 	name: "patientSize",
				// 	prop: "HEGHT:{{_series.info.studyInfo.height}}",
				// 	level: "SERIES"
				// }, {
				// 	display: "体重",
				// 	name: "patientWeight",
				// 	prop: "WEIGHT:{{_series.info.studyInfo.weight}}",
				// 	level: "SERIES"
				// },
				{
					display: "检查描述",
					name: "studyDescription",
					prop: "{{_series.info.studyInfo.studyDescription}}",
					level: "SERIES"
				}, {
					display: "序列描述",
					name: "seriesDescription",
					prop: "{{_series.info.seriesDescription}}",
					level: "SERIES"
				}, {
					display: "设备类型",
					name: "modality",
					prop: "{{_series.info.deviceType}}",
					level: "SERIES"
				}, {
					display: "检查日期",
					name: "studyDate",
					prop: "<<new Date('{{_series.info.seriesDate}}').format('yyyy-MM-dd')>>",
					level: "SERIES"
				}
			],
			RT: [],
			LB: [{
				display: "",
				name: "scale",
				prop: "ZOOM：<<Math.floor({{positioner.state.scale}}*100)>>%&nbsp;&nbsp;&nbsp;<<{{positioner.state.rotate}}%360?('ANGLE：'+({{positioner.state.rotate}}%360<0?({{positioner.state.rotate}}%360+360):{{positioner.state.rotate}}%360)):''>>",
				level: "RENDER"
			}, {
				display: "",
				name: "window",
				prop: "WW：{{tinter.state.windowWidth}} WC：{{tinter.state.windowCenter}}",
				level: "RENDER"
			}, {
				display: "",
				name: "sliceLocation",
				prop: "T: <<(+{{_series.info.sliceThickness}}).toFixed(1)>> mm", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}, {
				display: "KVP",
				name: "KVP",
				prop: "KVP: <<{{_series.info.extensions.KVP}}>>", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}, {
				display: "",
				name: "XRayTubeCurrent",
				prop: "XRayTubeCurrent: <<{{_series.info.extensions.XRayTubeCurrent}}>>", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}, {
				display: "",
				name: "SeriesDescription",
				prop: "SeriesDescription: <<{{_series.info.extensions.SeriesDescription}}>>", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}, {
				display: "",
				name: "RepetitionTime",
				prop: "RepetitionTime: <<{{_series.info.extensions.RepetitionTime}}>>", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}, {
				display: "",
				name: "EchoTime",
				prop: "EchoTime: <<{{_series.info.extensions.EchoTime}}>>", // L：<<(+{{player.dicomIterator.getCurrent.info.sliceLocation}}).toFixed(1)>> mm
				level: "DICOM"
			}],
			RB: [],
			MINI: [{
				display: "WW",
				name: "WW",
				prop: "WW:{{tinter.state.windowWidth}}",
				level: "RENDER"
			}, {
				display: "WC",
				name: "WC",
				prop: "WC:{{tinter.state.windowCenter}}",
				level: "RENDER"
			}],
			TOP: [{
				display: "IM",
				name: "instanceNumber",
				prop: "<<{{player.state.index}}+1>> / {{player.state.total}}",
				level: "DICOM"
			}]
		}
	}
	PluginFactory.regist('QuadrangleInfo', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		QUADRANGLE_INFO: QuadrangleInfoConfig[Cateyes.getPlat()],
		css: {
			LT: {
				'left': '0px',
				'top': '0px'
			},
			RT: {
				'right': '0px',
				'top': '0px',
				'text-align': 'right'
			},
			LB: {
				'left': '0px',
				'bottom': Cateyes.getPlat() == 'PHONE' ? '25px' : '0px'
			},
			RB: {
				'right': '0px',
				'bottom': '0px',
				'text-align': 'right'
			},
			MINI: {
				'left': '0px',
				'top': '5px',
				'text-align': 'left'
			},
			TOP: {
				'left': '50%',
				'top': '5px',
				'text-align': 'left',
				'font-size': '18px',
				'margin-left': '-40px',
				'text-align': 'center',
				'width': '80px'
			}
		},
		init: function (viewer) {
			this.viewer = viewer;
			this.initDom();
			this.initEvent();
			this[this.state.isShow ? 'show' : 'hide']();
			this.inited = true;
		},
		initDom: function (viewer) {
			var viewer = this.viewer,
				$container = viewer.getContainer(),
				self = this;
			var cache = this.cache = {};
			for (var k in this.QUADRANGLE_INFO) {
				$container.append(this._generate(this.QUADRANGLE_INFO[k], k).addClass('cateyes-plugin-quadrangleinfo').css(this.css[k]));
			}
			//cache
			for (var k in this.QUADRANGLE_INFO) {
				for (var i = 0, t; t = this.QUADRANGLE_INFO[k][i++];) {
					cache[t.level] = cache[t.level] || [];
					cache[t.level].push($(".cateyes-plugin-quadrangle-" + t.name, $container).data('prop', t.prop));
				}
			}
		},
		initEvent: function () {
			if (!this.inited) {
				var self = this;
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function () {
					self.refreshInfo('SERIES');
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, function () {
					self.refreshInfo('DICOM');
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM_SILIENT, function () {
					self.refreshInfo('DICOM');
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_RENDER_DICOM, function () {
					self.refreshInfo('RENDER');
				});
				this.viewer.subscribe(Cateyes.CustomEvents.ON_DICOM_CANVAS_RESIZE, function () {
					self.refreshInfo('RENDER');
				});
			}
		},
		_generate: function (items, pos) {
			var html = ['<ul class="cateyes-plugin-quadrangle-ul cateyes-plugin-quadrangle-' + pos + '">'];
			for (var i = 0, item; item = items[i++];) {
				if (item.isHide) {
					continue;
				}
				html.push('<li><span class="cateyes-plugin-quadrangle cateyes-plugin-quadrangle-' + item.name + '">' + this._getValue(item.prop) + '</span></li>');
			}
			html.push('</ul>');
			return $(html.join(''));
		},
		_getValue: function (prop) {
			var viewer = this.viewer;
			if (!prop || !viewer.getSeries()) {
				return '';
			} else {
				try {
					var val = prop.replace(/\{\{.*?\}\}/g, function (a, b, c) {
						var attr = a.substring(2, a.length - 2);
						var v = Cateyes.Utils.getAttribute(viewer, attr);
						return v == void 0 ? '' : v;
					});
					val = val.replace(/\<\<.*?\>\>/g, function (a, b, c) {
						var attr = a.substring(2, a.length - 2);
						return eval('(' + attr + ')');
					});
					return val;
				} catch (e) {
					return '';
				}
			}
		},
		refreshInfo: function (level) {
			if (this.viewer && this.viewer.getSeries()) {
				var items = this.cache[level];
				if (items && items.length) {
					for (var i = 0, t; t = items[i++];) {
						t.html(this._getValue(t.data('prop')));
					}
				}
			}
		},
		state: {
			isShow: true //(Cateyes.getPlat() != 'PHONE')
		},
		show: function () {
			$('.cateyes-plugin-quadrangle-ul', this.viewer.getContainer()).show();
			$('.cateyes-plugin-quadrangle-MINI', this.viewer.getContainer()).hide();
			$('.cateyes-plugin-quadrangle-TOP', this.viewer.getContainer()).show();
		},
		hide: function () {
			$('.cateyes-plugin-quadrangle-ul', this.viewer.getContainer()).hide();
			$('.cateyes-plugin-quadrangle-MINI', this.viewer.getContainer()).show();
			$('.cateyes-plugin-quadrangle-TOP', this.viewer.getContainer()).show();
		},
		toggleShow: function () {
			$('.cateyes-plugin-quadrangle-ul', this.viewer.getContainer)[(this.state.isShow = !this.state.isShow) ? 'show' : 'hide']();
			$('.cateyes-plugin-quadrangle-MINI', this.viewer.getContainer())[this.state.isShow ? 'hide' : 'show']();
			$('.cateyes-plugin-quadrangle-TOP', this.viewer.getContainer()).show();
		}
	}));


	/**
	 * 播放控制插件
	 */
	PluginFactory.regist('PlayControl', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer, params) {
			this.viewer = viewer;
			this.player = viewer.player;
			this._initDom();
			this._initEvent();
			//this[this.player.isPlaying() ? 'show' : 'hide']();
		},
		DOM: [
			'<ul class="cateyes-plugin-playcontrol">',
			'	<li><i title="第一张" class="icon-step-backward"></i></li>',
			'	<li><i title="减速" class="icon-backward"></i></li>',
			'	<li><i title="暂停" class="icon-play play-trigger"></i></li>',
			'	<li><i title="加速" class="icon-forward"></i></li>',
			'	<li><i title="最后一张" class="icon-step-forward"></i></li>',
			'	<li class="cateyes-plugin-playcontrol-fps">FPS:<span class="fps">0</span></li>',
			'</ul>'
		].join(''),
		_initDom: function () {
			var $container = this.viewer.getContainer();
			$container.append(this.$control = $(this.DOM));
			this.$fps = $('.fps', this.$control);
		},
		_initEvent: function () {
			var self = this;
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_PLAY_OR_STOP, function () {
				self[self.player.isPlaying() ? 'show' : 'hide']();
			});
			this.$control.on(Cateyes.EVENTS.MOUSE_DOWN, 'i', function () {
				var $this = $(this),
					player = self.player;
				if ($this.hasClass('icon-step-backward')) {
					player.jump(0);
				} else if ($this.hasClass('icon-backward')) {
					player.state.fps > 1 && (player.state.fps--);
					self.refreshFps();
				} else if ($this.hasClass('icon-play')) {
					player.play();
					$this.removeClass('icon-play').addClass('icon-pause').attr('title', '暂停');
				} else if ($this.hasClass('icon-pause')) {
					player.pause();
					$this.addClass('icon-play').removeClass('icon-pause').attr('title', '播放');
				} else if ($this.hasClass('icon-forward')) {
					player.state.fps < 99 && (player.state.fps++);
					self.refreshFps();
				} else if ($this.hasClass('icon-step-forward')) {
					player.jump(-1);
				}
				return false;
			});
			this.$control.on(Cateyes.EVENTS.CLICK, function () {
				return false;
			});
			this.$control.on('dblclick', function () {
				return false;
			});
		},
		refreshFps: function () {
			this.player._play();
			this.$fps.html(this.player.state.fps || 0);
		},
		show: function () {
			var self = this;
			setTimeout(function () {
				self.$control.addClass('show');
				$('.play-trigger', self.$control).removeClass('icon-play').addClass('icon-pause').attr('title', '暂停');
				self.refreshFps();
			}, 0);
		},
		hide: function () {
			this.$control.removeClass('show');
		}
	}));

	/**
	 * 浏览控制插件
	 */
	PluginFactory.regist('SwipeControl', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer, params) {
			this.viewer = viewer;
			this.player = viewer.player;
			this._initDom();
			this._initEvent();
			//this[this.player.isPlaying() ? 'show' : 'hide']();
		},
		DOM: [
			'<ul class="cateyes-plugin-swipecontrol">',
			'<li class="swipecontrol-prev icon icon-chevron-left"></li>',
			'<li class="swipecontrol-next icon icon-chevron-right"></li></ul>'
		].join(''),
		_initDom: function () {
			var $container = this.viewer.getContainer();
			$container.append(this.$control = $(this.DOM));
		},
		_initEvent: function () {
			var self = this;
			this.$control.on(Cateyes.EVENTS.MOUSE_DOWN, 'li', function () {
				var $this = $(this),
					player = self.player;
				if ($this.hasClass('swipecontrol-prev')) {
					player.prev();
				} else if ($this.hasClass('swipecontrol-next')) {
					player.next();
				}
				return false;
			});
		},
		show: function () {
			var self = this;
			setTimeout(function () {
				self.$control.addClass('show');
				$('.play-trigger', self.$control).removeClass('icon-play').addClass('icon-pause').attr('title', '暂停');
				self.refreshFps();
			}, 0);
		},
		hide: function () {
			this.$control.removeClass('show');
		}
	}));

	/**
	 * 关键影像标记插件
	 */
	PluginFactory.regist('KeyImageMarker', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		MARK_MAX: 100,
		state: {
			isOn: false
		},
		markCache: {
			image: {},
			count: {
				total: 0
			}
		},
		markDom: {
			showCount: 0
		},
		markers: [],
		init: function (viewer, params) {
			this.viewer = viewer;
			this.player = viewer.player;
			this._initDom();
			this._initEvent();
			this._initPrototype();
			this.start = null;
			this.startIndex = null;
			this.end = null;
			this.endIndex = null;
			this.markers.push(this);
		},
		_initPrototype: function () {
			if (!this.state.initedPrototype) {
				this.state.initedPrototype = true;
				var cpb;
				if (cpb = window.parent.window.CateyesPubSub) {
					var self = this;
					if (cpb.getKeyImageMax) {
						var max = cpb.getKeyImageMax();
						if (max) {
							this.MARK_MAX = max;
						}
					}
					cpb.loadKeyImage && cpb.loadKeyImage().then(function (data) {
						if (data) {
							$.extend(self.markCache, JSON.parse(data));
							self.refreshKeyImageFragment();
							self._refreshTotalDom();
						}
					});
				}
			}
		},
		DOM: [
			'<ul class="cateyes-plugin-keyimage">',
			'	<li title="标记单张" class="icon-keyimage-single"><i class="icon-keyimage"></i></li>',
			'	<i class="keyimage-line"></i>',
			'	<li title="标记区间开始" class="icon-keyimage-rangestart"><i class="icon-keyimage"></i></li>',
			'	<i class="keyimage-line"></i>',
			'	<li title="标记区间结束" class="icon-keyimage-rangeend"><i class="icon-keyimage"></i></li>',
			'	<i class="keyimage-line"></i>',
			'	<li title="关闭" class="icon-keyimage-close"><i class="icon-keyimage"></i></li>',
			'	<div class="keyimage-max-tip">已超过 <b></b> 张（上限：MARK_MAX）</div>',
			'</ul>'
		].join(''),
		_initDom: function () {
			var $container = this.viewer.getContainer();
			$container.append(this.$control = $(this.DOM.replace('MARK_MAX', this.MARK_MAX)));
			this.$single = $('.icon-keyimage-single .icon-keyimage', this.$control);
			this.$start = $('.icon-keyimage-rangestart .icon-keyimage', this.$control);
			this.$end = $('.icon-keyimage-rangeend .icon-keyimage', this.$control);
			this.$close = $('.icon-keyimage-close .icon-keyimage', this.$control);
			this.$tip = $('.keyimage-max-tip', this.$control);
			this.$tipB = $('.keyimage-max-tip b', this.$control);
		},
		_initEvent: function () {
			var self = this;
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function () {
				self.refreshKeyImageFragment();
				self.show();
			});
			this.viewer.subscribe(Cateyes.CustomEvents.ON_VIEWER_ACTIVE, function () {
				self.show();
			});
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, function () {
				self.refresh();
			});
			this.$control.on(Cateyes.EVENTS.MOUSE_DOWN, 'li', function () {
				var $this = $(this);
				if ($this.hasClass('icon-keyimage-single')) {
					self.mark('SINGLE');
				} else if ($this.hasClass('icon-keyimage-rangestart')) {
					self.mark('START');
				} else if ($this.hasClass('icon-keyimage-rangeend')) {
					self.mark('END');
				} else if ($this.hasClass('icon-keyimage-close')) {
					self.toggle();
				}
				return false;
			});
			this.$control.on(Cateyes.EVENTS.CLICK, function () {
				return false;
			});
			this.$control.on('dblclick', function () {
				return false;
			});
		},
		mark: function (type) {
			var seriesNumber = this.viewer.getSeries().info.seriesNumber,
				id = this.player.getCurrentDicom().info.id,
				cache = this.getMarkCache(seriesNumber);
			if (seriesNumber != void 0 && id != void 0) {
				switch (type) {
					case 'SINGLE':
						if (cache[id]) {
							delete cache[id];
							this.refreshTotal(seriesNumber, -1);
						} else {
							if (this.canAddMark(1)) {
								cache[id] = true;
								this.refreshTotal(seriesNumber, 1);
							}
						}
						break;
					case 'START':
						if (this.$start.hasClass('active')) {
							this.start = null;
							this.startIndex = null;
							this.clearKeyingImageFragment();
						} else {
							this.start = id;
							this.startIndex = this.player.getIndex();
							this.startTime = new Date().getTime();
						}
						break;
					case 'END':
						if (this.$end.hasClass('active')) {
							this.end = null;
							this.endIndex = null;
							this.clearKeyingImageFragment();
						} else {
							this.end = id;
							this.endIndex = this.player.getIndex();
							this.endTime = new Date().getTime();
						}
						break;
				}
				this.refresh();
				this.refreshKeyImageFragment();
			}
		},
		/**
		 * 能否添加标记
		 * @param  {[type]} num [description]
		 * @return {[type]}     [description]
		 */
		canAddMark: function (num) {
			if (num + this.markCache.count.total > this.MARK_MAX) {
				this.$tipB.html(num + this.markCache.count.total - this.MARK_MAX);
				this.$tip.addClass('show');
				var self = this;
				if (this.markDom.__tipTimer) {
					clearTimeout(this.markDom.__tipTimer);
				}
				this.markDom.__tipTimer = setTimeout(function () {
					self.$tip.removeClass('show');
				}, 3000)
				return false;
			}
			return true;
		},
		refresh: function (silent) {
			if (!this.viewer.getSeries()) {
				return;
			}
			var seriesNumber = this.viewer.getSeries().info.seriesNumber,
				cache = this.getMarkCache(seriesNumber);
			//区间是否完成
			var start = this.start,
				end = this.end;
			if (start && end) {
				var frames = this.viewer.getSeries().frames,
					startFlag = false,
					endFlag = false,
					ids = [];
				if (this.startIndex > this.endIndex) {
					end = [start, start = end][0];
				}
				for (var i = 0, item; item = frames[i++];) {
					if (start == item.info.id) {
						startFlag = true;
					}
					if (startFlag) {
						if (!cache[item.info.id]) {
							ids.push(item.info.id);
						}
						if (end == item.info.id) {
							endFlag = true;
							break;
						}
					}
				}
				if (this.canAddMark(ids.length)) {
					for (var i = 0, id; id = ids[i++];) {
						cache[id] = true;
					}
					this.start = this.end = null;
					this.startIndex = this.endIndex = null;
					this.$single.addClass('active');
					this.$start.removeClass('active');
					this.$end.removeClass('active');
					this.clearKeyingImageFragment();
					this.refreshTotal(seriesNumber, ids.length);
				} else {
					if (this.startTime < this.endTime) {
						this.end = null;
					} else {
						this.start = this.startIndex = null;

					}
				}
			} else if (start || end) {
				this.refreshKeyingImageFragment();
			}
			//当前影像是否激活
			this.$single[(cache[this.player.getCurrentDicom().info.id]) ? 'addClass' : 'removeClass']('active');
			this.$start[(this.start) ? 'addClass' : 'removeClass']('active');
			this.$end[(this.end) ? 'addClass' : 'removeClass']('active');
			if (!silent) {
				var markers = this.markers;
				for (var i = 0, m; m = markers[i++];) {
					if (m != this) {
						m.refresh(true);
					}
				}
			}
		},
		removeKeyImage: function (which) {
			var cache = this.getMarkCache();
			if (which == 'ALL') {
				cache.image = {};
				cache.count = {
					total: 0
				};
			} else {
				delete cache.image[which];
				cache.count.total -= cache.count[which];
				delete cache.count[which];
			}
			this.refresh();
			this.refreshKeyImageFragment();
			this._refreshTotalDom();
			this.refreshBusiness();
		},
		show: function () {
			var self = this,
				markBox = self.getMarkBox();
			if (this.state.isOn && !this.$control.hasClass('show')) {
				var state = this.state;
				state.marker && state.marker.hide();
				if (this.viewer.getSeries()) {
					state.marker = this;
					setTimeout(function () {
						self.$control.addClass('show');
						markBox.element.addClass('show');
						markBox.showCount++;
					}, 0);
				}
			}
		},
		hide: function () {
			if (this.$control.hasClass('show')) {
				this.$control.removeClass('show');
				if ((--this.getMarkBox().showCount) == 0) {
					this.getMarkBox().element.removeClass('show');
				}
				this.start = this.end = null;
				this.startIndex = this.endIndex = null;
				this.refresh();
				this.clearKeyingImageFragment();
			}
		},
		toggle: function () {
			var state = this.state;
			state.isOn = !state.isOn;
			if (state.isOn) {
				this.show();
			} else {
				state.marker && state.marker.hide();
			}
			(state.$icon || (state.$icon = $('.nav-icon.nav-icon-keyimage')))[state.isOn ? 'addClass' : 'removeClass']('active');
		},
		getMarkCache: function (seriesNumber) {
			if (arguments.length == 0) {
				return this.markCache;
			} else {
				return this.markCache.image[seriesNumber] = this.markCache.image[seriesNumber] || {};
			}
		},
		/**
		 * 刷新关键影像标记
		 * @return {[type]} [description]
		 */
		refreshKeyImageFragment: function (silent) {
			if (!this.viewer.getSeries()) {
				return;
			}
			var $progress = this._$ImageFragmentProgress || (this._$ImageFragmentProgress = $('<div class="cateyes-keyimage-progress"></div>').appendTo(this.player.getProgressBar()))
			var series = this.viewer.getSeries(),
				cache = this.getMarkCache(series.info.seriesNumber);
			$progress.empty();
			if (series) {
				var dicoms = series.frames;
				if (dicoms && dicoms.length) {
					var w = 100 / dicoms.length;
					for (var i = 0, item; item = dicoms[i]; i++) {
						if (cache[item.info.id]) {
							$('<div></div>').css({
								position: 'absolute',
								left: i * w + '%',
								width: w + '%',
								height: '100%',
								'background': '#09c'
							}).appendTo($progress);
						}
					}
				}
			}
			if (!silent) {
				var markers = this.markers;
				for (var i = 0, m; m = markers[i++];) {
					if (m != this) {
						m.refreshKeyImageFragment(true);
					}
				}
			}
		},
		/**
		 * 刷新关键影像标记区间
		 * @return {[type]} [description]
		 */
		refreshKeyingImageFragment: function () {
			var $progress = this._$ImageingFragmentProgress || (this._$ImageingFragmentProgress = $('<div class="cateyes-keyingimage-progress"></div>').appendTo(this.player.getProgressBar()))
			$progress.empty();
			var currentIndex = this.player.getIndex(),
				end = this.end,
				w = 100 / this.player.getTotal();
			var start = this.startIndex == null ? this.endIndex : this.startIndex,
				end = this.player.getIndex();
			if (start > end) {
				start = [end, end = start][0];
			}
			$('<div></div>').css({
				position: 'absolute',
				width: (end - start + 1) * w + '%',
				height: '100%',
				left: w * start + '%',
				'background': '#09c',
				opacity: '0.5'
			}).appendTo($progress);
		},
		clearKeyingImageFragment: function () {
			this._$ImageingFragmentProgress && this._$ImageingFragmentProgress.empty();
		},
		refreshTotal: function (seriesNumber, count) {
			var cacheCount = this.markCache.count;
			if (!cacheCount[seriesNumber]) {
				cacheCount[seriesNumber] = 0;
			}
			cacheCount[seriesNumber] += count;
			cacheCount.total += count;
			this._refreshTotalDom();
			this.refreshBusiness();
		},
		_refreshTotalDom: function () {
			var markDom = this.getMarkBox(),
				self = this;
			markDom.$ul.empty();
			var sn;
			markDom.$total.html(this.markCache.count.total);
			for (sn in this.markCache.count) {
				if (sn != 'total' && this.markCache.count.hasOwnProperty(sn)) {
					markDom.$ul.append($('<li>SE ' + sn + '：已标记 ' + this.markCache.count[sn] + ' 张<button type="button" data-which="' + sn + '" class="remove-keyimage" title="删除">X</button></li>'));
				}
			}
		},
		getMarkBox: function () {
			var markDom = this.markDom,
				self = this;
			if (!markDom.element) {
				markDom.element = $('<div class="cateyes-plugin-keyimage-box"><div class="keyimage-box-head">关键帧 <span style="color: yellowgreen;">已标记 <b style="color:orange;">0</b> / ' + this.MARK_MAX + '(上限)</span> <button class="remove-keyimage" data-which="ALL">清空</button></div><ul></ul></div>').appendTo($('body'));
				markDom.$ul = $('ul', markDom.element);
				markDom.$total = $('b', markDom.element);
				markDom.element.on(Cateyes.EVENTS.CLICK, function (ev) {
					var $tgt = $(ev.target);
					if ($tgt.hasClass('remove-keyimage')) {
						self.removeKeyImage($tgt.data('which'));
					}
				});
			}
			return markDom;
		},
		/**
		 * 业务层传递参数
		 * @param  {[type]} ) {		var       cvs [description]
		 * @return {[type]}   [description]
		 */
		refreshBusiness: function () {
			var cpb;
			if (cpb = window.parent.window.CateyesPubSub) {
				cpb.trigger('AFTER_CATEYES_KEYIMAGE', [JSON.stringify(this.markCache), this.markCache.count.total]);
			}
		}
	}));

	/**
	 * 全屏插件
	 */
	PluginFactory.regist('FullScreen', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer, params) {
			this.viewer = viewer;
			this._initDom();
			this._initEvent();
		},
		DOM: '<div class="cateyes-plugin-fullscreen" title="全屏"><i></i></div>',
		_initDom: function () {
			var $container = this.viewer.getContainer();
			$container.append(this.$control = $(this.DOM));
		},
		_initEvent: function () {
			var self = this,
				$lock = this.$control;
			$lock.on(Cateyes.EVENTS.CLICK, function () {
				$(this).toggleClass('active');
				var $multiViewer = $(this).closest('.cateyes-viewer-multi-wrap');
				if ($multiViewer.length) {
					Cateyes.ViewerManager.toggleViewerFullScreen(Cateyes.ViewerManager.getMultiViewerById($multiViewer.data('id')));
				}
				// Cateyes.ViewerManager.toggleViewerFullScreen(self.viewer);
			});
			$lock.on(Cateyes.EVENTS.CLICK, function () {
				return false;
			});
			$lock.on('dblclick', function () {
				return false;
			});
		},
		show: function () {
			this.$control.show();
		},
		hide: function () {
			this.$control.hide();
		}
	}));

	/**
	 * 同步浏览锁定插件
	 */
	PluginFactory.regist('BrowseLock', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		lockedViewers: [],
		init: function (viewer, params) {
			this.viewer = viewer;
			this.player = viewer.player;
			this._initDom();
			this._initEvent();
		},
		DOM: '<div class="cateyes-plugin-browselock" title="关联浏览锁"><i></i></div>',
		_initDom: function () {
			var $container = this.viewer.getContainer();
			$container.append(this.$control = $(this.DOM));
		},
		_initEvent: function () {
			var self = this,
				$lock = this.$control;
			this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, function (params) {
				params && $lock.hasClass('active') && self.sync(params);
			});
			$lock.on(Cateyes.EVENTS.CLICK, function () {
				if ($(this).toggleClass('active').hasClass('active')) {
					self.lock();
				} else {
					self.unlock();
				}
			});
			$lock.on(Cateyes.EVENTS.CLICK, function () {
				return false;
			});
			$lock.on('dblclick', function () {
				return false;
			});
		},
		lock: function () {
			this.lockedViewers.push(this.viewer);
		},
		unlock: function () {
			var vs = this.lockedViewers;
			for (var i = 0, v; v = vs[i]; i++) {
				if (v == this.viewer) {
					vs.splice(i, 1);
					break;
				}
			}
		},
		/**
		 * 同步
		 * @return {[type]} [description]
		 */
		sync: function (params) {
			var vs = this.lockedViewers,
				cv = this.viewer,
				event = params.event;
			if (vs && vs.length > 1 && (event == 'prev' || event == 'next')) {
				for (var i = 0, v; v = vs[i++];) {
					if (v != cv) {
						v.player[event](true);
					}
				}
			}
		},
		show: function () {
			this.$control.show();
		},
		hide: function () {
			this.$control.hide();
		}
	}));


	/**
	 * 图像方位插件
	 */
	PluginFactory.regist('ImageOrientation', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer) {
			var self = this;
			this.viewer = viewer;
			viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function () {
				self.refresh();
			});
			viewer.subscribe(Cateyes.CustomEvents.ON_DICOM_CANVAS_RESIZE, function () {
				self.refresh();
			});
			this._initDom();
			this.refresh();
		},
		_initDom: function () {
			var $container = this.viewer.getContainer();
			var css = {
				position: 'absolute',
				width: '15px',
				height: '15px',
				color: '#09c',
				'font-size': '18px',
				'z-index': '10',
				'font-family': '微软雅黑'
			};
			this.$top = $('<div></div>').css($.extend({}, css, {
				'top': '5%',
				'left': '50%',
				'margin-left': '-7px'
			})).appendTo($container);
			this.$bottom = $('<div></div>').css($.extend({}, css, {
				'bottom': '3%',
				'left': '50%',
				'margin-left': '-7px'
			})).appendTo($container);
			this.$left = $('<div></div>').css($.extend({}, css, {
				'left': '5%',
				'top': '50%',
				'margin-top': '-7px'
			})).appendTo($container);
			this.$right = $('<div></div>').css($.extend({}, css, {
				'right': '5%',
				'top': '50%',
				'margin-top': '-7px'
			})).appendTo($container);
		},
		refresh: function () {
			var series = this.viewer.getSeries(),
				oris = ['', '', '', '', '', '', '', '']; //top,right,bottom,left
			if (series) {
				var orientation = this.viewer.tinter.getState().orientation || series.info.orientation,
					positionState = this.viewer.positioner.getState(),
					h,
					v;
				switch (orientation) {
					case 'AXIAL':
						oris[0] = 'A';
						oris[1] = 'LA';
						oris[2] = 'L';
						oris[3] = 'LP';
						oris[4] = 'P';
						oris[5] = 'RP';
						oris[6] = 'R';
						oris[7] = 'RA';
						break;
					case 'CORONAL':
						oris[0] = 'H';
						oris[1] = 'LH';
						oris[2] = 'L';
						oris[3] = 'LF';
						oris[4] = 'F';
						oris[5] = 'RF';
						oris[6] = 'R';
						oris[7] = 'RH';
						break;
					case 'SAGITTAL':
						oris[0] = 'H';
						oris[1] = 'HP';
						oris[2] = 'P';
						oris[3] = 'FP';
						oris[4] = 'F';
						oris[5] = 'AF';
						oris[6] = 'A';
						oris[7] = 'AH';
						break;
				}
				var rotateStep = Math.floor((positionState.rotate + 22.5) / 45) % 8;
				rotateStep < 0 && (rotateStep += 8);
				switch (rotateStep) {
					case 0:
						h = [2, 6];
						v = [0, 4];
						break;
					case 1:
						h = [0, 2, 4, 6];
						v = [0, 6, 2, 4];
						break;
					case 2:
						h = [0, 4];
						v = [2, 6];
						break;
					case 3:
						h = [0, 6, 2, 4];
						v = [0, 2, 4, 6];
						break;
					case 4:
						h = [2, 6];
						v = [0, 4];
						break;
					case 5:
						h = [0, 2, 4, 6];
						v = [0, 6, 2, 4];
						break;
					case 6:
						h = [0, 4];
						v = [2, 6];
						break;
					case 7:
						h = [0, 6, 2, 4];
						v = [0, 2, 4, 6];
						break;
				}
				while (rotateStep > 0) {
					rotateStep--;
					oris.unshift(oris.pop());
				}

				if (positionState.horizontal < 0) {
					for (var i = 0; i < h.length; i += 2) {
						oris[h[i]] = [oris[h[i + 1]], oris[h[i + 1]] = oris[h[i]]][0];
					}
				}
				if (positionState.vertical < 0) {
					for (var i = 0; i < v.length; i += 2) {
						oris[v[i]] = [oris[v[i + 1]], oris[v[i + 1]] = oris[v[i]]][0];
					}
				}
			}
			this.$top.html(oris[0]);
			this.$right.html(oris[2]);
			this.$bottom.html(oris[4]);
			this.$left.html(oris[6]);
		},
		show: function () {

		},
		hide: function () {

		}
	}));

	/**
	 * 标尺插件
	 */
	PluginFactory.regist('Scaleplate', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer) {
			var self = this;
			this.viewer = viewer;
			viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function () {
				self.refresh(true);
			});
			viewer.subscribe(Cateyes.CustomEvents.ON_DICOM_CANVAS_RESIZE, function () {
				self.refresh();
			});
			this._initDom();
			this.refresh();
		},
		_initDom: function () {
			var $container = this.viewer.getContainer();
			var css = {
				position: 'absolute',
				'box-sizing': 'border-box',
				color: '#09c',
				'font-size': '18px',
				'z-index': '10',
				'font-family': 'cursive'
			};
			this.$bottom = $('<div></div>').css($.extend({}, css, {
				height: '8px',
				'bottom': '5%',
				'left': '50%',
				'border-bottom': '1px solid #09c',
				'border-right': '1px solid #09c'
			}));
			for (var i = 0; i < 10; i++) {
				$('<div></div>').css({
					'box-sizing': 'border-box',
					'border-left': '1px solid #09c',
					'height': (i != 0 && i != 5) ? '4px' : '7px',
					'margin-top': (i != 0 && i != 5) ? '3px' : '0px',
					'width': '10%',
					'float': 'left'
				}).appendTo(this.$bottom);
			}
			//this.$bottom.appendTo($container);
			this.$left = $('<div></div>').css($.extend({}, css, {
				width: '8px',
				'left': '1%',
				'top': '50%',
				'border-bottom': '1px solid #09c',
				'border-left': '1px solid #09c',
			}));
			for (var i = 0; i < 10; i++) {
				$('<div></div>').css({
					'box-sizing': 'border-box',
					'border-top': '1px solid #09c',
					'width': (i != 0 && i != 5) ? '4px' : '7px',
					'height': '10%'
				}).appendTo(this.$left);
			}
			this.$left.appendTo($container);
		},
		refresh: function (force) {
			var series = this.viewer.getSeries(),
				positionState = this.viewer.positioner.getState();
			if (force) {
				var pixelSpacing = series.info.pixelSpacing,
					ruleWidth = 100 / pixelSpacing[0],
					ruleHeight = 100 / (pixelSpacing[1] || pixelSpacing[0]);
				this.$bottom._ruleWidth = ruleWidth;
				this.$left._ruleheight = ruleHeight;
			}
			var width = positionState.scale * Math.abs(positionState.horizontal) * this.$bottom._ruleWidth,
				height = positionState.scale * Math.abs(positionState.vertical) * this.$left._ruleheight;
			this.$bottom.css({
				width: width + 'px',
				'margin-left': '-' + (width / 2) + 'px'
			});
			this.$left.css({
				height: height + 'px',
				'margin-top': '-' + (height / 2) + 'px'
			});

		},
		show: function () {

		},
		hide: function () {

		},
		_setTransform: function ($el, buff) {
			var stl = $el[0].style;
			// 兼容各浏览器
			stl.transform = buff;
			stl.oTransform = buff;
			stl.msTransform = buff;
			stl.mozTransform = buff;
			stl.webkitTransform = buff;
		}
	}));

	/**
	 * Loading
	 */
	PluginFactory.regist('Loading', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		init: function (viewer) {
			var self = this;
			this.viewer = viewer;
			viewer.subscribe(Cateyes.CustomEvents.VIEWER_LOADING, function (params) {
				self.refresh(params);
			});
			this._initDom();
			this.refresh();
		},
		_initDom: function () {
			var $container = this.viewer.getContainer();
			this.$loading = $('<div></div>').css({
				position: 'absolute',
				'box-sizing': 'border-box',
				top: '45%',
				left: '50%',
				transform: 'translate(-50%,0)',
				'font-size': '14px',
				'z-index': '10',
				'font-family': 'cursive',
				color: '#FFF',
				padding: '6px',
				background: '#232323',
				'border-radius': '3px',
				'display': 'none'
			});
			this.$loading.appendTo($container);
		},
		refresh: function (params) {
			if (params) {
				this.$loading.html(params.text || '加载中...');
				this.show();
			} else {
				this.hide();
			}
		},
		show: function () {
			this.$loading.show();
		},
		hide: function () {
			this.$loading.hide();
		}
	}));

	/**
	 *定位线插件
	 */
	PluginFactory.regist('PositionLine', Cateyes.ClassHelper.extend(Plugin, function (viewer, params) {
		this.init(viewer, params);
	}, {
		lopPubSub: new Cateyes.PubSub(),
		init: function (viewer, params) {
			var self = this;
			this.viewer = viewer;
			this.lopPubSub.subscribe(Cateyes.CustomEvents.DRAW_POSITIONLINE, function (sliceViewer) {
				self.drawPositionline(sliceViewer);
			});
			viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, function () {
				self.lopPubSub.publish(Cateyes.CustomEvents.DRAW_POSITIONLINE, viewer);
			});
			viewer.subscribe(Cateyes.CustomEvents.ON_VIEWER_ACTIVE, function () {
				self.lopPubSub.publish(Cateyes.CustomEvents.DRAW_POSITIONLINE, viewer);
				self.clearPositionLine();
			});
		},
		state: {
			show: true
		},
		toggleShow: function () {
			this.state.show = !this.state.show;
			$('canvas.POSITION_LINE')[this.state.show ? 'show' : 'hide']();
		},
		/**
		 * 绘制定位线
		 * @param  {[type]} positionFrame [description]
		 * @param  {[type]} sliceFrame    [description]
		 * @return {[type]}               [description]
		 */
		drawPositionline: function (sliceViewer) {
			var positionFrame = this._getInfoFromFrame(this.viewer),
				sliceFrame = this._getInfoFromFrame(sliceViewer);
			if (!positionFrame || !sliceFrame) {
				return;
			}
			if (positionFrame.seriesId == sliceFrame.seriesId && positionFrame.orientation == sliceFrame.orientation) {
				this.clearPositionLine();
				return;
			}
			var points;
			if (positionFrame.seriesId == sliceFrame.seriesId) {
				//临时解决方案
				points = this.calculateMprPositionLine(this.viewer, sliceViewer);
			} else {
				points = this.calculatePositionLine(positionFrame, sliceFrame);
			}
			if (points) {
				var cvs = this._getPostionLineCanvas(),
					ctx = cvs.context,
					state = this.viewer.positioner.getState(),
					scale = state.scale;
				points.start.x = Math.round(points.start.x * scale * Math.abs(state.horizontal)) + 0.5;
				points.start.y = Math.round(points.start.y * scale * Math.abs(state.vertical)) + 0.5;
				points.end.x = Math.round(points.end.x * scale * Math.abs(state.horizontal)) + 0.5;
				points.end.y = Math.round(points.end.y * scale * Math.abs(state.vertical)) + 0.5;
				if (!cvs._inited) {
					cvs._inited = true;
					ctx.strokeStyle = 'yellow';
					ctx.lineWidth = '1';
				}
				ctx.clearRect(0, 0, cvs.width, cvs.height);
				ctx.strokeStyle = '#333';
				ctx.lineWidth = '3';
				ctx.beginPath();
				ctx.moveTo(points.start.x, points.start.y);
				ctx.lineTo(points.end.x, points.end.y);
				ctx.stroke();
				ctx.beginPath();
				ctx.strokeStyle = 'yellow';
				ctx.lineWidth = '1';
				ctx.moveTo(points.start.x, points.start.y);
				ctx.lineTo(points.end.x, points.end.y);
				ctx.stroke();
			} else {
				this.clearPositionLine();
			}
		},
		/**
		 * 清空定位线
		 */
		clearPositionLine: function () {
			var cvs = this._getPostionLineCanvas();
			cvs.context.clearRect(0, 0, cvs.width, cvs.height);
		},
		/**
		 * 计算定位线坐标
		 * @return {[type]} [description]
		 */
		calculatePositionLine: function (positionFrame, sliceFrame) {
			//1.计算定位图平面方程
			var ip = positionFrame.imagePosition,
				io = positionFrame.imageOrientation,
				ips = positionFrame.pixelSpacing,
				dx = io[1] * io[5] - io[4] * io[2],
				dy = io[2] * io[3] - io[0] * io[5],
				dz = io[0] * io[4] - io[3] * io[1];
			//  (x-ip[0])*dx +(y-ip[1])*dy+(z-ip[2])*dz=0;
			//2.计算切片图四个点
			var cip = sliceFrame.imagePosition,
				cio = sliceFrame.imageOrientation,
				cps = sliceFrame.pixelSpacing,
				cw = sliceFrame.columns,
				ch = sliceFrame.rows;

			var p1 = cip,
				cpsw = cw * cps[0],
				cpsh = ch * cps[1],
				p2 = [p1[0] + cpsw * cio[0], p1[1] + cpsw * cio[1], p1[2] + cpsw * cio[2]],
				p3 = [p2[0] + cpsh * cio[3], p2[1] + cpsh * cio[4], p2[2] + cpsh * cio[5]],
				p4 = [p1[0] + cpsh * cio[3], p1[1] + cpsh * cio[4], p1[2] + cpsh * cio[5]];

			//3.计算四个端点的矢量位移
			var dv1 = (p1[0] - ip[0]) * dx + (p1[1] - ip[1]) * dy + (p1[2] - ip[2]) * dz,
				dv2 = (p2[0] - ip[0]) * dx + (p2[1] - ip[1]) * dy + (p2[2] - ip[2]) * dz,
				dv3 = (p3[0] - ip[0]) * dx + (p3[1] - ip[1]) * dy + (p3[2] - ip[2]) * dz,
				dv4 = (p4[0] - ip[0]) * dx + (p4[1] - ip[1]) * dy + (p4[2] - ip[2]) * dz;

			//4.判断是否穿过
			var isCross_12 = (dv1 >= 0 && dv2 <= 0) || (dv1 <= 0 && dv2 >= 0),
				isCross_23 = (dv2 >= 0 && dv3 <= 0) || (dv2 <= 0 && dv3 >= 0),
				isCross_34 = (dv3 >= 0 && dv4 <= 0) || (dv3 <= 0 && dv4 >= 0),
				isCross_41 = (dv4 >= 0 && dv1 <= 0) || (dv4 <= 0 && dv1 >= 0);

			// console.log('isCross_12:' + isCross_12);
			// console.log('isCross_23:' + isCross_23);
			// console.log('isCross_34:' + isCross_34);
			// console.log('isCross_41:' + isCross_41);

			//5.计算定位线两端坐标

			var croessPoint_1, croessPoint_2;
			if (isCross_12 && isCross_34) {
				croessPoint_1 = [
					p1[0] + (p2[0] - p1[0]) * dv1 / (dv1 - dv2),
					p1[1] + (p2[1] - p1[1]) * dv1 / (dv1 - dv2),
					p1[2] + (p2[2] - p1[2]) * dv1 / (dv1 - dv2)
				];
				croessPoint_2 = [
					p3[0] + (p4[0] - p3[0]) * dv3 / (dv3 - dv4),
					p3[1] + (p4[1] - p3[1]) * dv3 / (dv3 - dv4),
					p3[2] + (p4[2] - p3[2]) * dv3 / (dv3 - dv4)
				];
			} else if (isCross_23 && isCross_41) {
				croessPoint_1 = [
					p2[0] + (p3[0] - p2[0]) * dv2 / (dv2 - dv3),
					p2[1] + (p3[1] - p2[1]) * dv2 / (dv2 - dv3),
					p2[2] + (p3[2] - p2[2]) * dv2 / (dv2 - dv3)
				];
				croessPoint_2 = [
					p4[0] + (p1[0] - p4[0]) * dv4 / (dv4 - dv1),
					p4[1] + (p1[1] - p4[1]) * dv4 / (dv4 - dv1),
					p4[2] + (p1[2] - p4[2]) * dv4 / (dv4 - dv1)
				];
			}

			// console.log('croessPoint_1:' + croessPoint_1);
			// console.log('croessPoint_2:' + croessPoint_2);

			if (croessPoint_1 && croessPoint_2) {
				return {
					start: this.projectLocation({
						x: croessPoint_1[0] - ip[0],
						y: croessPoint_1[1] - ip[1],
						z: croessPoint_1[2] - ip[2]
					}, io, ips),
					end: this.projectLocation({
						x: croessPoint_2[0] - ip[0],
						y: croessPoint_2[1] - ip[1],
						z: croessPoint_2[2] - ip[2]
					}, io, ips)
				}
			}
		},
		/**
		 * 将3D坐标点投射到2D平面
		 * @type {Object}
		 */
		projectLocation: function (point, imageOrientation, pixelSpacing) {
			var x = point.x * imageOrientation[0] + point.y * imageOrientation[1] + point.z * imageOrientation[2],
				y = point.x * imageOrientation[3] + point.y * imageOrientation[4] + point.z * imageOrientation[5];
			return {
				x: x / pixelSpacing[0],
				y: y / pixelSpacing[1]
			};
		},
		/**
		 * 获取定位线画布
		 * @return {[type]} [description]
		 */
		_getPostionLineCanvas: function () {
			var self = this;
			return this.viewer.getCanvas('POSITION_LINE', 1, function (viewer) {
				var dicomCanvas = viewer.getCanvas('DICOM'),
					$dicomCanvas = dicomCanvas.$el,
					position = viewer.positioner.getDicomCanvasPosition();
				if (this.width != position.width || this.height != position.height) {
					this.width = position.width;
					this.height = position.height;
				}
				var stl = this.style,
					buff = [];
				buff.push("scale(");
				buff.push(position.horizontal > 0 ? 1 : -1);
				buff.push(",");
				buff.push(position.vertical > 0 ? 1 : -1);
				buff.push(") rotate(");
				buff.push(position.rotate);
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
			}, function () {
				$('canvas.POSITION_LINE')[self.state.show ? 'show' : 'hide']();
			});
		},
		/**
		 * 提取切片位置信息
		 * @param  {[type]} frame [description]
		 * @return {[type]}       [description]
		 */
		_getInfoFromFrame: function (viewer) {
			var series = viewer.getSeries();
			if (!series) {
				return null;
			}
			var index = viewer.player.getState().index,
				seriesInfo = series.info,
				originalOrientation = seriesInfo.orientation,
				orientation = viewer.tinter.getState().orientation;
			var imagePosition,
				imageOrientation,
				rows,
				columns,
				pixelSpacing,
				orientation;
			if (originalOrientation == orientation) {
				var frame = viewer.player.getCurrentDicom().info;
				imagePosition = frame.imagePositionPatient;
				imageOrientation = frame.imageOrientationPatient;
				rows = +frame.height;
				columns = +frame.width;
				pixelSpacing = frame.pixelSpacing;
				orientation = Cateyes.DicomHelper.getImageOrientation(frame.imageOrientationPatient);
			} else {
				var firstFrame = series.getDicom(0),
					lastFrame = series.getDicom(series.getTotal() - 1),
					imageOrientation = Cateyes.Utils.copy(firstFrame.info.imageOrientationPatient),
					imagePosition = Cateyes.Utils.copy(firstFrame.info.imagePositionPatient),
					rowPoint,
					colPoint,
					sliceThicknessOrientation = this._calculateDirectionCosine(firstFrame.info.imagePositionPatient, lastFrame.info.imagePositionPatient);
				switch (originalOrientation) {
					case 'AXIAL':
						if (orientation == 'CORONAL') {
							columns = +seriesInfo.width;
							rows = series.getTotal();
							pixelSpacing = [+seriesInfo.pixelSpacing[0], +seriesInfo.realSliceThickness];
							imagePosition[1] += index * seriesInfo.pixelSpacing[1];
							imageOrientation = imageOrientation.slice(0, 3).concat(sliceThicknessOrientation.F_L);
						} else {
							columns = +seriesInfo.height;
							rows = series.getTotal();
							pixelSpacing = [+seriesInfo.pixelSpacing[1], +seriesInfo.realSliceThickness];
							imagePosition[0] += index * seriesInfo.pixelSpacing[0];
						}
						break;
					case 'SAGITTAL':
						if (orientation == 'AXIAL') {
							columns = series.getTotal();
							rows = +seriesInfo.width;
							pixelSpacing = [+seriesInfo.realSliceThickness, +seriesInfo.pixelSpacing[0]];
							imagePosition[2] -= index * seriesInfo.pixelSpacing[1];
						} else {
							columns = series.getTotal();
							rows = +seriesInfo.height;
							pixelSpacing = [+seriesInfo.realSliceThickness, +seriesInfo.pixelSpacing[1]];
							imagePosition[1] += index * seriesInfo.pixelSpacing[0];
						}
						break;
					case 'CORONAL':
						if (orientation == 'AXIAL') {
							columns = +seriesInfo.width;
							rows = series.getTotal();
							pixelSpacing = [+seriesInfo.pixelSpacing[0], +seriesInfo.realSliceThickness];
							imagePosition[1] -= rows * pixelSpacing[1];
							imagePosition[2] -= index * seriesInfo.pixelSpacing[1];
							imageOrientation = imageOrientation.slice(0, 3).concat(sliceThicknessOrientation.L_F);
						} else {
							columns = series.getTotal();
							rows = +seriesInfo.height;
							pixelSpacing = [+seriesInfo.realSliceThickness, +seriesInfo.pixelSpacing[1]];
							imagePosition[0] += index * seriesInfo.pixelSpacing[0];
							imageOrientation = sliceThicknessOrientation.L_F.concat(imageOrientation.slice(3, 6));
						}
						break;
				}
				// rowPoint = Cateyes.Utils.copy(imagePosition);
				// colPoint = Cateyes.Utils.copy(imagePosition);
				// switch (orientation) {
				// 	case 'AXIAL':
				// 		debugger;
				// 		rowPoint[0] += columns * pixelSpacing[0];
				// 		colPoint[1] += rows * pixelSpacing[1];
				// 		break;
				// 	case 'SAGITTAL':
				// 		rowPoint[1] += columns * pixelSpacing[0];
				// 		colPoint[2] -= rows * pixelSpacing[1];
				// 		break;
				// 	case 'CORONAL':
				// 		rowPoint[0] += columns * pixelSpacing[0];
				// 		colPoint[2] -= rows * pixelSpacing[1];
				// 		break;
				// }
				// imageOrientation = this._calculateDirectionCosine(imagePosition, rowPoint, colPoint);
			}



			// var imagePosition = frame.imagePositionPatient,
			// 	imageOrientation = frame.imageOrientationPatient,
			// 	rows = +frame.height,
			// 	columns = +frame.width,
			// 	pixelSpacing = frame.pixelSpacing,
			// 	orientation = Cateyes.DicomHelper.getImageOrientation(frame.imageOrientationPatient);
			// if (frame.windowCenter == 600) {
			// 	imageOrientation = [1, 0, 0, 0, 0, -1];
			// 	columns = +frame.width;
			// 	rows = 361;
			// 	orientation = 'SAGITTAL';
			// 	pixelSpacing = [pixelSpacing[0], 1.5];
			// }
			return {
				seriesId: series.id,
				imagePosition: imagePosition,
				imageOrientation: imageOrientation,
				rows: rows,
				columns: columns,
				pixelSpacing: pixelSpacing,
				orientation: orientation
			};
		},
		/**
		 * 计算方向余弦
		 * @return {[type]} [description]
		 */
		_calculateDirectionCosine: function (p1, p2) {
			var dis = Math.sqrt((p1[0] - p2[0]) * (p1[0] - p2[0]) + (p1[1] - p2[1]) * (p1[1] - p2[1]) + (p1[2] - p2[2]) * (p1[2] - p2[2]));
			return {
				F_L: [(p2[0] - p1[0]) / dis, (p2[1] - p1[1]) / dis, (p2[2] - p1[2]) / dis],
				L_F: [(p1[0] - p2[0]) / dis, (p1[1] - p2[1]) / dis, (p1[2] - p2[2]) / dis]
			}
		},
		calculateMprPositionLine: function (positionViewer, sliceViewer) {
			var positionOri = positionViewer.tinter.state.orientation,
				positionWidth = positionViewer.tinter.state.width,
				positionHeight = positionViewer.tinter.state.height,
				sliceOri = sliceViewer.tinter.state.orientation,
				sliceIndex = sliceViewer.player.state.index,
				start, end,
				rowPoints = {
					start: {
						x: 0,
						y: sliceIndex
					},
					end: {
						x: positionWidth,
						y: sliceIndex
					}
				},
				colPoints = {
					start: {
						x: sliceIndex,
						y: 0
					},
					end: {
						x: sliceIndex,
						y: positionHeight
					}
				};
			if (positionOri == 'AXIAL') {
				if (sliceOri == 'CORONAL') {
					return rowPoints;
				} else {

					return colPoints;
				}
			} else if (positionOri == 'CORONAL') {
				if (sliceOri == 'AXIAL') {
					return rowPoints;
				} else {
					return colPoints;
				}
			} else {
				if (sliceOri == 'AXIAL') {
					return rowPoints;
				} else {
					return colPoints;
				}
			}
		}
	}));


})();