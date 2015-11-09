<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%
    String contextPath = request.getContextPath();
%>
<html>
<head>
    <title>licence</title>
    <link rel="stylesheet" href="<%=contextPath%>/vendor/bootstrap-v3.0/css/bootstrap.min.css"/>
    <link rel="stylesheet" href="<%=contextPath%>/style/standard/css/eccrm-common-new.css"/>
    <script type="text/javascript" src="<%=contextPath%>/static/ycrl/javascript/jquery-all.js"></script>
    <script type="text/javascript" src="<%=contextPath%>/static/ycrl/javascript/angular-all.js"></script>
    <script type="text/javascript" src="<%=contextPath%>/static/ycrl/javascript/angular-strap-all.js"></script>
    <script type="text/javascript" src="<%=contextPath%>/vendor/My97DatePicker/WdatePicker.js"></script>
    <style>
        .row {
            margin-top: 15px;
        }

        .form-label {
            position: relative;
            font-size: 12px;
            height: 30px;
            line-height: 30px;
        }

        input {
            position: relative;
            height: 30px;
            line-height: 30px;
            padding: 2px 10px;
        }

        .icons {
            cursor: pointer;
        }
    </style>
    <script type="text/javascript">
        window.angular.contextPathURL = '<%=contextPath%>';
        (function () {
            var app = angular.module('licence', [
                'eccrm.angular',
                'eccrm.angularstrap'
            ]);
            app.controller('Ctrl', function ($scope, CommonUtils, $window) {
                $scope.macAddress = [{}];
                $scope.beans = {
                    name: '上海优创融联计算机科技有限公司',
                    maxUser: 50
                };

                $scope.generate = function () {
                    var address = [];
                    angular.forEach($scope.macAddress, function (v) {
                        address.push(v.value);
                    });
                    $scope.beans.macAddress = address.join(',');
                    var p = encodeURI(encodeURI($.param($scope.beans)));
                    $window.open(CommonUtils.contextPathURL('/licence?') + p);
                };

                $scope.addMacAddress = function () {
                    $scope.macAddress.push({});
                };
                $scope.removeMacAddress = function (index) {
                    $scope.macAddress.splice(index, 1);
                };
            });
        })();
    </script>
</head>
<body>
<div class="main" ng-controller="Ctrl" ng-app="licence"
     style="width: 450px;border: 1px solid #d4e4f6;min-height: 400px;max-height:550px;overflow:auto;margin: 100px auto auto;padding: 10px 30px;">
    <form name="form" role="form">
        <div class="row">
            <div class="form-label col-3-half">
                <label>Mac地址：</label>
            </div>
            <span class="col">样例：84-A6-C8-19-7F-30</span>
        </div>
        <div class="row" ng-repeat="mac in macAddress">
            <div class="form-label col-3-half">
                <label>{{($index+1)}}：</label>
            </div>
            <div class="col-8-half">
                <input type="text" class="col-10" ng-model="mac.value" validate validate-required>
                <i class="col-1 icons add" ng-click="addMacAddress();"></i>
                <i class="col-1 icons minus" ng-click="removeMacAddress($index);" ng-if="$index>0"></i>
            </div>
        </div>

        <div class="row">
            <div class="form-label col-3-half">
                <label>使用者：</label>
            </div>
            <input type="text" class="col-8-half" ng-model="beans.name" validate
                   validate-min-length="2" validate-max-length="40" validate-required>
        </div>
        <div class="row">
            <div class="form-label col-3-half">
                <label>最大用户数：</label>
            </div>
            <input type="text" class="col-8-half" ng-model="beans.maxUser" validate validate-int
                   validate-max-value="200"
                   validate-min-value="1" validate-required>
        </div>
        <div class="row">
            <div class="form-label col-3-half">
                <label>开始时间：</label>
            </div>
            <input type="text" class="col-8-half" ng-model="beans.startDate" validate validate-required readonly
                   eccrm-my97="{maxDate:'#F{$dp.$D(\'end\')}'}" id="start">
            <span class="add-on">
                <i class="icons icon clock"></i>
            </span>
        </div>
        <div class="row">
            <div class="form-label col-3-half">
                <label>截止时间：</label>
            </div>
            <input type="text" class="col-8-half" ng-model="beans.endDate" validate validate-required readonly
                   eccrm-my97="{minDate:'#F{$dp.$D(\'start\')}'}" id="end">
            <span class="add-on">
                <i class="icons icon clock"></i>
            </span>
        </div>
    </form>
    <div class="button-row" style="margin-top: 20px;">
        <button class="btn" style="width: 180px;" ng-click="generate();" ng-disabled="form.$invalid">生成Licence</button>
    </div>
</div>
</body>
</html>
