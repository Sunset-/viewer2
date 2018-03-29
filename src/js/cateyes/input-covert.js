/**
 * 输入转换
 * @return {[type]} [description]
 */
(function () {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 * 全局鼠标代理
	 */
	var Mouse = Cateyes.Mouse = (function () {
		var MouseEvent = Cateyes.EVENTS;
		var Mouse = {
			x: 0,
			y: 0,
			isDowned: false,
			button: "LEFT", // 鼠标按下的键(0:左键,1:中键,2:右键)
			offsetX: 0, // 鼠标落下移动后的X位移
			offsetY: 0, // 鼠标落下移动后的Y位移
			ev: null,
			state: {}
		};
		var $el = $('.cateyes-major-content');
		var _mLastX = 0,
			_mLastY = 0,
			_mStartX = 0,
			_mStartY = 0;
		$el.on(MouseEvent.MOUSE_MOVE, function (ev) {
			if (ev.originalEvent) {
				ev = ev.originalEvent;
			}
			var pX = ((ev.touches || [])[0] || ev).pageX,
				pY = ((ev.touches || [])[0] || ev).pageY;
			Mouse.ctrlKey = ev.ctrlKey;
			Mouse.altKey = ev.altKey;
			Mouse.x = pX;
			Mouse.y = pY;
			Mouse.offsetX = pX - _mStartX;
			Mouse.offsetY = pY - _mStartY;
			Mouse.moveX = pX - _mLastX;
			Mouse.moveY = pY - _mLastY;
			_mLastX = pX;
			_mLastY = pY;
			Mouse.isMove = true;
			if (Mouse.moveX != 0 || Mouse.moveY != 0) {
				Mouse.touchEnd = false;
				Mouse.touchStart = false;
			} else {
				return false;
			}
		});
		$el.on(MouseEvent.MOUSE_DOWN, function (ev) {
			if (ev.originalEvent) {
				ev = ev.originalEvent;
			}
			Mouse.button = ev.touches ? 'LEFT' : ({
				'0': 'LEFT',
				'1': 'MIDDLE',
				'2': 'RIGHT'
			}[ev.button]);
			Mouse.moveX = 0;
			Mouse.moveY = 0;
			_mLastX = _mStartX = Mouse.startX = Mouse.x = ((ev.touches || [])[0] || ev).pageX;
			_mLastY = _mStartY = Mouse.startY = Mouse.y = ((ev.touches || [])[0] || ev).pageY;
			Mouse.ctrlKey = ev.ctrlKey;
			Mouse.altKey = ev.altKey;
			Mouse.touchStart = true;
			Mouse.isDowned = true;
			Mouse.touchEnd = false;
			this.isMove = false;
			Mouse.offsetX = 0;
			Mouse.offsetY = 0;
			ev.preventDefault();
		});
		$el.on(MouseEvent.MOUSE_UP, function (ev) {
			if (ev.originalEvent) {
				ev = ev.originalEvent;
			}
			Mouse.moveX = 0;
			Mouse.moveY = 0;
			Mouse.ctrlKey = ev.ctrlKey;
			Mouse.altKey = ev.altKey;
			Mouse.touchStart = false;
			Mouse.touchEnd = true;
			Mouse.isDowned = false;
			this.isMove = false;
		});
		return Mouse;
	})();



	/**
	 * 输入转换器
	 * @type {Object}
	 */
	Cateyes.InputCovert = {
		coverts: {},
		getCovert: function (type, params) {
			if (this.coverts[type]) {
				if (!params) {
					return this.coverts[type];
				} else {
					var self = this;
					return function () {
						return self.coverts[type].call(null, params);
					}
				}
			} else if (Cateyes.ViewerCommondFactory.has(type)) {
				return function () {
					return Cateyes.ViewerCommondFactory.create(type, params);
				}
			}
		}
	};

	/**
	 * 特殊转换器
	 * @type {[type]}
	 */
	var ci = Cateyes.InputCovert.coverts;

	//切换激活窗
	ci.ACTIVE_VIEWER = function (params) {
		Cateyes.ViewerManager.activeViewer(params);
	}

	//检索
	ci.BROWSE = function (params) {
		if (params) {
			return Cateyes.ViewerCommondFactory.create('CMD_BROWSE', {
				to: params
			});
		} else if (Mouse.isDowned && Mouse.isMove && Mouse.moveY != 0) {
			return Cateyes.ViewerCommondFactory.create('CMD_BROWSE', {
				to: params || (Mouse.moveY > 0 ? 'NEXT' : 'PREV')
			});
		}
	}

	//播放
	ci.PLAY = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_PLAY', params);
	}

	//快照
	ci.SNAPSHOOT = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_SNAPSHOOT', params);
	}

	//多窗
	ci.VIEWER_GRID = function (params) {
		return function () {
			Cateyes.ViewerManager.initGrid(params.rows, params.cols);
		}
	}
	//多图
	ci.VIEWER_MULTI = function (params) {
		return function () {
			var multiViewer = Cateyes.ViewerManager.getCurrentMultiViewer();
			multiViewer && multiViewer.initGrid(params.rows, params.cols);
		}
	}

	//标记关键帧
	ci.KEYIMAGE = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_KEYIMAGE', params);
	}

	//窗宽窗位
	ci.CHANGE_WINDOW = function () {
		if (Mouse.isDowned && Mouse.isMove) {
			var step = 1;
			// var viewer = Cateyes.ViewerManager.getCurrentViewer();
			// if(viewer){
			// 	var d = viewer.getPlayer().getCurrentDicom();
			// 	if(d){
			// 		var f = d.info.frames[0].maxGray-d.info.frames[0].minGray;
			// 		if(f>30000){
			// 			step = 20;
			// 		}
			// 	}
			// }
			return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
				_: {
					windowWidth: '+' + Mouse.moveX * step,
					windowCenter: '+' + Mouse.moveY * step
				}
			});
		}
	};

	//窗宽窗位
	ci.SET_WINDOW = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
			windowWidth: params.windowWidth,
			windowCenter: params.windowCenter
		});
	};

	//亮度
	ci.CHANGE_LUMINANCE = function () {
		if (Mouse.isDowned && Mouse.isMove) {
			return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
				_: {
					luminance: '+' + -Mouse.moveY
				}
			});
		}
	}

	//对比度
	ci.CHANGE_CONTRAST = function () {
		if (Mouse.isDowned && Mouse.isMove) {
			return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
				_: {
					contrast: '+' + -Mouse.moveY
				}
			});
		}
	}

	//对比度
	ci.CHANGE_INTENSITY = function () {
		if (Mouse.isDowned && Mouse.isMove) {
			return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
				_: {
					intensity: '+' + -Mouse.moveY
				}
			});
		}
	}

	//缩放
	var zoomOffset = 0;
	ci.ZOOM = function () {
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		if (viewer) {
			if (Mouse.touchStart) {
				var CanvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.x, Mouse.y);
				Mouse.state._zoomAmendX = CanvasMouse.width / 2 - CanvasMouse.x;
				Mouse.state._zoomAmendY = CanvasMouse.height / 2 - CanvasMouse.y;
				if (CanvasMouse.x < 0 || CanvasMouse.x > CanvasMouse.width) {
					Mouse.state._zoomAmendX = 0;
				}
				if (CanvasMouse.y < 0 || CanvasMouse.y > CanvasMouse.height) {
					Mouse.state._zoomAmendY = 0;
				}
			}
			if (Mouse.isDowned && Mouse.isMove) {
				var state = viewer.positioner.getState(),
					changeScale = Mouse.moveY * 0.01;
				if (changeScale < 0 && state.scale <= 0.1) {
					return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
						scale: 0.1
					});
				}
				return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
					_: {
						scale: changeScale,
						x: changeScale * Mouse.state._zoomAmendX,
						y: changeScale * Mouse.state._zoomAmendY
					}
				});
			}
		}
	};

	//设置缩放大小
	ci.SET_SCALE = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
			scale: params.scale
		});
	};

	//平移
	ci.TRANSLATE = (function () {
		var startX,
			startY;
		return function () {
			if (Mouse.touchStart) {
				var viewer = Cateyes.ViewerManager.getCurrentViewer(),
					state;
				if (viewer) {
					state = viewer.positioner.getState();
					startX = state.x;
					startY = state.y;
				}
			} else if (Mouse.isDowned && Mouse.isMove) {
				return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
					x: startX + Mouse.offsetX,
					y: startY + Mouse.offsetY
				});
			}
		};
	})();

	//设置平移
	ci.SET_TRANSLATE = function (params) {
		return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
			x: params.x,
			y: params.y
		});
	};

	//水平翻转
	ci.HORIZONTAL_TURN = function () {
		return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
			_: {
				horizontal: '*-1'
			}
		});
	};
	//垂直翻转
	ci.VERTICAL_TURN = function () {
		return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
			_: {
				vertical: '*-1'
			}
		});
	};

	//自由旋转
	ci.FREEDOM_ROTATE = function () {
		if (Mouse.isDowned && Mouse.isMove) {
			return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
				_: {
					rotate: '+' + Mouse.moveY
				}
			});
		}
	}

	//左转
	ci.ROTATE_LEFT = function () {
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		if (viewer) {
			var state = viewer.positioner.getState();
			//var step = -(state.horizontal * state.vertical * 90);
			return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
				_: {
					rotate: '-90' //(step < 0 ? '' : '+') + step
				}
			});
		}
	};
	//右转
	ci.ROTATE_RIGHT = function () {
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		if (viewer) {
			var state = viewer.positioner.getState();
			//var step = state.horizontal * state.vertical * 90;
			return Cateyes.ViewerCommondFactory.create('CMD_TRANSFORM', {
				_: {
					rotate: '+90' //(step < 0 ? '' : '+') + step
				}
			});
		}
	};

	//反色
	ci.INVERSE = function () {
		return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
			_: {
				isInverse: '^true'
			}
		});
	};

	//灰化
	ci.ASHING = function () {
		return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
			_: {
				isAshing: '^true'
			}
		});
	};

	//伪彩
	ci.PSEUDOCOLOR = function () {
		return Cateyes.ViewerCommondFactory.create('CMD_TINT', {
			_: {
				isPseudoColor: '^true'
			}
		});
	};


	//文字标注输入框
	ci.SHOW_TEXT_MARKER = function () {
		if (Mouse.touchStart) {
			var viewer = Cateyes.ViewerManager.getCurrentViewer();
			if (viewer) {
				var canvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.x, Mouse.y, true);
				Cateyes.GlobalPubSub.publish('SHOW_TEXT_MARKER', {
					viewerId: viewer.id,
					mx: Mouse.x,
					my: Mouse.y,
					cx: canvasMouse.x,
					cy: canvasMouse.y
				});
			}
		}
	};

	//标注创建公共接口
	ci.MARK_CREATE_BASE = function (condition) {
		var viewer = Cateyes.ViewerManager.getCurrentViewer();
		if (viewer) {
			var marker = viewer.marker,
				startCanvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.startX, Mouse.startY, true),
				canvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.x, Mouse.y, true);
			if (canvasMouse && startCanvasMouse) {
				var creatingMarker = marker.getCreatingMark();
				if (creatingMarker && condition.creating) {
					//创建中
					var params = null;
					if (Cateyes.Utils.isFunction(condition.creatingCallback)) {
						params = condition.creatingCallback({
							sx: startCanvasMouse.x,
							sy: startCanvasMouse.y,
							ex: canvasMouse.x,
							ey: canvasMouse.y
						}, creatingMarker.params);
					} else {
						params = {
							sx: startCanvasMouse.x,
							sy: startCanvasMouse.y,
							ex: canvasMouse.x,
							ey: canvasMouse.y
						};
					}
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_CREATING', params);
				} else if (!marker.getCurrentMark() && !creatingMarker && condition.create) {
					var params = null;
					if (Cateyes.Utils.isFunction(condition.createCallback)) {
						params = condition.createCallback({
							sx: startCanvasMouse.x,
							sy: startCanvasMouse.y,
							ex: canvasMouse.x,
							ey: canvasMouse.y
						});
					} else {
						params = {
							sx: startCanvasMouse.x,
							sy: startCanvasMouse.y,
							ex: canvasMouse.x,
							ey: canvasMouse.y
						};
					}
					//创建
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_CREATE', {
						type: condition.markType,
						params: params
					});
				}
			}
		}
	};

	//标注刷新公共接口
	ci.MARK_REFRESH_BASE = (function () {
		var startX,
			startY;
		return function (condition) {
			var viewer = Cateyes.ViewerManager.getCurrentViewer();
			if (viewer) {
				var marker = viewer.marker,
					state = viewer.positioner.getState(),
					startCanvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.startX, Mouse.startY),
					canvasMouse = viewer.positioner.getMouseXYofCanvas(Mouse.x, Mouse.y);
				if (marker.getCreatingMark() && (Mouse.touchStart || Mouse.touchEnd)) {
					//完成创建
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_CREATED');
				} else if (marker.getCurrentMark() && Mouse.isDowned) {
					var mark = marker.getCurrentMark();
					if (Mouse.touchStart) {
						mark.startMove();
					}
					//刷新
					var state = viewer.positioner.getState();
					var vX = Mouse.offsetX / state.scale,
						vY = Mouse.offsetY / state.scale;
					var sink = Math.sin(Math.PI / 180 * (-state.rotate)),
						cosk = Math.cos(Math.PI / 180 * (-state.rotate));
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_REFRESH', {
						_: {
							x: (vX * cosk - vY * sink) * state.horizontal,
							y: (vX * sink + vY * cosk) * state.vertical
						}
					});
				} else if (Mouse.touchEnd) {
					//离开
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_LEAVE');
				} else if ((!Mouse.isDowned || (Mouse.isDowned && Mouse.touchStart)) && !marker.getCreatingMark()) {
					//激活
					return Cateyes.ViewerCommondFactory.create('CMD_MARK_ACTIVE', {
						x: canvasMouse.x,
						y: canvasMouse.y
					});
				}
			}
		};
	})();


	//直线测量
	ci.MARK_PYS_LENGTH = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'PYS_LENGTH',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}

	//角度测量
	ci.MARK_PYS_ANGLE = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'PYS_ANGLE',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: true,
			creatingCallback: function (params) {
				if (Mouse.isDowned) {
					return params;
				} else {
					return {
						ex: params.ex,
						ey: params.ey
					};
				}
			}
		});
	}

	//单点CT
	ci.MARK_CT_POINT = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'CT_POINT',
			create: Mouse.isDowned && Mouse.touchStart,
			creating: Mouse.isDowned
		});
	}

	//箭头标注
	ci.MARK_ARROWS = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'ARROWS',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}

	//矩形CT标注
	ci.MARK_CT_RECT = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'CT_RECT',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}

	//椭圆CT标注
	ci.MARK_CT_ELLIPSE = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'CT_ELLIPSE',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}

	//手涂区域CT
	ci.MARK_CT_SCRAWL = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'CT_SCRAWL',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}

	//涂鸦
	ci.MARK_SCRAWL = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'SCRAWL',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: Mouse.isDowned
		});
	}


	//杯盘比标注
	ci.MARK_CUP_DISC_RATIO = function () {
		return ci.MARK_CREATE_BASE({
			markType: 'CUP_DISC_RATIO',
			create: Mouse.isDowned && Mouse.isMove && (!Mouse.touchStart),
			creating: true,
			createCallback: function (params, markerParams) {
				return {
					csx: params.sx,
					csy: params.sy,
					cex: params.ex,
					cey: params.ey
				};
			},
			creatingCallback: function (params, markerParams) {
				if (!markerParams.cupFinish) {
					return {
						csx: params.sx,
						csy: params.sy,
						cex: params.ex,
						cey: params.ey
					};
				} else if (markerParams.discStart) {
					return {
						dsx: params.sx,
						dsy: params.sy,
						dex: params.ex,
						dey: params.ey
					};
				} else {
					return {};
				}
			}
		});
	}



	/******************************** 进阶功能 ******************************/

	//MPR重建
	ci.MPR_REBUILD = function () {
		return function () {
			var currentViewer = Cateyes.ViewerManager.getCurrentViewer();
			if (currentViewer) {
				var currentSeries = currentViewer.getSeries();
				if (currentSeries) {
					//分三窗
					Cateyes.ViewerManager.initGrid(0, 0);
					Cateyes.ViewerManager.initGrid(1, 3);
					//绑定同一序列
					Cateyes.ViewerManager.getViewerByIndex(0).setSeries(currentSeries).tinter.mpr('AXIAL');
					Cateyes.ViewerManager.getViewerByIndex(1).setSeries(currentSeries).tinter.mpr('CORONAL');
					Cateyes.ViewerManager.getViewerByIndex(2).setSeries(currentSeries).tinter.mpr('SAGITTAL');
				}
			}
		};
	};

	//双屏
	ci.DOUBLE_WINDOW = function () {
		return function () {
			var currentViewer = Cateyes.ViewerManager.getCurrentViewer();
			if (currentViewer) {
				var currentSeries = currentViewer.getSeries();
				if (currentSeries) {
					var strudySeries = currentSeries.study.series;
					var count = Math.min(strudySeries.length, 2);
					//分两窗
					Cateyes.ViewerManager.initGrid(0, 0);
					Cateyes.ViewerManager.initGrid(1, count);
					//绑定同一序列
					for (var i = 0; i < count; i++) {
						Cateyes.ViewerManager.getViewerByIndex(i).setSeries(strudySeries[i]).reset();
					}
				}
			}
		};
	};

	//RGB过滤重建
	ci.RGB_REBUILD = function () {
		return function () {
			var currentViewer = Cateyes.ViewerManager.getCurrentViewer();
			if (currentViewer) {
				var currentSeries = currentViewer.getSeries();
				var index = currentViewer.player.getIndex();
				if (currentSeries) {
					//分四窗
					Cateyes.ViewerManager.initGrid(0, 0);
					Cateyes.ViewerManager.initGrid(2, 2);
					//绑定同一序列
					var viewer;
					Cateyes.ViewerManager.getViewerByIndex(0).setSeries(currentSeries).reset();
					viewer = Cateyes.ViewerManager.getViewerByIndex(1).setSeries(currentSeries);
					viewer.player.jump(index);
					viewer.tinter.rgb(false, true, true);
					viewer = Cateyes.ViewerManager.getViewerByIndex(2).setSeries(currentSeries);
					viewer.player.jump(index);
					viewer.tinter.rgb(true, false, true);
					viewer = Cateyes.ViewerManager.getViewerByIndex(3).setSeries(currentSeries);
					viewer.player.jump(index);
					viewer.tinter.rgb(true, true, false);
				}
			}
		};
	};

	//放大镜
	ci.MAGNIFYING_GLASS = (function () {
		var $magnifyingGlass,
			width = 400,
			height = 300;

		function initDom() {
			if (!$magnifyingGlass) {
				$magnifyingGlass = $('<div class="cateyes-magnifying-glass"><canvas></canvas></div>').css({
					'position': 'absolute',
					'width': width,
					'height': height,
					'border': '2px solid #09c',
					'z-index': 9999,
					'background': '#000'
				}).hide().appendTo($('body'));
				var cvs = $('canvas', $magnifyingGlass)[0];
				cvs.width = width;
				cvs.height = height;
				$magnifyingGlass._canvas = cvs;
				$magnifyingGlass._context = cvs.getContext('2d');
				$magnifyingGlass._scale = 2;
			}
			return $magnifyingGlass;
		}
		return function () {
			var currentViewer = Cateyes.ViewerManager.getCurrentViewer(),
				canvasMouse = currentViewer.positioner.getMouseXYofCanvas(Mouse.x, Mouse.y),
				$glass = initDom();
			if (Mouse.touchEnd) {
				$glass.hide();
			} else if (Mouse.isDowned) {
				$glass._init = true;
				if (Mouse.touchStart) {
					$glass.show();
					$glass._init = false;
				}
				var left = Mouse.x - width - 50,
					top = Mouse.y - height - 50;
				if (left < 0) {
					left = Mouse.x + 50;
				}
				if (top < 0) {
					top = Mouse.y + 50;
				}
				$glass.css({
					left: left,
					top: top
				});
			}
			return Cateyes.ViewerCommondFactory.create('CMD_MAGNIFYING_GLASS', {
				$container: $glass,
				x: canvasMouse.x,
				y: canvasMouse.y
			});
		}
	})();



	/******************************** 设置 ******************************/
	ci.TOGGLE_FULLSCREEN = (function () {
		try {
			var isFullScreen = false,
				docElm = window.top.document.documentElement,
				doc = window.top.document,
				funs = {
					open: (function () {
						//W3C 
						if (docElm.requestFullscreen) {
							return function () {
								docElm.requestFullscreen();
							};
						}
						//FireFox 
						else if (docElm.mozRequestFullScreen) {
							return function () {
								docElm.mozRequestFullScreen();
							};
						}
						//Chrome等 
						else if (docElm.webkitRequestFullScreen) {
							return function () {
								docElm.webkitRequestFullScreen();
							};
						}
						//IE11 
						else if (elem.msRequestFullscreen) {
							return function () {
								elem.msRequestFullscreen();
							};
						}
					})(),
					close: (function () {
						if (doc.exitFullscreen) {
							return function () {
								doc.exitFullscreen();
							};
						} else if (doc.mozCancelFullScreen) {
							return function () {
								doc.mozCancelFullScreen();
							};
						} else if (doc.webkitCancelFullScreen) {
							return function () {
								doc.webkitCancelFullScreen();
							};
						} else if (doc.msExitFullscreen) {
							return function () {
								doc.msExitFullscreen();
							};
						}
					})()
				};
			Cateyes.GlobalPubSub.subscribe('AFTER_TOGGLE_FULLSCREEN', function (isFull) {
				isFullScreen = isFull;
			});
			return function () {
				funs[(isFullScreen = !isFullScreen) ? 'open' : 'close']();
			};
		} catch (e) {}
	})();
	ci.TOGGLE_INFO = function () {
		return function () {
			var viewer = Cateyes.ViewerManager.getViewerByIndex(0);
			var infoP = viewer.getPlugins("QuadrangleInfo");
			infoP && infoP.toggleShow();
		};
	};

	ci.TOGGLE_POSITION_LINE = function () {
		return function () {
			var viewer = Cateyes.ViewerManager.getViewerByIndex(0);
			var pl = viewer.getPlugins("PositionLine");
			pl && pl.toggleShow();
		};
	}



})();