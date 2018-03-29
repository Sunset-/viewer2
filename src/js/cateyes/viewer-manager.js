/**
 * 
 * 阅片器管理器
 *
 * author : fanll
 *
 * createTime :2015-07-31
 * 
 * 
 */
(function() {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 * 阅片器管理器
	 * @type {Object}
	 */
	Cateyes.ViewerManager = {
		currentViewer: null,
		currentMultiViewer : null,
		getCurrentViewer: function() {
			return this.currentViewer;
		},
		setCurrentViewer: function(viewer) {
			if (this.currentViewer) {
				this.currentViewer.getContainer().closest('.cateyes-viewer-container').removeClass('active');
			}
			this.currentViewer = viewer;
			if (viewer) {
				viewer.getContainer().closest('.cateyes-viewer-container').addClass('active');
			}
		},
		getCurrentMultiViewer: function() {
			return this.currentMultiViewer;
		},
		setCurrentMultiViewer: function(multiViewer) {
			if (this.currentMultiViewer) {
				this.currentMultiViewer.getContainer().parent().removeClass('active');
			}
			this.currentMultiViewer = multiViewer;
			if (multiViewer) {
				this.currentViewer = multiViewer.getFirstViewer();
				multiViewer.getContainer().parent().addClass('active');
			}
		},
		getViewerById: function(id) {
			return Cateyes.ViewerFactory.get(id);
		},
		getViewerByIndex: function(index) {
			return this.getViewerById($(".cateyes-viewer").eq(index).data('cateyes-viewer-id'));
		},
		getMultiViewerById: function(id) {
			return Cateyes.MultiViewerFactory.get(id);
		},
		getMultiViewerByIndex: function(index) {
			return this.getMultiViewerById($(".cateyes-viewer-multi-wrap").eq(index).data('id'));
		},
		getAllViewers: function() {
			var vs = [],
				viewers = this.viewers;
			for (var v in viewers) {
				if (viewers.hasOwnProperty(v)) {
					vs.push(viewers[v]);
				}
			}
			return vs;
		},
		viewers: {

		},
		GRID: {
			'1*1': true,
			'1*2': true,
			'2*2': true,
			'1*3': true,
			'2*3': true,
			'3*3': true,
			'1*4': true,
			'2*4': true,
			'3*4': true,
			'4*4': true
		},
		/**
		 * 初始化
		 * @param  {[type]} $el  [description]
		 * @param  {[type]} grid [description]
		 * @return {[type]}      [description]
		 */
		init: function($el, grid) {
			if (!$el) {
				return;
			}
			this.$container = $('<div></div>').css({
				width: '100%',
				height: '100%',
				position: 'relative'
			}).appendTo($el);
			this.grid = this.GRID[grid] ? grid : '1*1';
			var grid = this.grid.split('*');
			this.initGrid(+grid[0], +grid[1]);
			this.initEvent();
		},
		/**
		 * 初始化网格
		 * @param  {[type]} grid [description]
		 * @return {[type]}      [description]
		 */
		initGrid: function(rows, cols, silent) {
			var total = this.total = rows * cols;
			this.rows = rows;
			this.cols = cols;
			var $wraps = this.$container.children('.cateyes-viewer-container'),
				wrapCount = $wraps.length;
			//调整数量
			if (wrapCount > total) {
				var viewerId;
				for (var i = total; i < wrapCount; i++) {
					viewerId = $(".cateyes-viewer-multi-wrap", $wraps.eq(i)).data('id');
					Cateyes.MultiViewerFactory.recover(viewerId+'');
					delete this.viewers[viewerId];
					$wraps.eq(i).remove();
				}
			} else if (wrapCount < total) {
				for (var i = wrapCount; i < total; i++) {
					var $wrap = $('<div class="cateyes-viewer-container">').css({
						'position': 'relative',
						'box-sizing': 'border-box',
						'overflow': 'hidden',
						display: 'inline-block'
					});
					var $el = $('<div></div>').appendTo($wrap);
					var viewer = Cateyes.MultiViewerFactory.create($el, i);
					this.viewers[viewer.id] = viewer;
					if (!Cateyes.ViewerManager.getCurrentMultiViewer()) {
						Cateyes.ViewerManager.setCurrentMultiViewer(viewer);
					}
					$wrap.appendTo(this.$container);
				}
			}
			$('.cateyes-viewer-container').css('display', 'inline-block');
			this.refresh();
			silent || this.synchronizeCloud();
		},
		initEvent: function() {
			var self = this;
			//双击放大
			//手机端无需此操作
			if(Cateyes.getPlat()=='PHONE'&&!Cateyes.isPad()){
				return;
			}
			var dbTime = 0;
			this.$container.on(Cateyes.EVENTS.MOUSE_DOWN, '.cateyes-viewer-container', function(ev) {
				var now = new Date().getTime(),
					touches = ev.originalEvent.touches;
				if (touches && touches.length == 2) {
					return;
				}
				if (now - dbTime <= 240) {
					self.toggleViewerFullScreen(Cateyes.ViewerManager.getMultiViewerById($('.cateyes-viewer-multi-wrap', $(this)).data('id')));
				} else {
					dbTime = now;
				}
			});
		},
		toggleViewerFullScreen: function(viewer) {
			if (viewer) {
				var $container = viewer.getContainer().parent();
				if ($container.toggleClass('full-screen').hasClass('full-screen')) {
					$container.css({
						width: '100%',
						height: '100%'
					});
					$container.siblings('.cateyes-viewer-container').css('display', 'none');
				} else {
					$container.css({
						width: $container.data('width'),
						height: $container.data('height')
					});
					$container.siblings('.cateyes-viewer-container').css('display', 'inline-block');
				}
				this.synchronizeCloud();
				viewer.center();
			}
		},
		/**
		 * 刷新样式
		 * @return {[type]} [description]
		 */
		refresh: function() {
			var $wraps = this.$container.children('.cateyes-viewer-container'),
				wrapWidth = 100 / this.cols,
				wrapHeight = 100 / this.rows;
			for (var i = 0, l = $wraps.length; i < l; i++) {
				$wraps.eq(i).css({
					width: wrapWidth + '%',
					height: wrapHeight + '%'
				}).removeClass('full-screen').data('width', wrapWidth + '%').data('height', wrapHeight + '%');
			}
			//刷新所有viewer
			var viewers = this.viewers;
			for (var k in viewers) {
				if (viewers.hasOwnProperty(k)) {
					viewers[k].reset();
				}
			}
		},
		getFullShowViewerIndex: function() {
			var $els = $('.cateyes-viewer-container'),
				index = '';
			for (var i = 0, l = $els.length; i < l; i++) {
				if ($els.eq(i).hasClass('full-screen')) {
					index = i;
					break;
				}
			}
			return index;
		},
		activeViewer: function(witch) {
			var index = +this.getCurrentMultiViewer().id,
				total = this.total;
			switch (witch) {
				case 'NEXT':
					index++;
					break;
				case 'PREV':
					index--;
					break;
				default:
					index = +witch;
					break;
			}
			if (index < 0) {
				index += total;
			}
			if (index >= total) {
				index -= total;
			}
			var v = this.getMultiViewerByIndex(index);
			v && v.active();
		},
		/**
		 * 云同步
		 * @return {[type]} [description]
		 */
		synchronizeCloud: function() {
			if (Cateyes.CatCloud.isOnline()) {
				Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_SEND_MESSAGE, this.getJson());
			}
		},
		getJson: function() {
			return {
				VIEWERMANAGER: JSON.stringify({
					rows: this.rows,
					cols: this.cols,
					full: this.getFullShowViewerIndex()
				})
			};
		},
		setJson: function(json) {
			var grid = JSON.parse(json);
			this.initGrid(grid.rows, grid.cols, true);
			if (grid.full !== '') {
				var $fullShowViewer = $('.cateyes-viewer-container').eq(grid.full);
				$fullShowViewer.css({
					width: '100%',
					height: '100%'
				});
				$fullShowViewer.siblings('.cateyes-viewer-container').css('display', 'none');
			}
		}
	};

})();