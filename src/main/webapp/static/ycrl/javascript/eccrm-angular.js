(function (window) {
    angular.module('eccrm.angular', [
        'eccrm.angular.base',
        'eccrm.angular.date',
        'eccrm.angular.string',
        'eccrm.angular.pagination',
        'eccrm.angular.picker',
        'eccrm.angular.adjustment',
        'eccrm.angular.route',
        // 依赖bindonce.js
        'pasvaz.bindonce'
    ]).config(['$httpProvider', function ($httpProvider) {
        // 给所有的ajax请求添加X-Requested-With header
        $httpProvider.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';
        $httpProvider.defaults.headers.common['Cache-Control'] = 'no-cache';
        $httpProvider.defaults.headers.common['If-Modified-Since'] = '0';
    }]);

//基本
    angular.module('eccrm.angular.base', ['ngCookies'])
        .service('Debounce', function () {
            var timer = null;
            return {
                delay: function (fn, delay) {
                    var context = this, args = arguments;
                    clearTimeout(timer);
                    timer = setTimeout(function () {
                        if (!angular.isFunction(fn)) return;
                        fn.apply(context, args);
                    }, delay);
                }
            }
        })
        .service('ArtDialog', function () {
            return {
                loading: function () {
                    return art.artDialog({
                        lock: true,
                        opacity: 0.3,
                        title: '消息',
                        drag: false,
                        esc: false,
                        resize: false,
                        show: false,
                        init: function () {
                            this.hide();
                        }
                    });
                }
            };
        })
        .service('CommonUtils', ['Debounce', '$window', '$q', '$parse', '$cookies', 'ArtDialog', function (Debounce, $window, $q, $parse, $cookies, ArtDialog) {
            function CommonUtils() {
            }

            var context;    // 用于CommonUtils中的方法间调用
            CommonUtils.prototype = {
                // Debounce延迟函数
                delay: Debounce.delay,

                // 返回上一个页面
                // 如果当前页面是IFRAME，并且ID是以iframe_开头的，则表示当前窗口为页签，当调用该方法时，移除此页签
                back: function (target) {
                    if (self.frameElement.tagName == "IFRAME" && self.frameElement.id && self.frameElement.id.indexOf("iframe_") == 0) {
                        (context || new CommonUtils()).addTab('remove', self.frameElement.id, target);
                    } else {
                        $window.history.back();
                    }
                },

                // 从Cookie中获取登录上下文信息
                // 返回值：{}
                // 对象中可获取的信息有id（员工id）、username（用户名）、employeeName（员工名称）
                loginContext: function () {
                    var id, username, employeeName;
                    if ($cookies['eccrmContext.id']) {
                        id = $cookies['eccrmContext.id'];
                        username = decodeURI(decodeURI($cookies['eccrmContext.username']));
                        employeeName = decodeURI(decodeURI($cookies['eccrmContext.employeeName']));
                    } else if ($cookies['AuthUser_LoginId']) {
                        username = $cookies['AuthUser_LoginId'];
                    }
                    return {
                        id: id,
                        username: username,
                        employeeName: employeeName
                    }
                },

                // 获取基于ContextPath的访问路径
                // 每一个使用此js的页面都要求提供在页面中window或window.angular对象中提供一个contextPathURL属性或者在页面中提供一个id为contextPath的属性
                // 如果以上两个都没有提供，则使用相对路径(./url)
                // 参数URL：一般以/开头
                contextPathURL: function (url) {
                    if (!url) return '';
                    var contextPath;
                    if (typeof window.contextPathURL == 'string') {
                        contextPath = window.contextPathURL;
                    } else if (window.angular && typeof window.angular.contextPathURL == 'string') {
                        contextPath = window.angular.contextPathURL;
                    } else {
                        var cp = angular.element('head base').attr('href') || angular.element('#contextPath').val();
                        if (typeof cp === 'string') {
                            contextPath = cp;
                        } else {
                            contextPath = '/';
                        }
                    }

                    var lastChar = contextPath.charAt(contextPath.length - 1);
                    var urlStartChar = url.charAt(0);
                    if (lastChar === '/' && urlStartChar === '/') {
                        return contextPath + url.substr(1);
                    } else if (lastChar !== '/' && urlStartChar !== '/') {
                        return contextPath + '/' + url;
                    }
                    return contextPath + url;
                }
                ,
                // 使用artDialog插件弹出一个提示框，当只有一个参数时，标题即为内容
                // 参数1（可选）：标题
                // 参数2（必须）：内容
                // 参数3（可选）：图标
                /**
                 * 使用artDialog插件弹出一个提示框，当只有一个参数时，标题即为内容
                 * @param {string} title 标题
                 * @param {string} content 内容
                 * @param {string} icon 图标
                 * @returns {ArtDialog}
                 */
                artDialog: function (title, content, icon) {
                    content = content || title;
                    if (!title || content == title) title = '信息';
                    if (art && angular.isFunction(art.dialog)) {
                        var obj = {
                            title: title,
                            content: content
                        };
                        if (typeof icon === 'string') {
                            obj.icon = icon;
                        }
                        art.dialog(obj);
                        return art;
                    } else {
                        alert(title + ':' + content);
                        throw '没有获得art对象!请确保加载了artDialog插件相关的js和css!';
                    }
                }
                ,
                /**
                 * 异步加载数据时显示一个loading效果（可以指定标题），加载过程中，页面不可点击
                 * 当数据加载完毕后关闭该效果，并返回响应的数据
                 * @param {object} promise required,延迟对象
                 * @param {string} title 如果不指定，则默认（Loading...）；如果类型为function，则将参数位数往前平移一位
                 * @param {function} successCallback 成功时回调，即响应了success:true
                 * @param {object} scope    如果指定了该参数，则在整个异步过程中，将会设置该form为invalid，当请求结束后，将会恢复；如果类型为function，则将参数位数再次平移一位
                 * @param {function} failCallback 失败时的回调
                 * @returns {boolean}
                 */
                loading: function (promise, title, successCallback, scope, failCallback) {
                    if (promise == null || typeof promise !== 'object') {
                        alert('CommonUtils.loading():错误的使用方式!请指定第一个参数为promise对象!');
                        return false;
                    }
                    var params = [promise, title, successCallback, scope, failCallback];
                    // 如果title的类型是function，则参数往前平移一位
                    if (typeof title === 'function') {
                        params[1] = null;           // title
                        params[2] = arguments[1];   // successCallback
                        params[3] = arguments[2];   //  scope
                        params[4] = arguments[3];   // failCallback
                    }
                    // 如果没有指定scope，则参数再次平移
                    if (typeof params[3] === 'function') {
                        params[4] = params[3];
                        params[3] = null;
                    }

                    // 如果
                    var loadingDialog = ArtDialog.loading();
                    // 如果没有未来对象，则直接返回


                    var id = this.randomID();// 与消息绑定

                    // 如果没有显示，则显示
                    loadingDialog.title(params[1]);
                    loadingDialog.show();

                    // 禁用form操作
                    var $scope = params[3];
                    if ($scope && $scope.form) {
                        $scope.form.$setValidity(id, false);
                    }
                    var $promise = promise.$promise || promise.promise || $q.when(promise);
                    $promise.then(function (data) {

                        // 恢复form操作
                        if ($scope && $scope.form) {
                            $scope.form.$setValidity(id, true);
                        }

                        // 关闭loading效果
                        loadingDialog.close();

                        // 回调处理
                        if (data.success == true) {
                            angular.isFunction(params[2]) && params[2].call(data, data);
                        } else {
                            angular.isFunction(params[4]) && params[4].call(data, data);
                        }
                    }, function (reason) {
                        loadingDialog.close();
                        art.artDialog({
                            lock: true,
                            opacity: 0.3,
                            title: '异常!',
                            drag: false,
                            esc: true,
                            resize: false,
                            show: true,
                            icon: 'error',
                            content: reason
                        });
                    });
                }
                ,
                /**
                 *@description 使用artDialog弹出一个带有success图标的成功提示框
                 * @param {string} content 内容
                 * @param {string} title [optional] 标题
                 */
                successDialog: function (content, title) {
                    title = title || '信息';
                    this.artDialog(title, content, 'succeed');
                }
                ,

                /**
                 * 使用artDialog弹出一个带有error图标的错误提示框
                 * @param {string} content 要显示的错误信息内容
                 * @param {string} title  [optional] 标题，默认为”错误“
                 */
                errorDialog: function (content, title) {
                    title = title || '错误';
                    this.artDialog(title, content, 'error');
                }
                ,

                /**
                 *  @description 获得一个$q延迟对象
                 * @return {object} $defer
                 */
                defer: function () {
                    return $q.defer();
                }
                ,
                /**
                 * @description 返回一个延迟对象,延迟对象的结果来自于外部函数
                 * @param {function} callback 回调函数，接收一个defer对象，当处理完成后，给这个defer对象注入结果（这个结果将是最终返回的结果）
                 * @param {object} options [optional] 其他配置项（目前不使用）
                 * @returns {object} $defer.promise
                 */
                promise: function (callback, options) {
                    if (!angular.isFunction(callback)) {
                        this.artDialog('错误', '使用promise方法必须传递一个回调函数!')
                    }
                    var fail;
                    var time = 0;
                    var timeoutFn;
                    if (angular.isObject(options)) {
                        time = options.timeout;
                        timeoutFn = options.timeoutFn;
                        fail = options.fail;
                    }


                    var defer = $q.defer();
                    var promise = defer.promise;

                    var then = promise.then;


                    // 如果指定时间没有返回结果，则自动超时
                    if (time && time > 0) {
                        setTimeout(function () {
                            defer.reject('请求超时!');
                            if (angular.isFunction(timeoutFn)) {
                                timeoutFn.call(defer, '请求超时!');
                            }
                        }, time);
                    }
                    callback(defer);
                    return promise;
                }
                ,
                /**
                 * @description 返回一个对象的promise对象,如果参数不是对象，则直接返回原对象
                 * @param {object} obj 需要转换成promise对象的对象
                 * @returns {object} promise
                 */
                parseToPromise: function (obj) {
                    if (!obj) return obj;
                    return obj.promise || obj.$promise || $q.when(obj);
                }
                ,
                /**
                 * @description 解析angularjs表达式
                 * @param {object} context 上下文
                 * @param {string} str 要被解析的字符串
                 * @param {string} newValue [optional] 要被设置的新的值
                 * @returns {*} 解析后的值
                 */
                parse: function (context, str, newValue) {
                    if (!angular.isObject(context) && str) {
                        this.artDialog('错误', '解析上下文必须是一个对象,被解析的字符串不能为空!')
                    }
                    var parsed = $parse(str, newValue);
                    return parsed(context);
                }
                ,
                /**
                 * @description 对字符串使用encodeURI进行两次编码，如果不是字符串，则直接返回
                 * @param {string} str 要被编码的字符串
                 * @returns {string} 编码后的字符串
                 */
                encode: function (str) {
                    if (typeof str === 'string') {
                        return encodeURI(encodeURI(str));
                    }
                    return str;
                }
                ,
                // funcs[]:要执行的函数链,，每个函数都拥有一个独立的$q.defer()对象
                //      执行完毕需要调用this.resolve()来说明正常执行完成或者this.reject()来说明函数异常终止，将不会执行后面的函数
                //      resolve和reject都将接收一个结果参数
                // success:成功后要执行的方法，接收一个参数（最后一个链式函数执行完毕后返回的值）
                // fail:失败后要执行的方法，接收一个参数（表明失败的原因）
                chain: function (funcs, success, fail) {
                    var defer = $q.defer();
                    var i = 0;
                    var value;
                    var func = function (callback) {
                        var innerDefer = $q.defer();
                        callback.call(innerDefer, value);
                        innerDefer.promise.then(function (successValue) {
                            value = successValue;
                            if (funcs.length == (i + 1)) {
                                success(successValue);
                                return;
                            }
                            i++;
                            func(funcs[i]);
                        }, function (failReason) {
                            defer.reject(failReason);
                        });
                    };
                    func(funcs[i]);
                    defer.promise.then(success, fail);
                    return defer.promise;
                }
                ,
                /**
                 * @description 删除指定对象/数组中的指定的属性(调用delete）
                 * @param {object|Array} obj 可以为对象或者数组（数组中的元素必须是一个对象）
                 * @param {string} attr 要从对象中删除的属性名称
                 */
                deleteAttr: function (obj, attr) {
                    if (angular.isObject(obj) || angular.isArray(obj)) {
                        if (!attr || typeof attr !== 'string') return;
                        if (angular.isObject()) {
                            delete obj[attr];
                        } else {
                            for (var i = 0; i < obj.length; i++) {
                                if (angular.isObject(obj[i])) {
                                    delete obj[i][attr];
                                }
                            }
                        }
                    }
                }
                ,
                /**
                 * @description 生成随机ID：值从0-9,a-z,A-Z以及_中随机产生
                 * @param {number} length [length=16] 要生成的id的长度
                 * @returns {string} 指定长度的随机字符串
                 */
                randomID: function (length) {
                    // 调整长度
                    length = parseInt(length);
                    if (length < 1) {
                        length = 16;
                    }
                    // 设置id元素
                    var keys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_'.split('');
                    var keyMaxIndex = keys.length;
                    // 产生id
                    var id = '';
                    (function () {
                        for (var i = length; i > 0; i--) {
                            var index = Math.floor(Math.random() * keyMaxIndex);
                            id += keys[index];
                        }
                    })();
                    return id;
                }
                ,
                // 加载一个或多个脚本
                // 必须参数：scripts ，字符串或字符串数组（要加载的脚本的路径）
                // 可选参数：success：function，所有脚本加载完成后的回调
                // 可选参数：fail:function，失败后的回调，可以获取失败的原因
                // FIXME 未完成
                loadScript: function (scripts, success, fail) {
                    var array;
                    if (typeof scripts == 'string') {
                        array = [scripts];
                    } else if (angular.isArray(scripts)) {
                        array = scripts;
                    } else {
                        alert('不合法的参数!');
                        return false;
                    }
                    var context = this;
                    var promise = context.promise;
                    // 批量异步加载
                    var promised = [];
                    angular.forEach(array, function (url) {
                        // 超时时间为8秒
                        promise(function (defer) {
                            alert(url);
                            $.getScript(url, function () {
                                defer.resolve(true);
                            });
                        }, 0, {
                            timeout: 8000, callback: function () {
                                this.reject('请求超时!' + url);
                            }
                        });
                    });

                    // 开始执行加载
                    $q.all(promised, success, fail);
                }
                ,

                /**
                 * 关闭当前页签
                 * @param target 当前页签所在的容器（即target对象）
                 */
                closeTab: function (target) {
                    var frameElement = self.frameElement;
                    var frameId = frameElement.id;
                    if (frameElement.tagName == "IFRAME" && frameId && frameId.indexOf("iframe_") == 0) {
                        (context || new CommonUtils()).addTab('remove', frameId, {target: target || window});
                    } else {
                        alert('不是页签!');
                    }
                },
                /**
                 * @description 页签组件
                 * @param {object|string} options 方法名称或者配置对象
                 * @param {*} _data [optional] 任意数据
                 * @param {object} _target [optional] 目标对象，用于指定作用的window
                 * @returns {*}
                 */
                addTab: function (options, _data, _target) {
                    function Tab() {
                    }

                    Tab.prototype = {
                        title: '新页签',// 必须，页签的标题
                        url: '',// 必须，页签要打开的url
                        isRoot: false,// 是否是根页签，只能有一个
                        canClose: true,// 是否允许关闭，根不允许被关闭
                        onClose: null,// 可选，当当前页签被关闭时需要做的操作（该事件会被打开当前页签的那个对象所捕获）
                        onUpdate: null,// 可选，当当前页签的内容被更新之后，被手动设置了更新，则当前事件会被触发
                        targetObj: window.parent,// 页签在哪个窗口中显示，默认将当前窗口的上级窗口
                        targetElm: '#tab',// 页签在指定窗口的哪一个元素上显示
                        lazy: true,     // 是否懒加载（即当点击的时候才真正加载这个页面）
                        data: null, // 额外传递的数据，可以通过get来获取
                        active: true// 添加玩页签后是否激活，默认为true
                    };
                    var context = this;

                    // 获取数据
                    var tab = new Tab();
                    if (angular.isObject(options)) {
                        angular.extend(tab, options);
                        tab.targetObj = tab.targetObj || window.parent || window;
                    }
                    var target = tab.targetObj;
                    var element = $(target.document).find(tab.targetElm);

                    var iframeId = 'iframe_' + this.randomID(4);
                    // 获取模板
                    var isRoot = tab.isRoot;
                    if (isRoot) {                   // 当为root时，清空之前的数据
                        target['_data'] = {};
                        target['_eve'] = {};
                    }
                    var events = target['_eve'];    // 保存事件
                    var data = target['_data'];     // 保存额外的数据
                    var canClose = tab.canClose;
                    var getTemplate = function () {
                        var tpl =
                            '<div class="panel panel-tab" style="height: 100%;margin: 0;position: relative;" >' +
                            '   <ul class="nav nav-tabs" style="position: absolute;margin: 5px 0 0 0;width:100%;">' +
                            '   </ul >' +
                            '   <div class="tab-content" style="height: 100%;width:100%;padding-top: 35px;position: absolute;" >' +
                            '    </div >' +
                            '</div >';
                        if (isRoot) {
                            element.find('.panel.panel-tab').remove();
                            var foo = $(tpl);
                            element.append(foo);
                            return foo;
                        }
                        return element.find('.panel.panel-tab');
                    };

                    // 当前的window对象（也是打开页签的对象）
                    var currentWindow = window;
                    var hasInit = false;
                    // 添加click事件
                    var addListener = function () {
                        var current = this;
                        current.bind('click', function (e, isActive) {
                            e.stopPropagation();
                            if ($(e.target) == current) {
                                return;
                            }
                            if (isActive == true || isActive === undefined) {
                                current.siblings().removeClass('active');
                                current.addClass('active');
                                // 以前激活状态的iframe隐藏
                                var iframeContainer = current.parent('.nav.nav-tabs').siblings('.tab-content');
                                iframeContainer.find('iframe:visible').hide();
                                var activeIFrame = null;
                                if (hasInit == false) {
                                    activeIFrame = createIFrame();
                                    iframeContainer.append(activeIFrame);
                                    var _w = activeIFrame[0].contentWindow; // 如果曾经有通知，则触发通知
                                    $(_w).bind('load', function () {
                                        current.attr('tab-init', true);        // 表示懒加载完成
                                        var tabData = current.data('tab-data'); // 获取在懒加载期间其他页签通知过来的数据
                                        if (tabData) {
                                            current.removeData('tab-data');
                                            angular.isFunction(_w.tabDataChange) && _w.tabDataChange(tabData);
                                        }
                                        $(_w).unbind('load');
                                    });
                                } else {
                                    var iframeId = current.find('i').attr('target');
                                    activeIFrame = iframeContainer.find('#' + iframeId);
                                }

                                if (activeIFrame.length < 1) {
                                    alert('没有可显示的iframe!');
                                }
                                activeIFrame.show();
                            }
                        });
                    };


                    var createIFrame = function () {
                        hasInit = true;
                        return $('<iframe name="' + iframeId + '" id="' + iframeId + '" src="' + context.contextPathURL(tab.url) + '" frameborder="0" style = "border: 0;height: 100%;width: 100%;margin: 0;padding: 0;display:none;" > </iframe>');
                    };

                    // 添加tab
                    var createTab = function (root) {
                        var li =
                            '<li >' +
                            '    <i target="' + iframeId + (isRoot ? '" >' : '" style="padding-right:25px;">') + tab.title + '</i >' +
                            ((!isRoot && canClose) ? ('<span id="span_' + iframeId + '" class="icons fork" style="top: 2px; right: 0px; position: absolute; cursor: pointer;" title="关闭"></span >') : '') +
                            '</li >';
                        var $li = $(li);
                        $li.attr('tab', iframeId);

                        root.find('.nav.nav-tabs').append($li);
                        // 是否使用懒加载(根必须加载，lazy不为true时必须加载）
                        if (tab.lazy === false || isRoot) {
                            root.find('.tab-content').append(createIFrame());
                            $li.attr('tab-init', true);
                        } else {
                            $li.attr('tab-init', false);
                        }

                        // 绑定关闭按钮
                        $li.find('span').bind('click', function (e) {
                            // 删除注册的事件
                            delete events[iframeId];

                            // 移除传递的数据
                            delete data[iframeId];

                            // 激活其他选项
                            $li.siblings(':last').trigger('click');

                            // 移除iframe
                            root.find('#' + iframeId).remove();

                            // 移除当前tab
                            $li.remove();

                            // 触发onClose事件
                            if (angular.isFunction(tab.onClose)) {
                                tab.onClose();
                            }

                        });

                        // 添加更新时通知事件
                        if (angular.isFunction(tab.onUpdate)) {
                            events[iframeId] = tab.onUpdate;
                        }
                        if (!isRoot && tab.data) {
                            data[iframeId] = tab.data;
                        }
                        // 绑定点击事件
                        addListener.call($li);
                        return $li;

                    };

                    // 将参数数组转换成普通数组

                    var argFoo = arguments;
                    var getArgumentArray = function () {
                        var args = [];
                        angular.forEach(argFoo, function (o, index) {
                            args.push(o);
                        });
                        return args;
                    };

                    // 功能操作
                    if (typeof options == 'string') {
                        var _data = arguments[1];       // 要传递的数据
                        var _options = arguments[2];    // 额外的配置对象，一般用于指定target和document
                        var tabId = currentWindow.frameElement.id;  // 目标页签ID
                        if (typeof _options === 'object' && typeof _options.target === 'object') {
                            if (!_options.target.frameElement) {
                                alert('页签调用方法[' + options + ']错误!错误的配置对象,无效的target属性!');
                                return false;
                            }
                            tabId = _options.target.frameElement.id;
                            if (typeof tabId !== 'string') {
                                alert('页签调用方法[' + options + ']错误!错误的配置对象,无效的target属性,没有获得对应的页签ID!');
                                return false;
                            }
                            // 如果指定了目标窗口，则通过目标窗口获得其上级的document对象
                            element = $(_options.target.frameElement.contentWindow.document);
                            target = _options.target;
                        }
                        if ("remove" === options) {// 移除页签
                            _data = _data || tabId;
                            element.find('#span_' + _data).trigger('click');
                        } else if ("update" === options) {  // 通知更新
                            if (events[tabId]) {
                                events[tabId].call(target, _data);
                            }
                        } else if ("get" === options) {     // 获取创建当前页签时额外传递过来的数据
                            return data[tabId];
                        } else if ("notify" === options) { // 触发事件
                            var doc = target.document;
                            // 绑定通知数据
                            $(doc).find('li[tab-init=false]').data('tab-data', _data);
                            $(doc).find('iframe[id^="iframe_"]').each(function (o) {
                                var $w = this.contentWindow;
                                $($w.document).ready(function () {
                                    angular.isFunction($w.tabDataChange) && $w.tabDataChange.call($w, _data);
                                });
                            });
                        } else {
                            alert('未知的操作类型:' + options);
                        }
                    } else {
                        // 创建tab并手动触发事件
                        if (element.length < 1) {
                            alert('创建页签时,配置错误!没有找到对应的页签容器!');
                            return;
                        }
                        var tabElement = createTab(getTemplate());
                        tabElement.trigger('click', tab.active);
                        return iframeId;    // 返回新创建的页签所属iframe的id
                    }

                }
                ,


                /**
                 * @description 获得指定模块的注册器，返回一个promise对象，可以通过该对象获取在该模块中注册的各种服务对象的实例
                 * @param {object} appObj 当前的module对象
                 * @param {string} moduleName 要加载的模块的名称
                 * @param {string} jsPath [optional] moduleName模块如果不存在，则需要通过该路径加载
                 * @returns {object} $defer.promise
                 */
                lazyLoad: function (appObj, moduleName, jsPath) {
                    var context = this;
                    if (!appObj || !angular.isArray(appObj.requires)) {
                        context.errorDialog('调用CommonUtils.lazyLoad()时出错，第一个参数必须是当前module对象!');
                        return false;
                    }

                    if (!moduleName) {
                        context.errorDialog('调用CommonUtils.lazyLoad()时出错，没有指定需要加载的module的名称!');
                        return false;
                    }
                    var defer = $q.defer();

                    var modules = {};
                    // 注入模块
                    var inject = function () {
                        try {
                            var injector = angular.injector([moduleName]);
                            defer.resolve(injector);
                        } catch (e) {
                            reject('调用CommonUtils.lazyLoad()时出错，注册模块[' + moduleName + ']时失败!');
                        }
                    };

                    // 错误响应
                    var reject = function (errorMsg) {
                        context.errorDialog(errorMsg);
                        defer.reject(errorMsg);
                    };

                    if ($.inArray(moduleName, appObj.requires) != -1) {
                        inject();
                    } else {
                        try {
                            angular.module(moduleName);// 判断模块是否存在
                            inject();
                        } catch (e) {
                            if (!jsPath) {
                                reject('调用CommonUtils.lazyLoad()时出错，注入模块[' + moduleName + ']时失败,且没有指定jsPath!');
                            }
                            $.getScript(jsPath, inject);
                        }
                    }
                    return defer.promise;
                }
            };
            context = new CommonUtils();
            return context;
        }])
        // 权限，一般配合ng-cloak一起使用
        // 用法< eccrm-previlege="这里是资源编号">
        // 当初始化后，会去session的权限编号集合中查询指定的编号是否存在，如果存在则不做操作，如果不存在，则删除当前元素
        .directive('eccrmPrevilege', ['$http', 'CommonUtils', function ($http, CommonUtils) {
            return {
                link: function (scope, element, attr, ctrl) {
                    var code = attr['eccrmPrevilege'];
                    element.hide();
                    if (!code) return;
                    $http.get(CommonUtils.contextPathURL('/auth/accreditFunc/hasPermission?code=' + code))
                        .success(function (data) {
                            if (data.data == false) {
                                element.remove();
                            } else {
                                element.show();
                            }
                        })
                        .error(function (data) {
                            alert('权限查询失败!' + (data.error || data.fail || data.message));
                        });
                }
            }
        }])

    /**
     * 给当前元素下的所有input，textarea，select添加readonly属性
     * 用法<div eccrm-readonly>
     */
        .directive('eccrmReadonly', [function () {
            return {
                link: function (scope, ele) {
                    ele.find('input,textarea,select').attr('readonly', 'readonly');
                }
            }
        }])
    /**
     * 给当前元素下的所有input，textarea，select添加disabled属性
     * 用法<div eccrm-disabled>
     */
        .directive('eccrmDisabled', [function () {
            return {
                link: function (scope, ele) {
                    ele.find('input,textarea,select').attr('disabled', 'disabled');
                }
            }
        }]);


// 时间相关的插件
    angular.module('eccrm.angular.date', [])
        .factory('DateFormat', ['$filter', function ($filter) {
            return function (value, pattern) {
                if (!value) return '';
                return $filter('date')(value, pattern);
            }
        }])
        .filter('eccrmDate', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'yyyy-MM-dd');
            }
        }])
        .filter('eccrmTime', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'HH:mm:ss');
            }
        }])
        .filter('eccrmDatetime', ['DateFormat', function (DateFormat) {
            return function (value) {
                return DateFormat(value, 'yyyy-MM-dd HH:mm:ss');
            }
        }])
        // 倒计时插件
        // 使用方式：<div eccrm-count-down="options"></div>
        // 配置参数：options：{}，配置对象
        // 该对象可以是一个延迟对象(promise对象）或者是一个普通的对象{}
        // 必须属性：
        //    seconds:[number],秒数，如果值为正数，则表示倒计时；如果值为负数，则表示计时
        //    onChange:[function]，当值从正数变为负数时触发的事件
        //    stopWhileZero:true, 当倒计时到0时，是否停止
        // 可选用方法：当初始化完毕后，会给初始化对象添加3个方法
        //     stop：停止计时器，不可恢复
        //     pause:暂停计时器，可以恢复
        //     start:恢复被暂停的计时器
        .directive('eccrmCountDown', ['CommonUtils', '$timeout', function (CommonUtils, $timeout) {
            return {
                scope: {
                    options: '=eccrmCountDown'
                },
                link: function (scope, element) {
                    var stop = false;
                    var pause = false;
                    var fn;
                    var _stop = function () {
                        stop = true;
                    };
                    var _pause = function () {
                        pause = true;
                    };
                    var _start = function () {
                        pause = false;
                        fn();
                    };
                    var promise = CommonUtils.parseToPromise(scope.options || {});
                    promise.then(function (options) {
                        options.start = _start;
                        options.stop = _stop;
                        options.pause = _pause;
                        var value = options.seconds || 0; // 用户配置的秒数

                        // 计时器显示效果：小时：分钟：秒数
                        var hour, minute, seconds;

                        // 计算初始的小时、分钟和秒数
                        var calculate = function () {
                            hour = Math.floor(value / 3600);
                            minute = Math.floor(value / 60 - hour * 60);
                            seconds = value - (hour * 3600 + minute * 60);
                        };

                        // 创建元素
                        var createElement = function (index, className) {
                            return $('<span class="' + (className || "") + '"><img src="' + CommonUtils.contextPathURL("/style/standard/images/number/") + index + '.png" style="margin-left:2px;width:20px;height:30px;display:inline-block;"/></span>');
                        };

                        // 补零操作
                        var addZero = function (v) {
                            if (angular.isNumber(v)) {
                                if (v < 10) {
                                    v = '0' + v;
                                }
                            }
                            return v;
                        };

                        // 添加图片到当前元素内
                        var addElement = function (v, className) {
                            v = addZero(v);
                            var arr = v.toString().split('');
                            angular.forEach(arr, function (foo) {
                                element.append(createElement(foo, className))
                            });

                        };

                        // 事件
                        var hourElm, minuteElm, secondsElm;
                        var hourEvent = function () {
                            hourElm = hourElm || element.find('.hour img');
                            changePicUrl(hourElm, hour);
                        };
                        var minuteEvent = function () {
                            minuteElm = minuteElm || element.find('.minute img');
                            changePicUrl(minuteElm, minute);
                        };
                        var secondEvent = function () {
                            secondsElm = secondsElm || element.find('.seconds img');
                            changePicUrl(secondsElm, seconds);
                        };

                        // 改变url
                        var changePicUrl = function (elems, currentValue) {
                            currentValue = addZero(currentValue);
                            angular.forEach(elems, function (e, index) {
                                var s = currentValue.toString().charAt(index);
                                $(e).attr('src', CommonUtils.contextPathURL('/style/standard/images/number/' + s + '.png'));
                            });
                        };

                        // 倒计时
                        var countDown = function () {
                            // 周期执行
                            setTimeout(function () {
                                var goon = true;
                                // 如果秒数大于0，则执行一秒，然后继续
                                if (seconds > 0) {
                                    seconds--;
                                    secondEvent();
                                    // 如果秒数《=0，则判断是否还有分钟可以借位
                                } else {
                                    if (minute > 0) {
                                        seconds = 59;
                                        minute--;
                                        secondEvent();
                                        minuteEvent();
                                    } else if (hour > 0) {
                                        seconds = 59;
                                        minute = 59;
                                        hour--;
                                        secondEvent();
                                        minuteEvent();
                                        hourEvent();
                                    } else {
                                        goon = false;
                                        // 如果到0不停止，则继续
                                        if (options.stopWhileZero != true) {
                                            expired();
                                        }

                                        // 触发倒计时事件
                                        if (angular.isFunction(options.onChange)) {
                                            scope.$apply(options.onChange);
                                        }
                                    }
                                }
                                changePicUrl();
                                if (goon && !pause && !stop) {
                                    setTimeout(arguments.callee, 1000);
                                }
                                if (stop) {
                                    element.unbind('stop');
                                    element.unbind('pause');
                                    element.unbind('start');
                                }

                            }, 1000);
                        };

                        // 逾期
                        var expired = function () {
                            setTimeout(function () {
                                if (seconds == 59) {
                                    seconds = 0;
                                    if (minute == 59) {
                                        minute = 0;
                                        hour++;
                                        hourEvent();
                                    } else {
                                        minute++;
                                    }
                                    minuteEvent();
                                } else {
                                    seconds++;
                                }
                                secondEvent();
                                setTimeout(arguments.callee, 1000);
                            }, 1000);
                        };

                        var isExpired = false;
                        if (value < 0) {
                            value = Math.abs(value);
                            isExpired = true;
                        }
                        calculate();
                        addElement(hour, "hour");
                        addElement('_');
                        addElement(minute, "minute");
                        addElement('_');
                        addElement(seconds, "seconds");
                        calculate();
                        fn = isExpired ? expired : countDown;
                        fn();
                    });
                }
            }
        }]);
