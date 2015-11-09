/**
 * 基于uploadify.js/uploadifive.js封装的附件上传插件
 * 如果浏览器支持html5，则使用html5的引擎
 * 否则尝试启用flash插件的方式
 * 注意，该js依赖angular.js和jquery.js,必须先引入这些被依赖的js
 */


/**
 * 检查浏览器是否安装了Flash插件
 * @returns {boolean}
 */
function checkFlash() {
    var isSupport = true;
    var notInstallFlashMsg = '您没有安装Flash插件，附件上传功能将无法使用!\r\n请安装最新版Flash插件后重启浏览器!';
    var isIe = $.browser.msie;
    if (isIe) {
        // 判断是否安装了flash插件
        try {
            new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
        } catch (e) {
            alert(notInstallFlashMsg);
            isSupport = false;
        }
    } else {
        var installedFlash = navigator.plugins['Shockwave Flash'];
        if (installedFlash === undefined) {
            alert(notInstallFlashMsg);
            isSupport = false;
        }
    }
    return isSupport;
}


/**
 * 附件信息
 * @constructor
 */
function Attachment() {
}

Attachment.prototype = {
    id: null,
    /**
     * 文件名称
     */
    fileName: null,
    fileType: null,
    contentType: null,
    /**
     * 文件大小，long
     */
    size: null,
    /**
     * 上传时间，long
     */
    uploadTime: null,
    /**
     * 业务id
     */
    businessId: null,
    /**
     * 业务类型
     */
    businessType: null,
    businessClass: null

};


/**
 * 附件上传的配置对象
 * @constructor
 */
function UploadOption() {

}


UploadOption.prototype = {
    id: null,            // 可选，文件选择框的id，如果不指定，则自动生成
    canDelete: true,     // 允许删除
    canDownload: true,   // 允许下载
    showLabel: true,     // 显示“附件”
    labelText: '附件',     // 要显示的文本
    showTable: true,     // 显示表格
    readonly: false,
    onSuccess: $.noop,  // 上传成功后的回调，会接收当前附件对象的信息，一个Attachment对象
    maxFile: 100,        // 允许上传的最大文件数
    bid: null,           // 业务ID，用于回显
    btype: null,         // 业务类型，在上传和回显时需要

    /**
     * 初始化成功后要可执行的函数，this为当前配置对象
     */
    afterInit: $.noop,
    /**
     * 附件的配置明细，SWFOption对象
     */
    swfOption: null
};


/**
 * uploadify组件的可配置项
 * @constructor
 */
function SWFOption() {

}

SWFOption.prototype = {
    // 必须，不对外提供开放
    // uploadify的swf文件的存放位置，默认值为uploadify.swf
    swf: null,
    // 必须，附件要上传的地址
    uploader: null,

    buttonText: '上传',
    height: 24,
    width: 80,
    // 文件最大大小20M
    fileSizeLimit: 20 * 1000,
    removeTimeout: 1,
    removeCompleted: true,
    // 是否允许上传多个
    multi: false,


    onSelectError: function (file, errorCode, errorMsg) {
        switch (errorCode) {
            case -100:
                alert('超出允许上传的最大文件数!');
                break;
            case -120:
                alert('不允许上传空文件!');
                break;
            case -130:
                alert('不支持上传的文件类型!');
                break;
            case -110:
                alert('文件过大!');
                break;
            default :
                alert('错误码:' + errorCode + ',错误描述:' + errorMsg);
        }
    },
    'overrideEvents': ['onUploadError', 'onDialogClose', 'onSelectError'],

    onDialogClose: function () {
        var swfUpload = this;
        if (swfUpload.settings.uploadLimit > 0 && swfUpload.queue.length > swfUpload.settings.uploadLimit) {
            alert('超出允许上传的最大文件数' + swfUpload.settings.uploadLimit + '!');
            return false;
        }
    },
    onUploadError: function (e, errorCode, m1, m2) {
        switch (errorCode) {
            case -240:
                alert('上传失败：超出允许上传的最大文件数!');
                break;
            case -200:
                alert('上传失败：HTTP请求错误!' + m1 + ":" + m2);
                break;
            case -210:
                alert('上传失败：上传URL不能为空!');
                break;
            case -220:
                alert('上传失败：IO异常!' + m1 + ":" + m2);
                break;
            case -250:
                alert('上传失败!' + m1 + ":" + m2);
                break;
            default :
                alert("上传失败：" + m1 + ":" + m2);

        }
    },
    onFallback: function () {
        alert('初始化附件上传失败,没有检测到当前浏览器安装Flash插件!');
    }
};


