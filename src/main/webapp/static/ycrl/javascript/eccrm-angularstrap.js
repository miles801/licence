/**
 * 依赖于
 *  eccrm-angular.js
 *  angular-strap.js
 *  angular-strap.tpl.js
 *
 * Created by miles on 2014/5/4.
 */
(function (window, $art) {
    angular.module('eccrm.angularstrap', [
        'eccrm.angular',
        'eccrm.angularstrap.alert',
        'eccrm.angularstrap.modal',
        'eccrm.angularstrap.aside',
        'eccrm.angularstrap.validation'
    ]).factory('eccrmHttpInterceptor', ['$q', '$injector', function ($q, $injector) {
        return function (promise) {
            return promise.then(function (response) {
                var data = angular.isObject(response) && response.data;
                if (angular.isObject(data) && data.error == true) {
                    var AlertFactory = $injector.get('AlertFactory');
                    if (angular.isFunction(AlertFactory.error)) {
                        AlertFactory.error(null, data.message, '');
                    } else {
                        alert(data.message);
                    }
                }
                return response;
            });
        }
    }
    ]).config(['$httpProvider', function ($httpProvider) {
        $httpProvider.responseInterceptors.push('eccrmHttpInterceptor');    // 请求拦截器
    }]);

    angular.module('eccrm.angularstrap.alert', ['mgcrea.ngStrap', 'eccrm.angular'])
        .factory('AlertFactory', ['$alert', '$sce', 'CommonUtils', '$q', function ($alert, $sce, CommonUtils, $q) {
            var defaults = {
                container: 'body',
                placement: 'top',
                template: CommonUtils.contextPathURL('static/ycrl/javascript/template/alert.html'),
                duration: 5,
                show: true
            };
            var change = function (content, title) {
                this.content = content;
                this.title = title;
            };
            return {
                //优先使用msg，然后才是使用scope.content
                success: function (scope, msg, title) {
                    msg = $sce.trustAsHtml(msg || scope.content || '');
                    title = title || (scope && scope.title) || '成功!';
                    var foo = $alert(angular.extend({}, defaults, {scope: scope, type: 'success'}));
                    change.call(foo.$scope, msg, title);
                },
                warning: function (scope, msg, title) {
                    msg = $sce.trustAsHtml(msg || scope.content || '');
                    title = title || (scope && scope.title) || '警告!';
                    var foo = $alert(angular.extend({}, defaults, {type: 'warning'}));
                    change.call(foo.$scope, msg, title);
                },
                info: function (scope, msg, title) {
                    msg = $sce.trustAsHtml(msg || scope.content || '');
                    title = title || (scope && scope.title) || '提示!';
                    var foo = $alert(angular.extend({}, defaults, {type: 'info'}));
                    change.call(foo.$scope, msg, title);
                },
                error: function (scope, msg, title) {
                    msg = $sce.trustAsHtml(msg || scope.content || '');
                    title = title || (scope && scope.title) || '错误!';
                    var foo = $alert(angular.extend({}, defaults, {type: 'danger', duration: false}));
                    change.call(foo.$scope, msg, title);
                },
                saveError: function (scope, data) {
                    var msg = $sce.trustAsHtml(data.error || data.fail || '');
                    var title = '保存失败';
                    var foo = $alert(angular.extend({}, defaults, {type: 'danger'}));
                    change.call(foo.$scope, msg, title);
                },
                updateError: function (scope, data) {
                    var msg = $sce.trustAsHtml(data.error || data.fail || '');
                    var title = '更新失败';
                    var foo = $alert(angular.extend({}, defaults, {type: 'danger'}));
                    change.call(foo.$scope, msg, title);
                },
                deleteError: function (scope, data) {
                    var msg = $sce.trustAsHtml(data.error || data.fail || '');
                    var title = '删除失败';
                    var foo = $alert(angular.extend({}, defaults, {type: 'danger', duration: false}));
                    change.call(foo.$scope, msg, title);
                },
                //执行结果处理：
                // {
                //      success:boolean,
                //      fail:boolean,
                //      error:boolean,
                //      message:'',
                //      code:'',
                //      data:[]/{}
                // }
                handle: function (scope, result, successCallback, failCallback) {
                    var promise = result.$promise || $q.when(result);
                    var doHandle = function (data) {
                        if (angular.isObject(data)) {
                            var error = data.error;
                            var fail = data.fail;
                            var title, content;
                            if (error) {
                                title = '操作异常!';
                                if (error === true) {// 标准ResponseData对象
                                    content = (data.code || '') + data.message || '';
                                } else if (typeof error === 'string') {// 兼容{error:'错误信息'}
                                    content = error;
                                }
                            } else if (fail) {
                                title = '操作失败!';
                                if (fail === true) {//标准ResponseData对象
                                    content = (data.code || '') + data.message || '';
                                } else if (typeof fail === 'string') {// 兼容{fail:'错误信息'}
                                    content = fail;
                                }
                            } else if (angular.isFunction(successCallback)) {
                                successCallback.call(scope, data);
                                return;
                            }
                            if (title) {
                                var foo = $alert(angular.extend({}, defaults, {
                                    scope: scope,
                                    type: 'danger',
                                    duration: false
                                }));
                                change.call(foo.$scope, $sce.trustAsHtml(content), title);
                                if (fail && angular.isFunction(failCallback)) {
                                    failCallback.call(scope, data);
                                }
                            }
                        }
                    };
                    var art;
                    var focused;
                    if ($art && angular.isFunction($art.artDialog)) {
                        focused = $(':focus:eq(0)');
                        art = $art.artDialog({
                            title: '数据正在加载，请稍等...  ',
                            drag: false,
                            resize: false
                        });
                    }
                    promise.then(function (data) {
                        art && art.close();
                        focused && focused.focus();
                        doHandle(data);
                    });
                }
            }
        }]);

    angular.module('eccrm.angularstrap.modal', ['mgcrea.ngStrap', 'eccrm.angular'])
        .factory('ModalFactory', ['$modal', '$sce', 'CommonUtils', function ($modal, $sce, CommonUtils) {
            return {
                //使用方式：
                //ModalFactory.confirm({
                //    content:'',//要提示的内容
                // });
                confirm: function (config, callback) {
                    var cfg = angular.extend({
                        scope: null,//必填项
                        keywords: null,//关键字
                        content: '',//内容
                        callback: null,
                        afterShown: null//模板加载完毕后要执行的函数
                    }, config);
                    if (!cfg.scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: cfg.scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-confirm.tpl.html')
                    });
                    var content = cfg.content || '确定执行【 ' + cfg.keywords + ' 】操作?';
                    modal.$scope.content = $sce.trustAsHtml(content);
                    modal.$scope.confirm = function () {
                        callback = callback || cfg.callback;
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    };
                    _t.afterShown(modal, cfg.afterShown);
                },

                remove: function (scope, callback) {
                    if (!scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-delete.tpl.html')
                    });
                    modal.$scope.confirm = function () {
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    }
                },

                //启用
                start: function (scope, callback) {
                    if (!scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-start.tpl.html')
                    });
                    modal.$scope.confirm = function () {
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    }
                },

                //关闭
                close: function (scope, callback) {
                    if (!scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-close.tpl.html')
                    });
                    modal.$scope.confirm = function () {
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    }
                },
                //置顶
                top: function (scope, callback) {
                    if (!scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-top.tpl.html')
                    });
                    modal.$scope.confirm = function () {
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    }
                },

                //注销
                cancel: function (scope, callback) {
                    if (!scope) throw '使用模态对话框时必须指定scope!';
                    var _t = this;
                    var modal = $modal({
                        scope: scope,
                        template: CommonUtils.contextPathURL('/static/ycrl/javascript/template/common-modal-cancel.tpl.html')
                    });
                    modal.$scope.confirm = function () {
                        if (callback && angular.isFunction(callback)) {
                            callback.call(_t, arguments);
                        }
                        this.$hide();
                    }
                },
                //当模态对话框显示完成后要执行的操作,如果没有指定回调函数，则直接返回
                afterShown: function (modal, callback) {
                    if (!modal) throw '模态对话框对象不能为空!';
                    if (!callback || !angular.isFunction(callback)) return false;
                    if (modal && !modal.$promise) throw '不合法的参数，仅允许模态对话框对象!';
                    modal.$promise.then(function () {
                        var foo = setInterval(function () {
                            if (modal.$scope.$isShown) {
                                callback();
                                clearInterval(foo);
                            }
                        }, 50)
                    });
                }


            }
        }]);

    angular.module('eccrm.angularstrap.aside', ['mgcrea.ngStrap', 'eccrm.angular'])
        .factory('AsideFactory', ['$aside', '$sce', 'ModalFactory', 'CommonUtils', function ($aside, $sce, ModalFactory, CommonUtils) {
            var defaults = {
                container: 'body',
                show: true
            };
            return {
                //右下角的提示信息
                info: function (options) {
                    var modal = $aside(angular.extend({
                        container: 'body',
                        show: true,
                        template: CommonUtils.contextPathURL('static/ycrl/javascript/template/aside.html')
                    }, options));
                    var $scope = modal.$scope;
                    $scope.$hide = modal.hide;
                    return $scope;
                },
                aside: {}
            }
        }]);