// 倒计时


//字符串相关
    angular.module('eccrm.angular.string', [])
        // 格式化字符串长度，超出部分使用'...'进行替换
        // 参数1（必须）：值
        // 参数2（可选）：最大长度，默认为50
        // 参数3（可选）：替换的后缀，默认为'...'
        .filter('substr', [function () {
            return function (value, length, suffix) {
                if (typeof value !== 'string') return value;
                if (!value)return '';
                length = length || 50;
                suffix = suffix || '...';
                if (value.length > length) {
                    return value.substring(0, length) + suffix;
                }
                return value;
            }
        }])
    /**
     * 去掉HTML Tag
     */
        .filter('removeHTMLTag', function () {
            return function (value) {
                if (typeof value === 'string') {
                    return value.replace(/(<[^>]+>)|(&.*;)/g, '');
                }
            };
        });
//分页
    angular.module('eccrm.angular.pagination', ['eccrm.angular.base'])
        .directive('eccrmPage', ['CommonUtils', '$q', function (CommonUtils, $q) {
            return {
                scope: {
                    pager: '=eccrmPage'
                },
                templateUrl: CommonUtils.contextPathURL('/static/ycrl/javascript/template/page.html'),
                link: function (scope, element, attr, ctrl) {
                    var defaults = {
                        fetch: angular.noop,//查询函数
                        pageSize: [5, 10, 15, 20, 30, 40, 50],
                        start: 0,
                        limit: 15,//每页显示的数量
                        total: 0,//总数据
                        opacity: 1,//透明度
                        firstAndLast: true,//第一页和最后一页按钮
                        allowNav: true,//允许输入页面进行跳转
                        prevAndNext: true,//上一页和下一页的按钮
                        configLimit: true,//显示每页数据
                        currentPage: 1,//当前页号
                        totalPage: 1,//总页数
                        ready: false,
                        totalProperty: 'total',//总记录条数，可以使用字符串或者一个函数
                        next: function () {
                            //没有到最后一页
                            if (this.currentPage < this.totalPage) {
                                this.currentPage++;
                            }
                        },
                        prev: function () {
                            //没有到达第一页
                            if (this.currentPage > 1) {
                                this.currentPage--;
                            }
                        },
                        first: function () {
                            //不是第一页
                            if (this.currentPage != 1) {
                                this.currentPage = 1;
                            }
                        },
                        last: function () {
                            //不是最后一页
                            if (this.currentPage != this.totalPage) {
                                this.currentPage = this.totalPage;
                            }
                        },
                        jump: function (page_no) {//跳转到指定页面
                            //不是当前页，并且大于等于第一页，小于等于最后一页
                            if (this.currentPage != page_no && page_no > 0 && page_no <= this.totalPage) {
                                this.currentPage = page_no;
                            }
                        },
                        init: function () {//初始化分页的参数
                            this.currentPage = 1;
                            this.totalPage = 1;
                            this.start = 0;
                            this.total = 0;
                        },
                        initPaginationInfo: function (total) {
                            this.total = total || 0;
                            this.totalPage = Math.ceil(total / this.limit) || 1;
                        },
                        finishInit: $.noop,//初始化完成的回调
                        load: function () {
                            var current = scope.pager;
                            if (angular.isFunction(current.fetch)) {
                                var s = current.fetch();//支持返回{total:number} obj.promise obj.$promise 或者promise对象
                                if (!s) return;
                                var doInitPagination = function (value) {
                                    var totalProperty = current.totalProperty || 'total';
                                    var total = 0;
                                    if (angular.isNumber(value)) {
                                        total = value;
                                    } else if ((typeof value === 'object') && angular.isNumber(value[totalProperty])) {
                                        total = value[totalProperty];
                                    }
                                    current.initPaginationInfo.call(current, total);
                                };
                                var promise = $q.when(s);
                                promise.then(doInitPagination);
                                return promise;
                            }

                        },
                        query: function () {
                            var current = scope.pager;
                            current.start = 0;
                            current.currentPage = 1;
                            current.load.call(current);
                        }
                    };
                    var promise = CommonUtils.parseToPromise(scope.pager);
                    promise.then(function (pagerOptions) {
                        var pager = scope.pager = angular.extend({}, defaults, pagerOptions);
                        var destroy = scope.$watch('pager.currentPage', function (value, oldValue) {
                            // 值未改变不操作
                            if (value === undefined || value === oldValue) return;

                            // 如果是修正之前的错误数据，则也不操作
                            if (oldValue && oldValue > pager.totalPage) {
                                return;
                            }

                            // 如果新的值超出了最大页数，则回到之前的页数
                            if (value > pager.totalPage) {
                                pager.currentPage = oldValue;
                                return;
                            }
                            pager.start = scope.pager.limit * (value - 1);
                            pager.load();
                        });
                        var destroy2 = scope.$watch('pager.limit', function (value, oldValue) {
                            if (value === undefined || value === oldValue) return;
                            pager.start = 0;
                            pager.currentPage = 1;
                            pager.load();
                        });
                        if (angular.isFunction(pager.finishInit)) {
                            pager.finishInit.call(pager);
                        }
                        // 限制可以跳转的页数
                        scope.$on('$destroy', destroy);
                        scope.$on('$destroy', destroy2);
                    });

                }
            };
        }])
        // 只可以输入数字的指定
        .directive('inputNumber', function () {
            return {
                link: function (scope, elm) {
                    elm.bind('keydown', function (e) {
                        var keyCode = e.keyCode || e.which;
                        if (!(keyCode > 47 && keyCode < 58)) { //0-9
                            e.preventDefault();
                        }
                    });
                }
            }
        });

