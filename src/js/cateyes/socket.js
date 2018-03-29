/**
 * websocket 组件
 *
 * 实现实时交互功能
 *
 * @return {[type]} [description]
 */
(function() {

	var Cateyes = window.Cateyes || (window.Cateyes = {});

	var CatCloud = Cateyes.CatCloud = {
		_isOnline: false,
		isOnline: function() {
			return this._isOnline;
		}
	};

	var CateyesSocket = Cateyes.CateyesSocket = function() {
		this.init();
	};

	CateyesSocket.prototype = {
		URL: 'ws://117.34.72.19:9000/ws/internetop',
		/**
		 * 初始化
		 * @return {[type]} [description]
		 */
		init: function() {
			this.connect();
		},
		/**
		 * 连接
		 * @return {[type]} [description]
		 */
		connect: function() {
			var connection = this.connection,
				url = this.URL;
			if (connection != null) {
				this.disconnect();
			}
			if ('WebSocket' in window) {
				connection = new WebSocket(url);
			} else if ('MozWebSocket' in window) {
				connection = new MozWebSocket(url);
			} else {
				alert('WebSocket is not supported by this browser.');
				return;
			}
			this.connection = connection;
			this._initEvent();
		},
		_initEvent: function() {
			var self = this,
				connection = this.connection;
			connection.onopen = function() {
				Cateyes.SocketPubSub.publish(EVENTS.SK_CONNECT_OPENED);
				console.log('open');
			};
			connection.onmessage = function(evt) {
				var data;
				try {
					data = JSON.parse(evt.data);
				} catch (e) {
					console.log(e);
				}
				Cateyes.SocketPubSub.publish(EVENTS.SK_RECEIVE_MESSAGE, data || evt.data);
			};
			connection.onclose = function(evt) {
				if (self.connection) {
					console.log('断线重连');
					self.connect();
				} else {
					Cateyes.SocketPubSub.publish(EVENTS.SK_CONNECT_CLOSED);
				}
				console.log('close');
			};
			connection.onerror = function(evt) {
				console.log("WebSocketError!");
			};
		},
		/**
		 * 断开连接
		 */
		disconnect: function() {
			var connection = this.connection;
			this.connection = null;
			if (connection != null) {
				connection.close();
			}
			CatCloud._isOnline = false;
			Cateyes.SocketPubSub.publish('SK_CONNECT_CLOSEED');
		},
		/**
		 * 发送消息
		 * @return {[type]} [description]
		 */
		initChat: function(data) {
			this._send({
				type: 'INIT_CHAT',
				topic: '123456',
				data: JSON.stringify(data)
			});
			CatCloud._isOnline = true;
			console.log('init')
		},
		/**
		 * 发送消息
		 * @return {[type]} [description]
		 */
		sendMessage: function(data) {
			this._send({
				type: 'MESSAGE',
				topic: '123456',
				data: JSON.stringify(data)
			});
		},
		/**
		 * 克隆镜像
		 * @return {[type]} [description]
		 */
		cloneMirror: function() {
			this._send({
				type: 'CLONE_MIRROR',
				topic: '123456'
			});
			console.log('clone')
		},
		_send: function(msg) {
			if (this.connection.readyState == 1) {
				this.connection && this.connection.send(JSON.stringify(msg));
			}
		}
	};

	CateyesSocket.prototype.constructor = CateyesSocket;



	/*WEB SOCKET 实例*/
	var ws;
	var SocketPubSub = Cateyes.SocketPubSub = new Cateyes.PubSub();
	SocketPubSub.regist({
		SK_SEND_MESSAGE: function(msg) {
			if (!ws) {
				ws = new CateyesSocket();
			}
			ws.sendMessage(msg);
		},
		SK_RECEIVE_MESSAGE: function(json) {
			if (json.type == "MESSAGE" || json.type == "CLONE_MIRROR") {
				Cateyes.MessageResolver.analysis(json.data);
				if (json.type == "CLONE_MIRROR") {
					CatCloud._isOnline = true;
				}
			}
		},
		SK_CLONE: function() {
			if (!ws) {
				ws = new CateyesSocket();
			}
			ws.cloneMirror();
		},
		SK_OPEN_CONNECT: function() {
			if (!ws) {
				ws = new CateyesSocket();
			}
		},
		SK_INIT_CHAT: function(msg) {
			if (!ws) {
				ws = new CateyesSocket();
			}
			ws.initChat(msg);
		}
	});

	var EVENTS = Cateyes.SOCKET_EVENTS = {
		SK_CONNECT_OPENED: 'SK_CONNECT_OPENED',
		SK_CONNECT_CLOSED: 'SK_CONNECT_CLOSED',
		SK_SEND_MESSAGE: 'SK_SEND_MESSAGE',
		SK_RECEIVE_MESSAGE: 'SK_RECEIVE_MESSAGE',
		SK_CLONE: 'SK_CLONE',
		SK_OPEN_CONNECT: 'SK_OPEN_CONNECT',
		SK_INIT_CHAT: 'SK_INIT_CHAT'
	};

})();