// 表单验证器
    angular.module('eccrm.angularstrap.validation', ['mgcrea.ngStrap', 'eccrm.angular.base'])
        .config(['$tooltipProvider', function ($tooltipProvider) {
            angular.extend($tooltipProvider.defaults, {
                animation: 'am-flip-x',
                type: 'info',
                container: 'body',
                placement: 'top',
                trigger: 'hover'
            });
        }])
        .service('Validation', ['$q', 'Debounce', '$parse', function ($q, Debounce, $parse) {
            var INTEGER_REGEXP = /^-?\d+$/;
            var FLOAT_REGEXP = /^-?\d+((.|\,)\d+)?$/;
            var EMAIL_REGEXP = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            var PHONE_REGEXP = /^((\+\d{2,3}-?)?1\d{10})$/;
            var ZIPCODE_REGEXP = /^\d{6}$/;
            var NAMING_REGEXP = /^[a-zA-Z_0-9]+$/;
            var CHAR_REGEXP = /^[a-zA-Z_]+(\-?_?\w)+$/;
            var URL_REGEXP = /((?:\w{3,5}:\/\/)?(\w)+\.(\w)+\.(\w)+(?:\/?.*))/;
            return {
                validateRequired: {
                    validateMsg: '必填项',
                    validateFn: function (value) {
                        return !(value === null || value === undefined || value === '');
                    },
                    validateType: 'required'
                },
                validateInt: {
                    validateMsg: '值必须是整数',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (INTEGER_REGEXP.test(value));
                    },
                    validateType: 'int'
                },
                validateFloat: {
                    validateMsg: '值必须是浮点数',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (FLOAT_REGEXP.test(value));
                    },
                    validateType: 'float'
                },
                validateEmail: {
                    validateMsg: '不合法的E-MAIL',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (EMAIL_REGEXP.test(value));
                    },
                    validateType: 'email'
                },
                validateMobile: {
                    validateMsg: '不合法的手机号码',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (value && PHONE_REGEXP.test(value));
                    },
                    validateType: 'mobile'
                },
                validateZipcode: {
                    validateMsg: '错误的邮编',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (value && ZIPCODE_REGEXP.test(value));
                    },
                    validateType: 'zipcode'
                },
                validateNaming: {
                    validateMsg: '输入的值只能由数字、字母、下划线(_)组成',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (NAMING_REGEXP.test(value));
                    },
                    validateType: 'naming'
                },
                validateChar: {
                    validateMsg: '输入的值只能由数字、字母、下划线、中横线组成，且不能以数字和中横线开头',
                    validateFn: function (value) {
                        return (CHAR_REGEXP.test(value));
                    },
                    validateType: 'char'
                },
                validateMaxLength: {
                    validateMsg: '输入的值的长度超出允许的最大长度',
                    validateFn: function (value, length) {
                        if (!INTEGER_REGEXP.test(length) || parseInt(length) < 0) {
                            throw '无效的值!最大长度只能是正整数!';
                        }
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (value + "").length <= length;
                    },
                    validateType: 'maxLength'
                },
                validateMinLength: {
                    validateMsg: '输入的值的长度不足',
                    validateFn: function (value, length) {
                        if (!INTEGER_REGEXP.test(length) || parseInt(length) < 0) {
                            throw '无效的值!最大长度只能是正整数!';
                        }
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (value + "").length >= length;
                    },
                    validateType: 'minLength'
                },
                validateUrl: {
                    validateMsg: '不合法的URL',
                    validateFn: function (value) {
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return (URL_REGEXP.test(value));
                    },
                    validateType: 'url'
                },
                validateMaxValue: {
                    validateMsg: '超出允许的最大值',
                    validateFn: function (value, target) {
                        if (target === undefined) {
                            throw '不合法的验证器，没有设置允许的最大值!';
                        }
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return parseFloat(value) <= parseFloat(target);
                    },
                    validateType: 'maxValue'
                },
                validateMinValue: {
                    validateMsg: '小于允许的最小值',
                    validateFn: function (value, target) {
                        if (target === undefined) {
                            throw '不合法的验证器，没有设置允许的最小值!';
                        }
                        if (value === null || value === undefined || value === '') {
                            return true;
                        }
                        return parseFloat(value) >= parseFloat(target);
                    },
                    validateType: 'minValue'
                },
                //自定义验证器
                // 参数1：当前视图的值
                // 参数2：指令中配置的字符串值
                // 参数3：当前的验证配置对象
                //
                validateOptions: {
                    validateFn: function (value, directiveValue, validateOptions) {
                        if (!directiveValue) {
                            throw '自定义验证器,没有获得验证器配置信息!';
                        }
                        if (value === null || value === undefined) return true;
                        directiveValue = $parse(directiveValue)(this);
                        if (!angular.isFunction(directiveValue.validateFn)) {
                            throw '自定义验证器,没有获得验证函数!';
                        }
                        validateOptions.validateMsg = directiveValue.validateMsg || '验证失败';
                        validateOptions.validateType = directiveValue.validateType || 'options';
                        return directiveValue.validateFn.call(this, value, validateOptions);
                    }
                }
            };
        }])
        .directive('validate', ['$tooltip', 'Debounce', 'Validation', '$parse', function ($tooltip, Debounce, Validation, $parse) {
            return {
                require: 'ngModel',
                link: function (scope, elm, attrs, ctrl) {
                    var plugins = ['validateRequired',
                        'validateInt', 'validateFloat', 'validateMaxLength', 'validateMinLength',
                        'validateMobile', 'validateZipcode', 'validateMaxValue', 'validateMinValue',
                        'validateUrl', 'validateEmail', 'validateNaming', 'validateOptions'];
                    var placement = attrs['placement'] || 'top';
                    var tool = $tooltip(elm, {placement: placement, trigger: 'hover'});
                    var waitValidate = 'waitValidate';// 等待验证
                    var errorMsg = attrs['validateMsg'];
                    var wait = false;//
                    // 处理验证结果
                    // 参数1：处理结果（false表示验证失败，其余的均为验证成功）
                    // 参数2：验证类型（string类型）
                    // 参数3：验证失败的提示消息（string类型）
                    // 参数4：是否为自定义验证器
                    var handle = function (result, type, msg, isOption) {
                        if (isOption) {
                            wait = false;
                        }
                        ctrl.$setValidity(waitValidate, true);
                        if (result === undefined) return;
                        if (result !== false && result !== true) {
                            throw '不合法的验证结果,验证结果只支持true/false,实际值为[' + result + ']!';
                        }
                        type = type || 'options';
                        if (result === false) {
                            elm.addClass('error');
                            ctrl.$setValidity(type, false);
                            tool.$scope.title = msg || '验证失败';
                            elm.attr('validate-msg', tool.$scope.title);
                            return false;
                        }
                        ctrl.$setValidity(type, true);
                        if (wait == true) {
                            tool.$scope.title = '等待验证';
                            elm.attr('validate-msg', tool.$scope.title);
                            ctrl.$setValidity(waitValidate, false);
                        }
                        //验证通过
                        if (ctrl.$valid) {
                            tool.$scope.title = '';
                            elm.removeClass('error');
                            elm.removeAttr('validate-msg');
                            tool.$promise.then(tool.hide);
                        }
                    };

                    // 真正执行验证的部分
                    // 参数1：验证器配置信息
                    // 参数2：当前视图值
                    // 参数3：指令的值
                    // 参数4：是否为自定义验证器
                    var doValidate = function (validateOptions, viewValue, directiveValue, isOption) {
                        if (!angular.isFunction(validateOptions.validateFn)) {
                            throw '不合法的验证器,验证器必须指定验证函数!';
                        }
                        var result = validateOptions.validateFn.call(scope, viewValue, directiveValue, validateOptions);
                        if (result === true || result === false) {
                            handle(result, validateOptions.validateType, errorMsg || validateOptions.validateMsg, isOption);
                        } else if (angular.isObject(result)) {
                            var promise = angular.isFunction(result.then) ? result : (result.promise || result.$promise);
                            angular.isFunction(promise.then) && promise.then(function (v) {
                                handle(v, validateOptions.validateType, validateOptions.validateMsg, isOption);
                            });
                        } else {
                            handle(false, 'system', '无法识别的验证结果!' + result);
                        }
                    };


                    // 解析函数
                    // 参数1：插件的名称
                    // 参数2：验证配置
                    // 参数3：当前视图的值
                    var parser = function (plug, validateOptions, currentViewValue, directiveValue) {
                        if (plug == 'validateOptions') {// 自定义类型时，要判断是否进行验证
                            var trigger = validateOptions.trigger || 'focusout';
                            ctrl.$setValidity(waitValidate, false);
                            wait = true;
                            if (typeof trigger == 'string' && trigger == 'focusout') {
                                if (elm.is(':focus')) {
                                    return currentViewValue
                                } else {
                                    doValidate(validateOptions, currentViewValue, directiveValue, true)
                                }
                            } else if (trigger == 'now') {
                                doValidate(validateOptions, currentViewValue, directiveValue, true);
                            } else if (trigger == 'manual') {
                                // 强制验证
                                if (validateOptions['force'] === false && validateOptions.ready != true) {
                                    ctrl.$setValidity(id, true);
                                }
                                if (validateOptions.ready == true) {//手动执行方式
                                    validateOptions.ready = false;
                                    doValidate(validateOptions, currentViewValue, directiveValue, true);
                                }
                            } else {
                                throw '不支持的验证器触发类型[' + trigger + ']!';
                            }
                            return currentViewValue;
                        }

                        doValidate(validateOptions, currentViewValue, directiveValue);
                        return currentViewValue;
                    };
                    angular.forEach(plugins, function (pluginName) {
                        var validateValue = attrs[pluginName];// 获取验证器定义的值
                        if (!angular.isDefined(validateValue)) return;
                        var validateOptions = angular.extend({}, Validation[pluginName] || {});

                        if (pluginName == 'validateOptions') {
                            var options = $parse(validateValue)(scope);
                            angular.extend(validateOptions, options);
                            // 自定义类型的触发器的类型：
                            // focusout：当失去焦点时触发
                            // now：立即执行（返回值必须是true或者false）
                            // manual：手动触发，该方式会给配置对象添加一个execute方法，执行该方法会再次进行验证
                            var trigger = validateOptions.trigger || 'focusout';
                            if (trigger == 'focusout') {
                                var value;
                                elm.bind(trigger, function () {
                                    if (value == ctrl.$viewValue) return;
                                    ctrl.$setViewValue(ctrl.$viewValue);
                                    value = ctrl.$viewValue;
                                })
                            } else if (trigger == 'manual') {
                                options.execute = function () {
                                    validateOptions.ready = true;
                                    ctrl.$setViewValue(ctrl.$viewValue);
                                }
                            } else if (trigger === 'now') {
                                // 直接执行
                            }
                        }
                        var fn = function (viewValue) {
                            return parser(pluginName, validateOptions, viewValue, validateValue);
                        };
                        ctrl.$parsers.unshift(fn);
                        ctrl.$formatters.unshift(fn);
                    });
                }
            };
        }])
    /**
     * 用于在指定表单元素验证失败时，给当前元素的子元素添加error属性
     * 需要依赖的样式：[validate-error] .error{ // 验证失败时需要显示的样式 }
     * 用法：<label validate-error="form.property">姓名:</label>
     */
        .directive('validateError', ['$compile', function ($compile) {
            return {
                restrict: 'A',
                compile: function (ele, attrs) {
                    return {
                        pre: function (scope, iEle, iAttrs) {
                            var child = iEle.children();
                            var valid = attrs['validateError'] + '.$invalid';
                            //var error = attrs['validateError'] + '.$error';
                            var span = $('<span ng-class="{error:' + valid + '}"><span ng-show="' + valid + '"> * </span></span>');
                            if (child.length == 0) {
                                span.append(iEle.html());
                                iEle.html(span);
                            } else {
                                child.wrap(span);
                            }
                            $compile(span)(scope);
                        }
                    }
                }
            }
        }]);


    angular.module('eccrm.angularstrap.tooltip', ['mgcrea.ngStrap'])
        .config(['$tooltipProvider', function ($tooltipProvider) {
            angular.extend($tooltipProvider.defaults, {
                animation: 'am-flip-x',
                type: 'info',
                container: 'body',
                placement: 'top',
                trigger: 'hover'
            });
        }])
})(window, window.art);