(function ($) {

    if (!checkFlash()) {
        throw '没有安装Flash插件!无法使用附件上传功能';
    }


// 检测是否引入了基础模块
    var app = angular.module('eccrm.angular');
    if (app == undefined) {
        alert('没有检测到[eccr.angular]模块,请保证引入该js前已经引入了eccrm-angular.js');
        return false;
    }


// 插件相关js和css是否加载成功的标示
    var envPrepared = false;


// 需要注意的问题
// 当页面的session失效后，sessionId就会获取不到，从而会导致该插件出现302错误
    app.directive('eccrmUpload', ['CommonUtils', '$http', '$timeout', 'ModalFactory', function (CommonUtils, $http, $timeout, ModalFactory) {
        var uploadifyJsPath = CommonUtils.contextPathURL('/vendor/uploadify/jquery.uploadify.js');
        var uploadifyCssPath = CommonUtils.contextPathURL('/vendor/uploadify/uploadify.css');
        var uploadifySwfPath = CommonUtils.contextPathURL('/vendor/uploadify/uploadify.swf');
        // 加载上传附件的js
        var loadJs = function () {
            var context = this;
            if (envPrepared == true) {
                context.resolve();
                return true;
            }
            var timer = $timeout(function () {
                context.reject('请求超时:' + uploadifyJsPath);
            }, 5000);
            $.getScript(uploadifyJsPath, function () {
                $timeout.cancel(timer);
                context.resolve();
            });
        };

        // 加载附件上传的css
        var loadCss = function () {
            var context = this;
            if (envPrepared == true) {
                context.resolve();
                return true;
            }
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.href = uploadifyCssPath;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            head.appendChild(link);
            this.resolve();
        };

        return {
            restrict: 'A',
            templateUrl: CommonUtils.contextPathURL('/static/ycrl/javascript/template/upload.html'),
            scope: {
                options: '=eccrmUpload'
            },
            link: function (scope, elem) {

                scope.attachments = [];

                /**
                 * 下载附件
                 * @param id
                 */
                scope.download = function (id) {
                    window.open(CommonUtils.contextPathURL('/attachment/download?id=' + id), "_blank");
                };

                /**
                 * 删除附件
                 * @param index 索引
                 * @param id 附件ID
                 */
                scope.deleteAttachment = function (index, id) {
                    scope.content = '附件删除后,将不可恢复,请确认删除!';
                    ModalFactory.remove(scope, function () {
                        $http.get(CommonUtils.contextPathURL('/attachment/delete?ids=' + id))
                            .success(function (data) {
                                if (data && data.success) {
                                    scope.attachments.splice(index, 1);
                                }
                            })
                    });
                };
                // 初始化插件
                var init = function () {
                    // 修改标识位，表示已经初始化过一次
                    envPrepared = true;

                    // 获取自定义配置 & 初始化uploadify参数
                    var promise = CommonUtils.parseToPromise(scope.options)
                        .then(function (cfg) {
                            var fileInput = elem.find('input[type="file"]');
                            var id = CommonUtils.randomID(6);
                            fileInput.attr('id', id);
                            var options = angular.extend(new UploadOption(), cfg);


                            /**
                             * 获取所有的附件ID
                             */
                            options.getAttachment = function () {
                                var ids = [];
                                angular.forEach(scope.attachments || [], function (o) {
                                    ids.push(o.id);
                                });
                                return ids;
                            };

                            /**
                             * 清空所有上传的附件
                             */
                            options.removeAll = function () {
                                var attachments = scope.attachments;
                                if (attachments.length > 0) {
                                    var url = CommonUtils.contextPathURL('/attachment/delete?ids=' + this.getAttachment().join(','));
                                    $http.get(url).success(function () {
                                        elem.find('input[type="file"]').uploadify('cancel', '*');
                                        attachments.splice(0, attachments.length);
                                    }).error(function () {
                                        alert('附件清除失败!');
                                    });
                                }

                            };

                            // 回显
                            var bid = options.bid;
                            var btype = options.btype || '';
                            if (options.bid) {
                                var url = CommonUtils.contextPathURL('/attachment/query?bid=' + options.bid);
                                if (options.btype) {
                                    url = url + '&btype=' + btype;
                                }
                                $http.get(url).success(function (data) {
                                    data = data.data || [];
                                    angular.forEach(data, function (o) {
                                        scope.attachments.push(o);
                                    });
                                });
                            }
                            scope.options = options;
                            options.swfOption = angular.extend(new SWFOption(), cfg.swfOption, {
                                swf: uploadifySwfPath,
                                formData: {businessType: btype},
                                uploader: CommonUtils.contextPathURL('/attachment/upload2'),
                                onUploadSuccess: function (file, data, response) {
                                    var obj = $.parseJSON(data);
                                    if (!(angular.isArray(obj) && obj.length > 0)) {
                                        alert('附件上传失败!');
                                        throw '附件上传失败!没有获取到返回的附件信息!' + (obj.error || obj.fail || obj.message || "");
                                    }

                                    // 获得附件信息
                                    scope.$apply(function () {
                                        scope.attachments.push(obj[0]);
                                    });

                                    // 第三方回调
                                    if (angular.isFunction(options.onSuccess)) {
                                        options.onSuccess(obj[0]);
                                    }
                                },
                                onInit: function (instance) {
                                }
                            });


                            // 真正初始化
                            fileInput.uploadify(options.swfOption);
                        });
                };

                // 加载js失败
                var loadError = function (errorMsg) {
                    alert(errorMsg);
                };

                // 加载js和样式
                CommonUtils.chain([loadJs, loadCss], init, loadError);
            }
        };
    }
    ])
    /**
     * 格式化文件大小
     */
        .filter('fileSize', function () {
            return function (value) {
                if (typeof value === 'number') {
                    if (value < 1000) {
                        return value + ' Byte';
                    } else if (value < 1000000) {
                        return (value / 1000).toFixed(2) + ' KB';
                    } else if (value < 1000000000) {
                        return (value / 1000000).toFixed(2) + ' MB';
                    } else if (value < 1000000000000) {
                        return (value / 1000000000).toFixed(2) + ' GB';
                    } else {
                        return value + ' Byte';
                    }
                }
                return '0KB';

            }
        });
})
(jQuery);