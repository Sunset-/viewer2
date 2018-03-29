/**
 * Dicom服务（处理加载/格式化/缓存）
 *
 * author : fanll
 *
 * createTime : 2015-07-30
 *
 */
(function () {

	var DicomService = Cateyes.namespace('Cateyes.DicomService', {
		cache: {},
		studies: [],
		/**
		 * 获取多个检查
		 */
		getStudies: function (studyIds, keysUrl) {
			return Promise.all(studyIds.map(studyId=>{
				return this.getStudy(studyId);
			}));
		},
		/**
		 * 获取检查
		 */
		getStudy: function (studyId) {
			var self = this;
			if (self.cache[studyId]) {
				return Promise.resolve(self.cache[studyId]);
			} else {
				return self._fetchStudyInfo(studyId);
			}
		},
		/**
		 * 获取所有检查
		 *
		 * @param  {[type]} studyId [description]
		 * @return {[type]}         [description]
		 */
		getAllStudies: function () {
			return this.studies;
		},
		_fetchStudyInfo: function (studyId) {
			var self = this;
			Cateyes.loading();
			return $.ajax({
				url: studyId,
				type: 'GET',
				cache: true,
				headers: {
					Accept: 'application/json, text/plain, */*'
				},
			}).then(function (res) {
				Cateyes.loading(false);
				if (res && res.code == 200 && res.data) {
					var study = new Cateyes.Entity.Study(res.data);
					self.cache[studyId] = study;
					self.studies.push(study);
					self._loadBusinessInfo(study);
					Cateyes.GlobalPubSub.publish('AFTER_LOAD_STUDY', study);
					return study;
				}
			});
		},
		getSeries: function (studyId, seriesId) {
			//var study = this.getStudy('/' + studyId + '/' + studyId + '.json');
			var study = this.getStudy(studyId);
			return study.then(function (sy) {
				return sy.getSeries(seriesId);
			});
		},
		_loadBusinessInfo: function (study) {
			var cpb;
			if (cpb = window.parent.window.CateyesPubSub) {
				var replyMarks = cpb.replyMarks || {},
					studyMarks;
				if (studyMarks = replyMarks[study.studyInfo.studyInstanceUID]) {
					study.setMarks(studyMarks)
				}
			}
		}
	});

	//业务钩子挂载
	var cpb;
	if (cpb = window.parent.window.CateyesPubSub) {
		cpb.getAllMarks = function () {
			var allStudies = Cateyes.DicomService.getAllStudies();
			var markDicomCount = 0;
			if (allStudies && allStudies.length) {
				var marks,
					markCache = {};
				for (var i = 0, study; study = allStudies[i++];) {
					marks = study.getMarks();
					if (marks) {
						markCache[study.studyInfo.studyInstanceUID] = marks;
					}
				}
			}
			return markCache;
		}
	}
})();