//选择
    angular.module('eccrm.angular.picker', [])
        .directive('selectAllCheckbox', [function () {
            return {
                replace: true,
                restrict: 'EA',
                scope: {
                    checkboxes: '=',
                    allselected: '=allSelected',
                    allclear: '=allClear',
                    items: '=selectedItems',
                    anyoneSelected: '='
                },
                template: '<input type="checkbox" ng-model="master" ng-change="masterChange()" ng-cloak>',
                controller: ['$scope', '$element', '$attrs', function ($scope, $element, $attrs) {
                    if (!$scope.items) $scope.items = [];
                    //根改变
                    $scope.masterChange = function () {
                        if ($scope.master) {
                            angular.forEach($scope.checkboxes, function (cb) {
                                $scope.items.push(cb);
                                cb.isSelected = true;
                            });
                        } else {
                            $scope.items = [];
                            angular.forEach($scope.checkboxes, function (cb) {
                                cb.isSelected = false;
                            });
                        }
                    };
                    var destroy = $scope.$watch('checkboxes', function (value) {
                        var allSet = true,
                            allClear = true;
                        if (!value)$scope.items = [];//当checkbox的值发生变化时，清空选中的内容
                        angular.forEach(value, function (cb) {
                            var _ind = $.inArray(cb, $scope.items);
                            if (cb.isSelected) {
                                if (_ind == -1) {
                                    $scope.items && $scope.items.push(cb);
                                }
                                allClear = false;
                            } else {
                                allSet = false;
                                if (_ind != -1) {
                                    $scope.items && $scope.items.splice(_ind, 1);
                                }
                            }
                        });

                        if ($scope.allselected !== undefined) {
                            $scope.allselected = allSet;
                        }
                        if ($scope.allclear !== undefined) {
                            $scope.allclear = allClear;
                        }
                        if ($attrs['anyoneSelected']) {
                            $scope.anyoneSelected = !allClear;
                        }

                        $element.prop('indeterminate', false);
                        if (allSet && $scope.items && $scope.items.length > 0) {
                            $scope.master = true;
                        } else if (allClear) {
                            $scope.master = false;
                        } else {
                            $scope.master = false;
                            $element.prop('indeterminate', true);
                        }
                    }, true);
                    $element.on('$destroy', destroy);
                }]
            }
        }])
        // 解决在IE8下下拉框无法选择值的问题
        .directive('ieSelectFix', [
            function () {
                return {
                    restrict: 'A',
                    require: 'select',
                    link: function (scope, element, attributes) {
                        if ($.browser.msie && element[0].nodeName == 'SELECT') {
                            var control = element[0];
                            var destroy = scope.$watch(attributes.ieSelectFix, function () {
                                //it should be use javascript way, not jquery way.
                                var option = document.createElement("option");
                                control.add(option, null);
                                control.remove(control.options.length - 1);
                            });
                            scope.$on('$destroy', destroy);
                        }
                    }
                }
            }
        ]);
    ;

