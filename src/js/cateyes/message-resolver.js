/**
 *websokct 消息解析器
 *
 * 
 * 
 */

(function() {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	Cateyes.MessageResolver = {
		analysis: function(msg) {
			if (msg && msg.length) {
				msg = JSON.parse(msg);
				var temp, obj, params;
				for (var alias in msg) {
					obj = this._getObj(alias);
					obj.setJson(msg[alias]);
				}
			}
		},
		_getObj: function(alias) {
			var temp = alias.split("|");
			if (temp.length == 1) {
				if (alias.indexOf('VIEWER_') == 0) {
					var viewer = Cateyes.ViewerManager.getViewerById(temp[0].split("_")[1]);
					return viewer;
				} else if (alias == "VIEWERMANAGER") {
					return Cateyes.ViewerManager;
				}
			} else {
				var viewer = Cateyes.ViewerManager.getViewerById(temp[0].split("_")[1]);
				return Cateyes.Utils.getAttribute(viewer, temp[1]);
			}
		},
		_getParams: function(params) {
			return JSON.parse(params);
		}
	}
})();