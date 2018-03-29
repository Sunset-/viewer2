class Initer {

	constructor() {
		this.initViewStudies();
		Cateyes.isPlat("PHONE") || this.initWebsocket();
	}

	// TEST_STUDYIDS = '3b00a6c3dba64b6a970a0030f601dfaf,57025f27083344baa3c2611badbe1887,d66b3da129e24c1f8cf1fb3698eb26e9,6265b20c90294a4ca99c53f882df4ce0,f355c24988bc460fa67073c85d508f1e,f710f11bb36c403999cbe806c0312f5f,fdf133fc172244dcb88b314151ee5a01';
	// TEST_STUDYIDS = 'test.json';
	TEST_STUDYIDS = '/business/cateyes/card/image?cardId=d3477f5fa8ac48eb8a4bef28213f6081&type=eyeground'

	/**
	 * 获取URL参数
	 * @param  {[type]} name [description]
	 * @return {[type]}      [description]
	 */
	getQueryString(name) {
		var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return unescape(r[2]);
		return null;
	}

	/**
	 * 初始化查看影像检查
	 * @return {[type]} [description]
	 */
	initViewStudies() {
		let studyIds = this.getQueryString('studyIds'),// || this.TEST_STUDYIDS,
			type = this.getQueryString('type');
		
		if (studyIds) {
			// let urls = studyIds.split(',').map((item) => `/${which?which:'service'}/fileRes/dcmJson?listId=${item}`);
			let urls = studyIds.split(',').map((studyId) => {
				return {
					STUDY : '/image-service/imageInfo/cateyes/STUDY_ID',
					EYEGROUND : '/service/business/cateyes/card/image?cardId=STUDY_ID&type=eyeground'
				}[type||'STUDY'].replace('STUDY_ID',studyId);
			});
			Cateyes.DicomService.getStudies(urls, null).then(function (studies) {
				if (studies && studies.length && studies[0]) {
					if (Cateyes.isPlat("PHONE")) {
						Cateyes.ViewerManager.init($('.cateyes-major-content'), '1*1');
						Cateyes.ViewerManager.setCurrentViewer(Cateyes.ViewerManager.getViewerByIndex(0));
						Cateyes.ViewerManager.getCurrentViewer(0).setSeries(studies[0].getSeriesByIndex(0));
					} else {
						var firstStudySeriesCount = studies[0].getSeriesCount();
						var viewer_grid = {
							'1': '1*1',
							'2': '1*2',
							'3': '1*3',
							'4': '2*2',
							'5': '2*3',
							'6': '2*3',
							'7': '3*3',
							'8': '3*3',
							'9': '3*3'
						};
						var viewerCount = Math.min(firstStudySeriesCount, 4);
						Cateyes.ViewerManager.init($('.cateyes-major-content'), viewer_grid[viewerCount]);
						for (var i = 0; i < viewerCount; i++) {
							Cateyes.ViewerManager.getMultiViewerByIndex(i).setSeries(studies[0].getSeriesByIndex(i));
						}
					}
				}
			});
		}
	}

	/**
	 * 初始化websocket连接
	 * @return {[type]} [description]
	 */
	initWebsocket() {
		var houseId = this.getQueryString('houseId');
		if (houseId) {
			document.title = '虚拟阅片室';
			Cateyes.SocketPubSub.subscribe(Cateyes.SOCKET_EVENTS.SK_CONNECT_OPENED, function () {
				Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_INIT_CHAT);
				Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_CLONE);
			});
			Cateyes.SocketPubSub.publish(Cateyes.SOCKET_EVENTS.SK_OPEN_CONNECT);
		}
	}
}

export default Initer;