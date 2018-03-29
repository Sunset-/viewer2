/**
 *  阅片器
 *
 *  createTime : 2015-07-20
 *
 *  updateTime : 2015-07-20
 *
 */
(function (window, undefined) {

    var Cateyes = window.Cateyes || (window.Cateyes = {});

    Cateyes.MultiViewerFactory = {
        map: {},
        list: [],
        /**
         * 创建
         * @param  {[type]} el  [description]
         * @param  {[type]} ops [description]
         * @return {[type]}     [description]
         */
        create: function ($el, id) {
            var viewer;
            viewer = new MultiViewer($el, id);
            this.map[id] = viewer;
            return viewer;
        },
        /**
         * 回收
         * @param  {[type]} viewer [description]
         * @return {[type]}        [description]
         */
        recover: function (viewer) {
            if (Cateyes.Utils.isString(viewer)) {
                viewer = this.get(viewer);
            }
            viewer.close();
            // this.list.push(viewer);
        },
        /**
         * 获取
         * @param  {[type]} id [description]
         * @return {[type]}    [description]
         */
        get: function (id) {
            return this.map[id];
        }
    }

    /**
     * Dicom浏览器
     */
    var MultiViewer = Cateyes.MultiViewer = function ($el, id) {
        this.init($el, id);
    }
    Cateyes.ClassHelper.extend(Cateyes.PubSub, MultiViewer, {
        /**
         * 初始化
         * @return {[type]} [description]
         */
        init: function ($el, id) {
            this.id = id;
            this.$viewers = [];
            this.viewers = [];
            this._initDom($el);
            this.initGrid(1, 1);
        },
        initGrid(rows, cols) {
            var total = this.total = rows * cols;
            this.rows = rows;
            this.cols = cols;
            var $wraps = this.$container.children('.cateyes-viewer-box'),
                wrapCount = $wraps.length;
            //调整数量
            if (wrapCount > total) {
                var viewerId;
                for (var i = total; i < wrapCount; i++) {
                    viewerId = $(".cateyes-viewer", $wraps.eq(i)).data('cateyes-viewer-id');
                    Cateyes.ViewerFactory.recover(viewerId + '');
                    this.viewers.pop();
                    $wraps.eq(i).remove();
                }
            } else if (wrapCount < total) {
                for (var i = wrapCount; i < total; i++) {
                    var $wrap = $('<div class="cateyes-viewer-box"><div class="cateyes-viewer-body"></div></div>').css({
                        'position': 'relative',
                        'box-sizing': 'border-box',
                        display: 'inline-block'
                    });
                    this.$container.append($wrap);
                    var viewer = Cateyes.ViewerFactory.create($('.cateyes-viewer-body', $wrap), `${this.id}-${i}`);
                    this.viewers.push(viewer);
                }
            }
            this.refresh();
            this._initViewerEvent();
        },
        /**
         * 刷新样式
         * @return {[type]} [description]
         */
        refresh: function () {
            var $wraps = this.$container.children('.cateyes-viewer-box'),
                wrapWidth = 100 / this.cols,
                wrapHeight = 100 / this.rows;
            for (var i = 0, l = $wraps.length; i < l; i++) {
                $wraps.eq(i).css({
                    width: wrapWidth + '%',
                    height: wrapHeight + '%'
                }).removeClass('full-screen').data('width', wrapWidth + '%').data('height', wrapHeight + '%');
            }
            //刷新所有viewer
            var step = this.viewers.length;
            this.viewers.forEach((viewer, index) => {
                viewer.player.setStep(step);
            });
            if (this.series) {
                this.setSeries(this.series);
            }
        },
        _initViewerEvent() {
            this.viewers.forEach((viewer, index) => {
                if (viewer.__bindMultiViewerEvent) {
                    return;
                }
                viewer.__bindMultiViewerEvent = true;
                //浏览
                viewer.subscribe(Cateyes.CustomEvents.AFTER_BROWSE_DICOM, (params) => {
                    if (params) {
                        this.viewers.forEach((viewer, currentIndex) => {
                            if (index != currentIndex) {
                                viewer.player.jump(params.to + (currentIndex - index), true);
                            }
                        });
                    }
                });
                //位置
                viewer.subscribe(Cateyes.CustomEvents.POSITION, (state) => {
                    if (state) {
                        this.viewers.forEach((viewer, currentIndex) => {
                            if (index != currentIndex) {
                                viewer.positioner.refresh(state, true);
                            }
                        });
                    }
                });
                //渲染状态
                viewer.subscribe(Cateyes.CustomEvents.AFTER_TINT_DICOM, (state) => {
                    if (state) {
                        var stateJson = JSON.stringify(state);
                        this.viewers.forEach((viewer, currentIndex) => {
                            if (index != currentIndex) {
                                viewer.getSeries() && viewer.tinter.setJson(stateJson);
                            }
                        });
                    }
                });
            });
        },
        getViewerId: function () {
            return this.id;
        },
        getViewer(i){
            return this.viewers[i];
        },
        /**
         * 初始化结构
         */
        _initDom: function ($el) {
            this.$container = $el.addClass('cateyes-viewer-multi-wrap').data('id', this.id).css({
                'box-sizing': 'border-box',
                'width': '100%',
                'height': '100%'
            });
            this.$container.parent().on(Cateyes.EVENTS.MOUSE_DOWN, () => {
                this.active();
            });
        },
        /**
         * 初始化事件
         */
        _initEvents: function () {

        },
        getContainer: function () {
            return this.$container;
        },
        //门户方法
        /**
         * 绑定序列
         * @param {[type]} series [description]
         */
        setSeries: function (series, silent) {
            this.series = series;
            this.viewers.forEach((viewer, index) => {
                viewer.setSeries(series, silent);
                while (index--) {
                    viewer.player.next(true);
                }
            });
            return this;
        },
        reset(reTinter) {
            this.viewers.forEach(viewer => {
                viewer.reset(reTinter);
            });
        },
        getFirstViewer() {
            return this.viewers[0];
        },
        center() {
            this.viewers.forEach(viewer => {
                viewer.positioner.center();
            });
        },
        /**
         * 激活
         * @return {[type]} [description]
         */
        active: function () {
            Cateyes.ViewerManager.setCurrentMultiViewer(this);
            return this;
        },
        /**
         * 关闭
         * @return {[type]} [description]
         */
        close: function () {
            //this.setSeries(null);
        }
    });

})(window);