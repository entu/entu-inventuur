var cl = function(data) {
    console.log(data)
}



angular.module('inventuurApp', ['ngRoute'])



//ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(false)
        $routeProvider
            .when('/:customer', {
                templateUrl: 'start',
                controller: 'startCtrl'
            })
            .when('/:customer/login', {
                templateUrl: 'start',
                controller: 'loginCtrl'
            })
            .when('/:customer/auth', {
                templateUrl: 'start',
                controller: 'authCtrl'
            })
            .when('/:customer/logout', {
                templateUrl: 'start',
                controller: 'logoutCtrl'
            })
            .when('/:customer/:parentId/:definition', {
                templateUrl: 'items',
                controller: 'itemsCtrl'
            })
            // .otherwise({
            //     redirectTo: '/'
            // })
    }])



// SPINNER
    .directive('isLoading', ['$http', function($http) {
        return {
            restrict: 'A',
            link: function(scope, elm) {
                scope.isLoading = function() {
                    return $http.pendingRequests.length > 0
                }
                scope.$watch(scope.isLoading, function(v) {
                    if(v) {
                        if(elm[0].nodeName === 'IMG') { elm.show() }
                        if(elm[0].nodeName === 'INPUT' || elm[0].nodeName === 'SELECT') { elm.attr('readonly', 'readonly') }
                    } else {
                        if(elm[0].nodeName === 'IMG') { elm.hide() }
                        if(elm[0].nodeName === 'INPUT' || elm[0].nodeName === 'SELECT') { elm.attr('readonly', null) }
                    }
                })
            }
        }
    }])



// UPDATE GOOGLE ANALYTICS & INTERCOM
    .run(['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
        $rootScope.$on('$routeChangeSuccess', function() {
            if($window.sessionStorage.getItem('userEmail') && $window.sessionStorage.getItem('userName') && $window.sessionStorage.getItem('userEmail')) {
                window.Intercom('boot', {
                    app_id: 'a8si2rq4',
                    user_id: $window.sessionStorage.getItem('userEmail'),
                    name: $window.sessionStorage.getItem('userName'),
                    email: $window.sessionStorage.getItem('userEmail'),
                    created_at: new Date().getTime(),
                    company: {
                        id: "nommelumepark",
                        name: "Nõmme Lumepark"
                    }
                })
            }

            ga('send', 'pageview', {
                page: $location.path(),
                title: $location.path().substring(1).replace('/', ' - ')
            })
        })
    }])



// SET PATH WITHOUT RELOADING
    .run(['$route', '$rootScope', '$location', function ($route, $rootScope, $location) {
        var original = $location.path
        $location.path = function (path, reload) {
            if(reload === false) {
                var lastRoute = $route.current
                var un = $rootScope.$on('$locationChangeSuccess', function () {
                    $route.current = lastRoute
                    un()
                })
            }
            return original.apply($location, [path])
        }
    }])



// START
    .controller('startCtrl', ['$rootScope', '$http', '$routeParams', '$window', function($rootScope, $http, $routeParams, $window) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'

        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.customer = $routeParams.customer

        entu.getUser(function(error, user) {
            if(error) {
                $rootScope.rData.user = null
            } else {
                $rootScope.rData.user = user
            }
        })
    }])



// LOGIN
    .controller('loginCtrl', ['$http', '$location', '$routeParams', '$window', function($http, $location, $routeParams, $window) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'

        var state = '1234567890abcdef'

        $window.sessionStorage.clear()
        $window.sessionStorage.setItem('state', state)

        entu.getAuthUrl(state, $location.protocol() + '://' + location.host + '/#/' + $routeParams.customer + '/auth', function(error, data) {
            if(error) { return cl(error) }
            if(!data.auth_url) { return cl(data) }

            $window.sessionStorage.setItem('authUrl', data.auth_url)
            $window.location.href = data.auth_url
        })
    }])



// AUTH AFTER LOGIN
    .controller('authCtrl', ['$http', '$routeParams', '$window', function($http, $routeParams, $window) {
        var authUrl = $window.sessionStorage.getItem('authUrl')
        var state = $window.sessionStorage.getItem('state')

        $http.post(authUrl, {state: state})
            .success(function(data) {
                $window.sessionStorage.clear()
                $window.sessionStorage.setItem('userId', data.result.user.id)
                $window.sessionStorage.setItem('userToken', data.result.user.session_key)
                $window.sessionStorage.setItem('userName', data.result.user.name)
                $window.sessionStorage.setItem('userEmail', data.result.user.email)

                $window.location.href = '/#/' + $routeParams.customer + '/'
            })
            .error(function(error) {
                cl(error)
            })
    }])



// LOGOUT
    .controller('logoutCtrl', ['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
        $rootScope.rData = {}

        $window.sessionStorage.clear()
        $window.location.href = 'https://auth.entu.ee/exit?next=' + $location.protocol() + '://' + location.host
    }])



// ITEMS
    .controller('itemsCtrl', ['$scope', '$rootScope', '$http', '$routeParams', '$window', function($scope, $rootScope, $http, $routeParams, $window) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'
        entu.userId = $window.sessionStorage.getItem('userId')
        entu.userToken = $window.sessionStorage.getItem('userToken')

        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.customer = $routeParams.customer

        $scope.sData = {
            items: []
        }

        async.waterfall([
            function getUser(callback) {
                entu.getUser(function(error, user) {
                    if(error) {
                        $rootScope.rData.user = null
                        callback(error)
                    } else {
                        $rootScope.rData.user = user
                        callback(null)
                    }
                })
            },
            function getItems(callback) {
                entu.getChilds($routeParams.parentId, { definition: $routeParams.definition }, callback)
            },
        ], function(error, items) {
            if(error) { return cl(error) }

            $scope.sData.items = items
        })
    }])
