var cl = function(data) {
    console.log(data)
}



angular.module('inventuurApp', ['ngRoute'])



//ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(false)
        $routeProvider
            .when('/', {
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
            .when('/:customer/:definition/:property/:reference/:parentId', {
                templateUrl: 'items',
                controller: 'itemsCtrl'
            })
            .otherwise({
                redirectTo: '/'
            })
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
    .controller('loginCtrl', ['$http', '$location', '$routeParams', function($http, $location, $routeParams) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'

        entu.userLogin($location.protocol() + '://' + location.host + '/#/' + $routeParams.customer + '/auth', function(error) {
            if(error) { return cl(error) }
        })
    }])



// AUTH AFTER LOGIN
    .controller('authCtrl', ['$http', '$routeParams', '$window', function($http, $routeParams, $window) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'

        entu.userAuthenticate(function(error, user) {
            if(error) { return cl(error) }

            var url = '/#/' + $routeParams.customer

            if($window.sessionStorage.getItem('nextUrl')) {
                url = '/#' + $window.sessionStorage.getItem('nextUrl')
                $window.sessionStorage.removeItem('nextUrl')
            }

            $window.location.href = url
        })
    }])



// LOGOUT
    .controller('logoutCtrl', ['$rootScope', '$location', '$window', function($rootScope, $location, $window) {
        $rootScope.rData = {}

        $window.sessionStorage.clear()
        $window.location.href = 'https://auth.entu.ee/exit?next=' + $location.protocol() + '://' + location.host
    }])



// ITEMS
    .controller('itemsCtrl', ['$scope', '$rootScope', '$http', '$location', '$routeParams', '$window', function($scope, $rootScope, $http, $location, $routeParams, $window) {
        entu.http = $http
        entu.url = 'https://' + $routeParams.customer + '.entu.ee'

        if(!$rootScope.rData) { $rootScope.rData = {} }

        $rootScope.rData.customer = $routeParams.customer

        $scope.sData = {
            items: []
        }

        async.parallel({
            user: function(callback) {
                entu.getUser(function(error, user) {
                    if(error) {
                        $window.sessionStorage.setItem('nextUrl', $location.path())
                        $window.location.href = '/#/' + $routeParams.customer + '/login'

                        callback(error)
                    } else {
                        $rootScope.rData.user = user
                        callback(null)
                    }
                })
            },
            items: function(callback) {
                entu.getChilds($routeParams.parentId, { definition: $routeParams.definition }, callback)
            },
            references: function(callback) {
                entu.getEntities({ definition: $routeParams.reference }, callback)
            },
        }, function(error, result) {
            if(error) { return cl(error) }

            $scope.sData.items = result.items
            $scope.sData.references = result.references
        })
    }])
