/**
 * DICOM帮助类
 *
 * author : fanll
 *
 * createTime : 2015-07-20
 * 
 * @return {[type]} [description]
 */
(function() {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	var DicomHelper = Cateyes.DicomHelper = {
		/**
		 * 灰度值转ct值
		 * @param  {[type]} gray      [description]
		 * @param  {[type]} dicomInfo [description]
		 * @return {[type]}           [description]
		 */
		grayToCT: function(gray, dicomInfo) {
			return gray * dicomInfo.rescaleSlope + dicomInfo.rescaleIntercept;

		},
		/**
		 * ct值转灰度值
		 * @param  {[type]} ct        [description]
		 * @param  {[type]} dicomInfo [description]
		 * @return {[type]}           [description]
		 */
		cTToGray: function(ct, dicomInfo) {
			return (ct - dicomInfo.rescaleIntercept) / dicomInfo.rescaleSlope;
		},
		/**
		 * 获取图像方向
		 * @param  {[type]} imageOrientationPatient [description]
		 * @return {[type]}                         [description]
		 */
		ORIENTATION: {
			'100010': 'AXIAL', //轴状位
			'10000-1': 'CORONAL', //冠状位
			'01000-1': 'SAGITTAL' //矢状面
		},
		getImageOrientation: function(imageOrientationPatient) {
			if (imageOrientationPatient) {
				var fori = [];
				for (var i = 0, l = imageOrientationPatient.length; i < l; i++) {
					fori.push(Math.round(imageOrientationPatient[i]));
				}
				return this.ORIENTATION[fori.join('')];
			}
		}
	};
})();