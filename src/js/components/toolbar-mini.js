var Toolbar = {
	working: true,
	mode: Cateyes.InputCovert.getCovert('CHANGE_WINDOW'),
	defaultMode: Cateyes.InputCovert.getCovert('CHANGE_WINDOW'),
	/**
	 * 初始化
	 * @return {[type]} [description]
	 */
	init: function() {
		this.initEvent();
		this.initNav();
	},
	/**
	 * 初始化事件
	 * @return {[type]} [description]
	 */
	initEvent: function() {
		var self = this,
			$major = $('.cateyes-major'),
			$document = $(document);
		$major.bind(Cateyes.EVENTS.MOUSE_MOVE, function(ev) {
			self.baseEvent(ev);
		});
		var lastClickTime = 0;
		$('body').on('touchstart', function(ev) {

		});
		$('body').on('touchmove', function(ev) {
			ev.preventDefault();
			//return false;
		});
		$major.bind(Cateyes.EVENTS.MOUSE_DOWN, function(ev) {
			//var now = new Date().getTime(),
			var touches = ev.originalEvent.touches;
			// if (now - lastClickTime < 100 && touches.length == 1) {
			// 	self.dblClickCallback(ev.originalEvent.touches[0]);
			// 	return;
			// }
			// lastClickTime = now;
			self.baseEvent(ev);
		});
		$major.bind(Cateyes.EVENTS.MOUSE_UP, function(ev) {
			self.baseEvent(ev);
		});
		// 禁止右键菜单
		$document["bind"]("contextmenu", function() {
			return false;
		});
		//监听业务事件 
		Cateyes.GlobalPubSub.subscribe('AFTER_VIEWER_STATUS_CHANGE', function() {
			self.refreshToolbarByCurrentViewer();
		});
		//工具栏操作
		$(".toolbar,.menu,.window-setter").on(Cateyes.EVENTS.MOUSE_UP, '.cateyes-op', function() {
			var $this = $(this),
				type = $this.data('type'),
				cmd = $this.data('cmd');
			self._operate(cmd, type);
			if (type == 'mode') {
				$('li.active').removeClass('active');
				$('.cateyes-op.active').removeClass('active');
				$this.addClass('active');
				$this.parent().addClass('active');
			} else {
				if (cmd == 'INVERSE' || cmd == 'PSEUDOCOLOR') {
					$this.toggleClass('li-active');
				} else if (cmd == 'CMD_TOGGLE_INFO') {
					$this.toggleClass('s-active');
					$this.html($this.hasClass('s-active') ? '显示四角信息' : '隐藏四角信息');
				} else if (cmd == 'CMD_RESET') {
					$('.li-active').removeClass('li-active');
				}
			}
			var $menu;
			if (($menu = $this.closest('.tools-ext-list')).length) {
				$menu.addClass('hide');
			}
			return false;
		});
		//触摸高亮
		$(".touch-focus").on(Cateyes.EVENTS.CLICK, function() {
			var $this = $(this);
			$this.addClass('focus');
			setTimeout(function() {
				$this.removeClass('focus');
			}, 150);
		});
		//工具栏选项
		//菜单栏
		var $menu = $('.menu-ol'),
			$tools = $(".tools-ol"),
			$toolsWrap = $('.tools-ext'),
			$lastActiveOp;
		$toolsWrap.on(Cateyes.EVENTS.CLICK, function() {
			$menu.addClass('hide');
			if ($tools.hasClass('hide')) {
				$tools.removeClass('hide');
				$lastActiveOp = $('.cateyes-op.active').removeClass('active');
				$toolsWrap.addClass('active');
			} else {
				setTimeout(function() {
					hideTools();
				}, 200)
			}
			return false;
		});
		$('.menu').on(Cateyes.EVENTS.CLICK, function() {
			hideTools()
			if ($menu.hasClass('hide')) {
				$menu.removeClass('hide');
			} else {
				setTimeout(function() {
					$menu.addClass('hide');
				}, 200)
			}
			return false;
		});

		function hideTools() {
			$tools.addClass('hide');
			$toolsWrap.removeClass('active');
			$lastActiveOp && $lastActiveOp.addClass('active');
			$lastActiveOp = null;
		}
		$(document).on(Cateyes.EVENTS.CLICK, ':not(.menu-ol,.tools-ol)', function() {
			$menu.addClass('hide');
			hideTools();
		});
	},
	/**
	 * 初始化导航
	 * @return {[type]} [description]
	 */
	initNav: function() {
		var self = this;
		//序列导航
		var $seriesSelectorWrap = this.$seriesSelectorWrap = $('.cateyes-phone-series-selector'),
			$seriesSelector = this.$seriesSelector = $('.cateyes-phone-series-selector ul'),
			$seriesTrigger = this.$seriesTrigger = $('.cateyes-phone-series-trigger');
		var $DicomSeriesSelectBox = $('.dicom-series-select-box');
		//检查加载
		Cateyes.GlobalPubSub.subscribe('AFTER_LOAD_STUDY', function(study) {
			self._renderStudy(study);
			$seriesSelectorWrap.show();
			var scroll = new IScroll("#cateyes-phone-series-selector", {
				mouseWheel: true,
				bounce: false
			});
			$seriesSelectorWrap.hide();
		});
		$seriesTrigger.on(Cateyes.EVENTS.CLICK, function() {
			//$seriesSelectorWrap.show();
			$DicomSeriesSelectBox.show();
		});
		var lastTapTime;
		$seriesSelector.on(Cateyes.EVENTS.MOUSE_DOWN, 'li', function() {
			lastTapTime = new Date().getTime();
		});
		$seriesSelector.on(Cateyes.EVENTS.MOUSE_UP, 'li', function() {
			if (new Date().getTime() - lastTapTime < 100) {
				var $this = $(this);
				Cateyes.ViewerManager.getCurrentViewer().setSeries(Cateyes.DicomHolder.getSeriesByUid($this.data('suid')));
				$seriesTrigger.html($this.html());
				$seriesSelectorWrap.hide();
			}
		});
		$DicomSeriesSelectBox.on(Cateyes.EVENTS.MOUSE_UP, '.dicom-series-item', function() {
			var $this = $(this);
			Cateyes.ViewerManager.getCurrentViewer().setSeries(Cateyes.DicomHolder.getSeriesByUid($this.data('suid')));
			$seriesTrigger.html($this.html());
			$DicomSeriesSelectBox.hide();
		});
		$('.dicom-series-select-box .box-close').on(Cateyes.EVENTS.CLICK,function() {
			$DicomSeriesSelectBox.hide();
		});
		//按键浏览
		var swipeTimer,
			swiperIntervalTimer,
			speed = 100;
		$(".cateyes-phone-swipe-trigger").on(Cateyes.EVENTS.MOUSE_DOWN, function() {
			var $this = $(this),
				func = $this.hasClass('swipe-left') ? 'prev' : 'next';
			Cateyes.ViewerManager.getCurrentViewer().player[func]();
		});
		var $defaultOpTrigger = $('#default-op-trigger');
		Cateyes.GlobalPubSub.subscribe('AFTER_MARK_CREATED', function(mark) {
			if (mark.type == "CT_POINT" || mark.type == "ARROWS" || mark.type == "PYS_LENGTH" || mark.type == "CT_ELLIPSE") {
				$defaultOpTrigger.addClass('active');
				$defaultOpTrigger.parent().addClass('active');
				self.mode = self.defaultMode;
			}
		});
	},
	_renderStudy: function(study) {
		var html = [],
			html2 = [];
		for (var i = 0, s; s = study.serieses[i]; i++) {
			if (i == 0) {
				this.$seriesTrigger.html('<label>' + s.info.seriesNumber + '</label><img src="' + (Cateyes.IMAGE_RESOUCE_PREFIX + s.frames[0].thumbnailUri) + '">');
			}
			html.push('<li data-suid="' + s.info.seriesInstanceUID + '"><label>' + s.info.seriesNumber + '</label><img src="' + (Cateyes.IMAGE_RESOUCE_PREFIX + s.frames[0].thumbnailUri) + '"></li>');
			html2.push('<span class="dicom-series-item" data-suid="' + s.info.seriesInstanceUID + '"><label>' + s.info.seriesNumber + '</label><img src="' + (Cateyes.IMAGE_RESOUCE_PREFIX + s.frames[0].thumbnailUri) + '"></span>')
		}
		this.$seriesSelector.html(html.join(''));
		$('.dicom-series-items').append(html2.join(''));
	},
	_renderProxy: function(series) {
		var frames = series.frames,
			total = frames.length,
			html = [];
		for (var i = 0; i < total; i++) {
			html.push('<div class="dicom-proxy dicom-proxy-' + i + ' swiper-slide" data-index="' + i + '"><img class="swiper-lazy" data-src="' + (Cateyes.IMAGE_RESOUCE_PREFIX + frames[i].thumbnailUri) + '" /></div>');
		}
		return html.join('');
	},
	refreshToolbarByCurrentViewer: function() {
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		//播放状态
		if (viewer) {
			$(".tools-icon-play").css({
				'background-position': (viewer.player.isPlaying() ? 'center -30px' : 'center 0px')
			});
		} else {
			$(".tools-icon-play").css({
				'background-position': 'center 0px'
			});
		}
	},
	/**
	 * 常驻处理
	 * @type {Array}
	 */
	RESIDENT: [Cateyes.InputCovert.getCovert('MARK_REFRESH_BASE')],
	resident: function(viewer) {
		var flag = false;
		if (viewer && this.RESIDENT) {
			for (var i = 0, f; f = this.RESIDENT[i++];) {
				flag = flag || viewer.executeCommond(f());
			}
		}
		return flag;
	},
	/**
	 * 全局事件
	 * @param  {[type]} ev){			var cmd           [description]
	 * @return {[type]}             [description]
	 */
	baseEvent: function(ev) {
		if (!this.working) {
			return;
		}
		var self = this;
		var touches = ev.originalEvent.touches;
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		if (touches.length <= 1) {
			var stop = self.resident(viewer);
			if (!stop) {
				var ci = self.mode;
				var cmd = ci && ci();
				cmd && viewer.executeCommond(cmd);
			}
		} else if (touches.length == 2) {
			self.twoTouchesOperate(ev.type, touches[0], touches[1]);
		}
	},
	_operate: function(cmd, type) {
		switch (type) {
			case "global":
				this.globalOperate(cmd);
				break;
			case "normal":
				this.normalOperate(cmd);
				break;
			case "mode":
				this.bindModeOperate(cmd);
				break;
			case "custom":
				this.customOperate(cmd);
		}
	},
	/**
	 * 绑定模式操作
	 * @param  {[type]} mode  [description]
	 * @param  {[type]} mouse [description]
	 * @return {[type]}       [description]
	 */
	bindModeOperate: function(mode, mouse) {
		this.mode = Cateyes.InputCovert.getCovert(mode);
	},
	/**
	 * 普通操作
	 */
	normalOperate: function(op) {
		if (op) {
			var viewer = Cateyes.ViewerManager.getCurrentViewer();
			if (viewer) {
				op = op.split('|');
				var cmd = Cateyes.InputCovert.getCovert(op[0], eval('(' + op[1] + ')'))();
				viewer.executeCommond(cmd);
			}
		}
	},
	/**
	 * 全局操作
	 * @return {[type]} [description]
	 */
	globalOperate: function(op) {
		if (op) {
			op = op.split('|');
			var cmd = Cateyes.InputCovert.getCovert(op[0], eval('(' + op[1] + ')'))();
			cmd && cmd();
		}
	},
	/**
	 * 特殊操作
	 * @return {[type]} [description]
	 */
	customOperate: function(cmd) {
		switch (cmd) {
			case "CUSTOM_WINDOW":
				this.showCustomWindow();
		}
	},
	/**
	 * 多触点操作
	 */
	trace: {},
	twoTouchesOperate: function(evType, t0, t1) {
		var trace = this.trace,
			viewer = Cateyes.ViewerManager.getCurrentViewer(),
			state = viewer.positioner.getState(),
			distance = Cateyes.MathUtils.getDistance(t0.pageX, t0.pageY, t1.pageX, t1.pageY);
		if (evType == "touchstart") {
			var CanvasMouse = viewer.positioner.getMouseXYofCanvas((t0.pageX + t1.pageX) / 2, (t0.pageY + t1.pageY) / 2);
			trace._zoomAmendX = CanvasMouse.width / 2 - CanvasMouse.x;
			trace._zoomAmendY = CanvasMouse.height / 2 - CanvasMouse.y;
			trace._zoomStartDistance = distance;
			trace._translateStartX = (t0.pageX + t1.pageX) >> 1;
			trace._translateStartY = (t0.pageY + t1.pageY) >> 1;
			if (CanvasMouse.x < 0 || CanvasMouse.x > CanvasMouse.width) {
				trace._zoomAmendX = 0;
			}
			if (CanvasMouse.y < 0 || CanvasMouse.y > CanvasMouse.height) {
				trace._zoomAmendY = 0;
			}
		}
		if (evType == "touchmove") {
			var changeScale = (distance - trace._zoomStartDistance) * 0.01;
			trace._zoomStartDistance = distance;

			var nowTranslateStartX = (t0.pageX + t1.pageX) >> 1,
				nowTranslateStartY = (t0.pageY + t1.pageY) >> 1,
				offsetX = nowTranslateStartX - trace._translateStartX,
				offsetY = nowTranslateStartY - trace._translateStartY;
			trace._translateStartX = nowTranslateStartX;
			trace._translateStartY = nowTranslateStartY;
			//平移 and 缩放
			if (changeScale > 0 || state.scale > 0.2) {
				var cmd = Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
					_: {
						scale: changeScale,
						x: changeScale * trace._zoomAmendX + offsetX,
						y: changeScale * trace._zoomAmendY + offsetY
					}
				});
				viewer.executeCommond(cmd);
			}
		}
	},
	/**
	 * 双击
	 * @return {[type]} [description]
	 */
	dblClickCallback: function(t) {
		var viewer = Cateyes.ViewerManager.getCurrentViewer(),
			CanvasMouse = viewer.positioner.getMouseXYofCanvas(t.pageX, t.pageY);
		var scale = viewer.positioner.state.scale,
			toScale = scale >= 2 ? 1 : 3,
			moveX = -(CanvasMouse.x - 256) * (toScale - scale),
			moveY = -(CanvasMouse.y - 256) * (toScale - scale);
		var cmd = Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
			scale: toScale,
			_: {
				x: moveX,
				y: moveY
			}
		});
		viewer.executeCommond(cmd);
	},
	showCustomWindow: function() {
		if (this.$customWindowSetter) {
			this.$customWindowSetter.removeClass("hide").$ww.focus();
		} else {
			var html = [
				'<div class="toolbar-custom-windowsetter hide">',
				'	<div class="toolbar-custom-windowsetter-header">自定义<i class="icon-remove"></i></div>',
				'	<div class="toolbar-custom-windowsetter-body"><form>',
				'		<ul>',
				'			<li>窗宽<input type="text" class="custom-ww" /></li>&nbsp;&nbsp;&nbsp;&nbsp;',
				'			<li>窗位<input type="text" class="custom-wc" /></li>',
				'		</ul>',
				'		<button type="submit">确定</button>',
				'	</form></div>',
				'</div>'
			];
			var $customWindowSetter = this.$customWindowSetter = $(html.join('')).appendTo($('body')),
				$ww = $customWindowSetter.$ww = $('.custom-ww', $customWindowSetter).focus(),
				$wc = $('.custom-wc', $customWindowSetter),
				self = this;
			$("i", $customWindowSetter).on('click', function() {
				$customWindowSetter.addClass("hide");
			});
			$("form", $customWindowSetter).on('submit', function() {
				var ww = $.trim($ww.val()),
					wc = $.trim($wc.val());
				if (ww == '' || isNaN(ww) || wc == '' || isNaN(wc)) {
					return false;
				} else {
					self.normalOperate('SET_WINDOW|{windowWidth:' + ww + ',windowCenter:' + wc + '}');
					$ww.val('');
					$wc.val('');
					$customWindowSetter.addClass("hide");
				}
				return false;
			});
			setTimeout(function() {
				$customWindowSetter.removeClass("hide");
			}, 0);
		}
	}
};

Toolbar.init();