//单选框
//下拉框

//自适应相关
    angular.module('eccrm.angular.adjustment', ['eccrm.angular.base'])
        //自动调节高度
        .directive('eccrmAutoHeight', ['$window', 'Debounce', function ($window, Debounce) {
            return {
                restrict: 'A',
                link: function (scope, ele, attr) {
                    var el = attr['eccrmAutoHeight'];
                    if (!el) return;
                    var _p = ele.parent(), _e = $(el);
                    if (_p.length < 1) {
                        console.debug('没有获得对应的父容器!');
                        return;
                    }
                    if (_e.length < 1) {
                        console.debug('没有获得相对的兄弟元素，无法根据其高度进行自适应!');
                        return;
                    }
                    var changeSize = function () {
                        ele.animate(
                            {height: _p.height() - _e.outerHeight() - 5}, 500
                        );
                    };
                    angular.element(window).on('resize', function () {
                        Debounce.delay(changeSize, 200);
                    });
                    changeSize();
                }
            }
        }])
        .directive('eccrmSwitch', ['CommonUtils', function (CommonUtils) {
            var defaults = {
                onClick: $.noop,    // 点击元素后要做的操作，需要返回一个promise对象
                destroy: true,         // 响应是否移除当前按钮
                onDestroy: $.noop      // 当元素移除后的操作
            };
            return {
                restrict: 'A',
                scope: {
                    options: '=eccrmSwitch'
                },
                link: function (scope, element, attr) {
                    // 设置鼠标手势
                    element.css('cursor', 'pointer');
                    var loaded = false;
                    CommonUtils.parseToPromise(scope.options).then(function (options) {
                        if (typeof options == 'function') {
                            options = {onClick: options};
                        }
                        options = angular.extend({}, defaults, options);
                        var onclick = options.onClick || $.noop;
                        // 点击确定
                        element.bind('click', function (e) {
                            var defer = onclick();
                            if (defer === undefined) {
                                alert('eccrm-switch插件的onclick函数必须返回一个promise对象!');
                                return false;
                            }
                            CommonUtils.parseToPromise(defer).then(function (data) {
                                // 隐藏按钮
                                options.destroy == true ? element.remove() : '';
                                // 回调
                                angular.isFunction(options.onDestroy) && options.onDestroy.call(data);
                            });
                        });
                    });
                }
            }
        }]);


