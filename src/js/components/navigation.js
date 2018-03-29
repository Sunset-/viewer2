class Navigation {

	constructor() {
		this.initEvent();
	}

	/**
	 * 初始化事件
	 * @return {[type]} [description]
	 */
	initEvent() {
		var $listWrap = $(".dicom-list-wrap"),
			$list = this.$list = $(".left-side-studys"),
			$trigger = $(".image-panel-trigger"),
			self = this;
		$trigger.on('click', function () {
			$trigger.toggleClass('close');
			if ($listWrap.toggleClass('close').hasClass('close')) {
				self._translate($listWrap[0], -$list.width());
				$trigger.attr('title', "展开影像列表");
			} else {
				self._translate($listWrap[0], 0);
				$trigger.attr('title', "收起影像列表");
			}
		});
		//拖拽事件
		var $body = $('body'),
			$dragThumbnail = $('<img class="drag-thumbnail" />').hide().appendTo($body),
			dragging = false;

		function dragCallback(ev) {
			$dragThumbnail.css({
				display: 'block',
				left: ev.pageX - 65,
				top: ev.pageY - 65
			});
		}

		function dropCallback(ev) {
			var $tgt = $(ev.target);
			dragging = false;
			$dragThumbnail.hide();
			$body.unbind(Cateyes.EVENTS.MOUSE_MOVE, dragCallback);
			$body.unbind(Cateyes.EVENTS.MOUSE_UP, dropCallback);
			Cateyes.GlobalPubSub.publish('RESTORE_OPERATE');
			var $viewer;
			if ($tgt.hasClass('.cateyes-viewer-multi-wrap')) {
				$viewer = $tgt;
			}
			if ($viewer || ($viewer = $tgt.closest('.cateyes-viewer-multi-wrap')).length) {
				self.viewSeries($viewer.data('id'), $dragThumbnail.data('seriesuid'))
			}
		}
		$list.on(Cateyes.EVENTS.MOUSE_DOWN, '.series-thumbnail', function () {
			var $this = $(this);
			dragging = true;
			$dragThumbnail.attr('src', $this.attr('src')).data('seriesuid', $this.attr('data-seriesuid'));
			$body.on(Cateyes.EVENTS.MOUSE_MOVE, dragCallback);
			$body.on(Cateyes.EVENTS.MOUSE_UP, dropCallback);
			Cateyes.GlobalPubSub.publish('STOP_OPERATE');
		});
		$list.on('click', '.series-thumbnail', function () {
			self.viewSeries(Cateyes.ViewerManager.getCurrentMultiViewer().id, $(this).attr('data-seriesuid'))
			var frameindex = $(this).attr('data-frameindex');
			if(frameindex){
				Cateyes.ViewerManager.getCurrentMultiViewer().getViewer(0).player.jump(frameindex);
			}
		});
		$list.on('click', '.series-switch', function () {
			$(this).closest('.left-side-study').toggleClass('close');
		});
		//检查加载
		Cateyes.GlobalPubSub.subscribe('AFTER_LOAD_STUDY', function (study) {
			self.addStudy(study);
		});
		//dicom加载
		Cateyes.GlobalPubSub.subscribe('AFTER_DICOM_LOADED', function (params) {
			self.changeProgress(params);
		});
		//文字标注
		Cateyes.GlobalPubSub.subscribe('SHOW_TEXT_MARKER', function (params) {
			self.showTextMarker(params);
		});
	}

	_translate(el, x) {
		var stl = el.style,
			buff = [];
		buff.push("translate(");
		buff.push(x);
		buff.push("px,0px)");
		buff = buff.join("");
		// 兼容各浏览器
		stl.transform = buff;
		stl.oTransform = buff;
		stl.msTransform = buff;
		stl.mozTransform = buff;
		stl.webkitTransform = buff;
	}

	/**
	 * 加载检查
	 * @param {[type]} study [description]
	 */
	addStudy(study) {
		var html = [];
		html.push('<div class="left-side-study">');
		//html.push('<div>' + (study.info.name?(study.info.name.split(study.info.name.indexOf(' ') >= 0 ? ' ' : '')[0] + ' * *'):'') + '</div>');
		html.push(`<div>${study.info.patientName}</div>`);
		html.push('<div>' + Cateyes.Utils.formatDate(study.info.studyDate,'yyyy-MM-dd') + '</div>');
		html.push('<div>' + study.info.deviceType + '</div>');
		//精简模式
		html.push('<ul>');
		for (var i = 0, s; s = study.series[i++];) {
			html.push('<li>');
			html.push('<span class="tag-device-' + (s.info.seriesName + '').toLowerCase() + '">' + s.info.seriesName + '</span>');
			html.push('<img class="series-thumbnail" src="' + (Cateyes.IMAGE_RESOUCE_PREFIX + s.frames[0].thumbnail) + '" data-seriesuid="' + s.info.uid + '" alt="">');
			html.push('<div class="progress-wrap"><div class="progress progress-series-' + s.id + '"></div></div>');
			html.push('<p class="left-side-series-num">' + s.frames.length + '张</p>');
			html.push('</li>');
		}
		html.push('</ul>');
		//详细模式
		for (var i = 0, s; s = study.series[i++];) {
			html.push('<ol>');
			html.push(`<li class="li-title">${s.info.seriesName}</li>`);
			s.frames.forEach((f,index)=>{
				html.push(`<li><img class="series-thumbnail" data-seriesuid="${s.info.uid}" data-frameindex="${index}" src="${Cateyes.IMAGE_RESOUCE_PREFIX + f.thumbnail}" /></li>`);
			})
			html.push('</ol>');
		}
		html.push('<label class="series-switch"></label>')
		html.push('</div>');
		if ((this.$scrollContainer = $('.mCSB_container', this.$list)).length) {
			this.$scrollContainer.append(html.join(''));
		} else {
			this.$list.append(html.join(''));
		}
		//滚动条
		this.$list.mCustomScrollbar();
	}

	/**
	 * 变更加载进度
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	changeProgress(params) {
		$(".progress-series-" + params.series.id).css({
			width: params.loaded * 1.0 / params.total * 100 + '%'
		});
	}

	/**
	 * 查看影像
	 * @param  {[type]} viewerId  [description]
	 * @param  {[type]} seriesUid [description]
	 * @return {[type]}           [description]
	 */
	viewSeries(viewerId, seriesUid) {
		Cateyes.ViewerManager.getMultiViewerById(viewerId).setSeries(Cateyes.DicomHolder.getSeriesByUid(seriesUid));
	}

	/**
	 * 显示文字标注器
	 * @param  {[type]} params [description]
	 * @return {[type]}        [description]
	 */
	showTextMarker(params) {
		var $textMarker = this._$textMarker;
		if (!$textMarker) {
			var html = [
				'<div class="text-marker-editor">',
				'<i class="icon-remove"></i>',
				'	<form onsubmit="return false;">',
				'		<textarea></textarea>',
				'		<button type="submit">标注</button>',
				'	</form>',
				'</div>'
			].join('');
			$textMarker = this._$textMarker = $(html).appendTo($('body'));
			$('form', $textMarker).on('submit', function () {
				var viewerId = $textMarker.data('viewerid'),
					text = $textMarker._$text.val().trim();
				if (text != "") {
					var viewer = Cateyes.ViewerManager.getViewerById(viewerId);
					viewer.executeCommond(Cateyes.ViewerCommondFactory.create('CMD_MARK_CREATE', {
						type: "TEXT",
						params: {
							text: text,
							sx: $textMarker.data('cx'),
							sy: $textMarker.data('cy')
						}
					}));
					viewer.executeCommond(Cateyes.ViewerCommondFactory.create('CMD_MARK_CREATED'));
					$textMarker._$text.val("");
					$textMarker.hide();
				}
				return false;
			});
			$('i', $textMarker).on('click', function () {
				$textMarker.hide()._$text.val("");
			});
			$textMarker._$text = $('textarea', $textMarker);
		}
		$textMarker.css({
			left: params.mx,
			top: params.my
		}).data('cx', params.cx).data('cy', params.cy).data('viewerid', params.viewerId).show()._$text.focus();
	}
}

export default Navigation;