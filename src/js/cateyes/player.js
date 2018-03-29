/**
 * dicom播放器
 */
(function () {
	var Cateyes = window.Cateyes || (window.Cateyes = {});

	var Player = Cateyes.Player = Cateyes.ClassHelper.extend(Cateyes.PubSub, function (viewer) {
		this.viewer = viewer;
		this.init();
	}, {
		/**
		 * 初始化
		 * @return {[type]} [description]
		 */
		init: function () {
			this._initDom();
			var series = this.viewer.getSeries();
			if (series) {
				this.dicomIterator = series.getIterator();
				this.state.index = 0;
				this.calculateTotal();
				this.refreshProgress();
				this.refreshMarkFragment();
				this.refreshSlider();
				this.viewer.publish(Cateyes.CustomEvents.AFTER_BROWSE_DICOM);
				this.viewer.render();
			}
			this.inited = true;
		},
		_initDom: function () {
			if (!this.inited) {
				this.state = {
					index: 0,
					total: 0,
					fps: 1
				};
				var $header = this.viewer.$header,
					$progressBar = this.$progressBar = $('<div class="cateyes-searcher-progressbar"></div>').appendTo($header),
					$progress = this.$progress = $('<div class="cateyes-searcher-progress"></div>').appendTo($progressBar),
					$slider = this.$slider = $('<div class="cateyes-searcher-slider"></div>').appendTo($progressBar),
					self = this;
				Cateyes.GlobalPubSub.subscribe(Cateyes.CustomEvents.AFTER_DICOM_LOADED, function (params) {
					self.refreshProgress(params);
					//DSC自动播放
					if (params.loaded == params.total) {
						var series = self.viewer.getSeries();
						if (series && series.info.seriesInstanceUID == params.series.info.seriesInstanceUID && series.info.autoPlay) {
							self.togglePlay(true);
						}
					}
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_BIND_SERIES, function (series) {
					self.init();
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_MARK_CHANGE, function () {
					self.refreshMarkFragment();
				});
				this.viewer.subscribe(Cateyes.CustomEvents.REFRESH_MARK_TAG, function () {
					self.refreshMarkFragment();
				});
				this.viewer.subscribe(Cateyes.CustomEvents.AFTER_MPR_REBUILD, function () {
					self.calculateTotal();
				});
				Cateyes.GlobalPubSub.subscribe(Cateyes.CustomEvents.AFTER_SINGLE_MARK_CHANGE, function (params) {
					var series = self.viewer.getSeries();
					if (series && params && params.viewerId != self.viewer.id && params.seriesInstanceUID == series.info.seriesInstanceUID) {
						self._drawMarkFragment(params.index, true);
					}
				});
				this._initEvent();
			} else {
				this.$progress.width(0);
			}
		},
		_initEvent: function () {
			var $header = this.viewer.$header,
				$progressBar = this.$progressBar,
				$slider = this.$slider,
				self = this;
			$header.on(Cateyes.EVENTS.CLICK, function (ev) {
				if (ev.originalEvent) {
					ev = ev.originalEvent;
				}
				var mx = ((ev.touches || [])[0] || ev).pageX,
					offset = $header.offset();
				self.jump(Math.floor((mx - offset.left) / $progressBar.width() * self.state.total));
				return false;
			});
		},
		getState: function () {
			return this.state;
		},
		getProgressBar: function () {
			return this.$progressBar;
		},
		/**
		 * 刷新进度
		 * @param  {[type]} params [description]
		 * @return {[type]}        [description]
		 */
		refreshProgress: function (params) {
			if (!params || params.series == this.viewer.getSeries()) {
				var itor;
				if (itor = this.dicomIterator) {
					var loadedCount = itor.getLoadedCount(),
						total = this.state.total;
					this.$progress.width((loadedCount * 1.0 / total) * 100 + '%');
					if (loadedCount == total) {
						this.refreshMarkFragment();
					}
				}
			}
		},
		/**
		 * 刷新游标
		 * @return {[type]} [description]
		 */
		refreshSlider: function () {
			var index = this.state.index,
				total = this.state.total,
				singleWidth = 100 / total;
			this.$slider.css({
				'left': (index + 0.5) * singleWidth + '%',
				'right': 'auto'
			});
		},
		/**
		 * 标注片段
		 * @return {[type]} [description]
		 */
		refreshMarkFragment: function () {
			var series = this.viewer.getSeries();
			if (series) {
				var dicoms = series.getLoaded();
				if (dicoms && dicoms.length) {
					for (var index in dicoms) {
						this._drawMarkFragment(index);
					}
				}
			}
		},
		_drawMarkFragment: function (index, silent) {
			index = +index;
			var dicom = this.dicomIterator.getByIndex(index),
				marks = dicom && dicom.marks;
			if (marks && marks.length) {
				var $frag = $('.mark-fragment-' + index, this.$progressBar);
				if (!$frag.length) {
					var total = this.state.total,
						singleWidth = 100 / total;
					$frag = $('<div class="cateyes-mark-fragment mark-fragment-' + index + '"></div>').css({
						left: (index + 0.5) * singleWidth + '%'
					}).appendTo(this.$progressBar);
				}
				$frag.addClass('marked');
			} else {
				$('.mark-fragment-' + index, this.$progressBar).remove();
			}
			if (!silent) {
				Cateyes.GlobalPubSub.publish(Cateyes.CustomEvents.AFTER_SINGLE_MARK_CHANGE, {
					viewerId: this.viewer.id,
					seriesInstanceUID: this.viewer.getSeries().info.seriesInstanceUID,
					index: index,
					markCount: marks && marks.length || 0
				});
			}
		},
		/**
		 * 获取当前Dicom
		 * @return {[type]} [description]
		 */
		getCurrentDicom: function () {
			return this.dicomIterator && (this.dicomIterator.getByIndex(this.state.index) || this.dicomIterator.getByIndex(0));
		},
		getStep() {
			return this._step || 1;
		},
		setStep(step) {
			return this._step = step || 1;
		},
		prev: function (silent) {
			this.dicomIterator && this.jump(this.state.index - this.getStep(), silent, 'prev');
		},
		next: function (silent) {
			this.dicomIterator && this.jump(this.state.index + this.getStep(), silent, 'next');
		},
		jump: function (index, silent, ev) {
			if (!this.dicomIterator) {
				return;
			}
			var total = this.state.total;
			index = index % total;
			if (index < 0) {
				index += total;
			}
			var itr = this.dicomIterator,
				from = itr.getIndex(),
				lastItem = itr.getCurrent(),
				item = itr.gotoIndex(this.state.index = index);
			//if (item && lastItem != item) {
			this.refreshSlider();
			this.viewer.render();
			if (silent) {
				this.viewer.publish(Cateyes.CustomEvents.AFTER_BROWSE_DICOM_SILIENT);
			} else {
				silent || this.viewer.publish(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, {
					event: ev || 'jump',
					from: from,
					to: index,
					total: total
				});
			}
			//}
			silent || this.synchronizeCloud();
		},
		calculateTotal: function () {
			var orientation = this.viewer.tinter.state.orientation,
				series = this.viewer.getSeries(),
				total = 0,
				currentIndex = this.state.index;
			if (orientation == series.info.orientation) {
				total = series.getTotal();
			} else {
				if (series.info.orientation == 'AXIAL') {
					if (orientation == 'CORONAL') {
						total = series.info.height;
					} else {
						total = series.info.width;
					}
				} else {
					if (orientation == 'AXIAL') {
						total = series.info.height;
					} else {
						total = series.info.width;
					}
				}
				//this.state.index = total / 2;
			}
			if (currentIndex >= total) {
				this.state.index = 0;
			}
			this.state.total = total;
		},
		getIndex: function () {
			return this.state.index;
		},
		getTotal: function () {
			return this.state.total;
		},
		isPlaying: function () {
			return !!this.state.playing && !this.state.pause;
		},
		togglePlay: function (forcePlay) {
			this.state.fps = this.viewer.getSeries().info.recommendedDisplayFrameRate || this.state.fps;
			if (forcePlay) {
				this.play();
			} else {
				this[this.state.playing ? 'stop' : 'play']();
			}
			Cateyes.GlobalPubSub.publish(Cateyes.CustomEvents.AFTER_VIEWER_STATUS_CHANGE);
			this.viewer.publish(Cateyes.CustomEvents.AFTER_PLAY_OR_STOP);
		},
		play: function () {
			this.state.playing = true;
			this.state.pause = false;
			if (this.state.playing) {
				this._play();
			} else {
				this.stop();
			}
			this.viewer.getPlugins('PlayControl');
		},
		stop: function () {
			this.state.playing = false;
			this.state.pause = false;
			if (this._playTimer) {
				clearTimeout(this._playTimer);
			}
		},
		pause: function () {
			this.state.pause = true;
			if (this._playTimer) {
				clearTimeout(this._playTimer);
			}
		},
		_play: function () {
			var self = this;
			if (this._playTimer) {
				clearTimeout(this._playTimer);
			}
			if (this.isPlaying()) {
				this._playTimer = setTimeout(function () {
					self.next();
					self._play();
				}, 1000 * 1.0 / this.state.fps);
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
			var json = {};
			json['VIEWER_' + this.viewer.getViewerId() + '|player'] = JSON.stringify(this.state);
			return json;
		},
		setJson: function (json) {
			var params = JSON.parse(json);
			this.jump(params.index, true);
			this.viewer.publish(Cateyes.CustomEvents.AFTER_BROWSE_DICOM);
		}
	});

})();