// 路由，以页签的方式展现
// 配置对象：[]或者未来对象（最终也必须返回数组）
    angular.module('eccrm.angular.route', ['ngRoute', 'ngAnimate', 'eccrm.angular'])
        .directive('eccrmRoute', ['$window', '$location', 'CommonUtils', function ($window, $location, CommonUtils) {
            return {
                scope: {
                    routes: '=eccrmRoute'
                },
                templateUrl: CommonUtils.contextPathURL('static/ycrl/javascript/template/route.html'),
                link: function (scope, element, attr, ctrl) {
                    // 真正的页面地址（/wbs/xx?xx&xxx）
                    var path = $window.location.pathname + ($window.location.search || "");

                    var rs = scope.routes;
                    // 真正保存页签数据
                    scope.data = [];


                    // 获取当前页面的真正地址

                    // 解析数据，生成页签访问地址
                    var handle = function (routes) {
                        if (!routes || !angular.isArray(routes)) {
                            alert('页签加载失败，只支持数组类型!');
                            return false;
                        }
                        angular.forEach(routes, function (value, index) {
                            scope.data.push(value);
                            var url = value.url;
                            if (!url) throw '无效的路由地址';
                            if (url.indexOf('#') !== 0) {
                                url = '#' + url;
                            }
                            value.url = path + url;
                            if (value.active === true) {
                                $location.path(value.url);
                                scope.active = index;
                            }
                        });
                        if (scope.$parent.active == undefined) {
                            scope.$parent.active = 0;
                            $location.path(routes[0].url);
                        }
                    };

                    // 如果直接传递的是数组
                    if (angular.isArray(rs)) {
                        handle(rs);
                        return;
                    }
                    // 如果传递的是未来对象
                    if (angular.isObject(rs)) {
                        var promise = CommonUtils.parseToPromise(rs);
                        promise.then(handle);
                    }

                }
            }
        }]);
})(window);


/**
 * 绑定快捷查询的操作
 * “查询按钮”结构必须满足如下：
 * <div class=list-condition>
 *     <div class="header-button">
 *         <button>查询</button>
 *     </div>
 * </div>
 * 触发的条件：
 * 当焦点处于
 * <div class="list-condition">
 *     <div class="block-content"></div>
 * </div>
 * 如果此时输入回车，则会触发查询
 */
(function ($) {
    $(function () {
        // 获得查询按钮
        var btn = $('.list-condition .header-button button:contains("查询")');
        if (btn.length !== 1) return;
        // 绑定回车事件
        $('.list-condition .block-content').bind('keydown', function (e) {
            var keyCode = e.which || e.keyCode;
            if (keyCode == 13) {
                btn.click();
                e.preventDefault();
            }
        });
    })
})(jQuery);

