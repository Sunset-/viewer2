(function() {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	/**
	 * 指令池
	 * @type {Object}
	 */
	var CommondPool = {

	};

	/**
	 * 指令工厂
	 */
	var ViewerCommondFactory = Cateyes.namespace('Cateyes.ViewerCommondFactory', {
		/**
		 * 指令类型
		 * @type {Object}
		 */
		TYPES: {},
		regist: function(commondType, commondConstructor) {
			commondConstructor.prototype.TYPE = commondType;
			this.TYPES[commondType] = commondConstructor;
		},
		/**
		 * 是否注册了某指令
		 * @return {Boolean} [description]
		 */
		has: function(commondType) {
			return !!this.TYPES[commondType];
		},
		/**
		 * 创建指令
		 * @param  {[type]} commondType [description]
		 * @param  {[type]} params      [description]
		 * @return {[type]}             [description]
		 */
		create: function(commondType, params) {
			if (this.TYPES[commondType]) {
				var cmdQueue = CommondPool[commondType] || (CommondPool[commondType] = []),
					cmd;
				if (cmdQueue.length) {
					cmd = CommondPool[commondType].shift();
					cmd.setParams(params);
				} else {
					cmd = new this.TYPES[commondType](params);
				}
				return cmd;
			}
		},
		/**
		 * 反序列化指令
		 * @param  {[type]} json [description]
		 * @return {[type]}      [description]
		 */
		deserialization: function(json) {
			if (Cateyes.Utils.isString(json)) {
				try {
					json = JSON.parse(json);
				} catch (e) {}
			}
			if (this.TYPES[json.cmd]) {
				return this.create(json.cmd, json.params);
			}
		}
	});

	/*******************************   指令内置对象解析器   ***********************************/

	//指令解析器
	var CommondParamsResolver = {
		resolve: function(params, viewer) {
			if (params) {
				if (params.$) {
					for (var k in params.$) {
						params[k] = this._resolveCmdStr(params.$[k], viewer);
					}
				}
				if (params._$) {
					var _ = params._ = params._ || {};
					for (var k in params._$) {
						_[k] = this._resolveCmdStr(params._$[k], viewer);
					}
				}
			}
		},
		_resolveCmdStr: function(cmdStr, viewer) {
			//CANVAS_X,CANVAS_Y
			if (viewer && cmdStr) {
				var $dicomCanvas = viewer.getCanvas('DICOM').$el,
					offset = $dicomCanvas.offset()
				dicomCanvasTransform = this._getTransformMatrix($dicomCanvas);
				var builtinVar = {
					CANVAS_OFFSET_LEFT: offset.left,
					CANVAS_OFFSET_TOP: offset.top,
					CANVAS_WIDTH: $dicomCanvas.width(),
					CANVAS_HEIGHT: $dicomCanvas.height(),
					CANVAS_SCALE_HORIZONTAL: dicomCanvasTransform.horizontal,
					CANVAS_SCALE_VERTICAL: dicomCanvasTransform.vertical
				};
				for (var k in builtinVar) {
					cmdStr = cmdStr.replaceAll('{' + k + '}', builtinVar[k]);
				}
				return cmdStr;
			}
		},
		_getTransformMatrix: function($el) {
			var matrix = $el.css('transform');
			matrix = matrix.substring(7, matrix.length - 1).split(',');
			return {
				horizontal: matrix[0],
				vertical: matrix[3]
			}
		}
	};



	/**
	 * 指令基类
	 */
	var ViewerCommond = function(params) {
		this.setParams(params);
	}
	ViewerCommond.prototype = {
		TYPE: 'BASE',
		/**
		 * 设置参数
		 */
		setParams: function(params) {
			this.params = params;
		},
		getParams: function() {
			return this.params;
		},
		/**
		 * 执行指令
		 * @param  {[type]} viewer [description]
		 * @return {[type]}        [description]
		 */
		execute: function(viewer) {
			//预处理指令
			var params = this.getParams();
			CommondParamsResolver.resolve(params, viewer);
			//执行指令(返回值表示 是否阻止同一用户事件中后续指令的执行)
			var stop = this._execute(viewer);
			//回收
			this.recover();
			return stop;
		},
		_execute: function(viewer) {
			throw new Error('execute 方法未在子类中实现');
		},
		/**
		 * 回收指令
		 * @return {[type]} [description]
		 */
		recover: function() {
			CommondPool[this.TYPE].push(this);
		},
		/**
		 * 序列化指令
		 */
		serialize: function() {
			return JSON.stringify({
				cmd: this.TYPE,
				params: this.params
			});
		}
	};

	/********************************   指令集   ************************************/


	/**
	 * 1.还原指令
	 * 
	 * params : 无
	 * 
	 */
	ViewerCommondFactory.regist('CMD_RESET', Cateyes.ClassHelper.extend(ViewerCommond, function() {}, {
		_execute: function(viewer) {
			viewer.positioner.reset();
			viewer.tinter.reset();
			viewer.render();
		}
	}));

	/**
	 * 2.平移，缩放，旋转，反转指令
	 *
	 * params : {
	 * x : 横坐标
	 * y ： 纵坐标
	 * scale ：缩放比例
	 * horizontal ： 水平比例
	 * vertical ：垂直比例
	 * rotate ：旋转角度
	 * }
	 * 
	 */
	ViewerCommondFactory.regist('CMD_TRANSFORM', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var params = this.getParams();
			params && viewer.transform(params);
		}
	}));

	/**
	 * 3.检索
	 *
	 * params:{
	 * to : 切换图（PREV,NEXT,index）
	 * }
	 * 
	 */
	ViewerCommondFactory.regist('CMD_BROWSE', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var params = this.getParams(),
				player = viewer.getPlayer();
			switch (params.to) {
				case 'NEXT':
					player.next();
					break;
				case 'PREV':
					player.prev();
					break;
				default:
					if (Cateyes.Utils.isNumber(params.to)) {
						player.jump(params.to);
					}
			}
		}
	}));

	/**
	 * 4.着色指令（窗宽窗位，反色，伪彩）
	 *
	 * params{
	 * windowWitdh :窗宽
	 * windowCenter : 窗位
	 * offsetWindowWitdh :变化窗宽
	 * offsetWindowCenter : 变化窗位
	 * }
	 */
	ViewerCommondFactory.regist('CMD_TINT', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var params = this.getParams();
			params && viewer.tinter.refresh(params);
			viewer.render();
		}
	}));

	/**
	 * 5.播放指令
	 */
	ViewerCommondFactory.regist('CMD_PLAY', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.player.togglePlay();
		}
	}));

	/**
	 * 6.快照指令
	 *
	 */
	ViewerCommondFactory.regist('CMD_SNAPSHOOT', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.snapshoot();
		}
	}));

	/**
	 * 7.显示隐藏四角信息
	 */
	ViewerCommondFactory.regist('CMD_TOGGLE_INFO', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var infoP = viewer.getPlugins("QuadrangleInfo");
			infoP && infoP.toggleShow();
		}
	}));


	/**
	 * 8.标记关键帧指令
	 */
	ViewerCommondFactory.regist('CMD_KEYIMAGE', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.keyImage();
		}
	}));


	/**
	 * 开始创建指令
	 *
	 * params{
	 * type : 标注类型
	 * params : 标注参数
	 * }
	 */
	ViewerCommondFactory.regist('CMD_MARK_CREATE', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.marker.setCreatingMark(viewer.marker.addMark(this.getParams(), true));
			viewer.marker.setCurrentMark(null);
			viewer.marker.refresh();
		}
	}));
	/**
	 * 创建中
	 */
	ViewerCommondFactory.regist('CMD_MARK_CREATING', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.marker.creatingMark(this.getParams());
		}
	}));
	/**
	 * 完成创建
	 */
	ViewerCommondFactory.regist('CMD_MARK_CREATED', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			return viewer.marker.createdMark(this.getParams());
		}
	}));
	/**
	 * 创建标注指令
	 */
	ViewerCommondFactory.regist('CMD_MARK_REFRESH', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.marker.refreshMark(this.getParams());
			return true;
		}
	}));
	/**
	 * 激活标注指令
	 */
	ViewerCommondFactory.regist('CMD_MARK_ACTIVE', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var params = this.getParams();
			var stop = params && viewer.marker.active(params);
			return stop;
		}
	}));
	/**
	 * 激活标注指令
	 */
	ViewerCommondFactory.regist('CMD_MARK_LEAVE', Cateyes.ClassHelper.extend(ViewerCommond, function() {}, {
		_execute: function(viewer) {
			viewer.marker.setCurrentMark(null);
		}
	}));

	/**
	 * 撤销标注指令
	 */
	ViewerCommondFactory.regist('CMD_MARK_REVOKE', Cateyes.ClassHelper.extend(ViewerCommond, function() {}, {
		_execute: function(viewer) {
			viewer.marker.revoke();
		}
	}));

	/**
	 * 清除标注指令
	 */
	ViewerCommondFactory.regist('CMD_MARK_CLEAR', Cateyes.ClassHelper.extend(ViewerCommond, function() {}, {
		_execute: function(viewer) {
			viewer.marker.clear();
		}
	}));



	/******************************** 进阶功能 ******************************/

	/**
	 * MPR重建
	 */
	ViewerCommondFactory.regist('CMD_MPR_REBUILD', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			viewer.tinter.mpr(this.getParams() && this.getParams().orientation);
		}
	}));

	/**
	 * 放大镜
	 */
	ViewerCommondFactory.regist('CMD_MAGNIFYING_GLASS', Cateyes.ClassHelper.extend(ViewerCommond, function(params) {
		this.setParams(params);
	}, {
		_execute: function(viewer) {
			var params = this.getParams(),
				$container = params.$container;
			// if(!$container._init){
			// }
			var cvs = $container._canvas,
				ctx = $container._context,
				scale = $container._scale,
				width = cvs.width,
				height = cvs.height;
			ctx.clearRect(0, 0, width, height)
			ctx.save();
			ctx.scale(scale, scale);
			ctx.translate(-params.x + (width / 2 / scale), -params.y + (height / 2 / scale));
			// ctx
			ctx.drawImage(viewer.getCanvas('DICOM'), 0, 0);
			ctx.restore();
		}
	}));
})();