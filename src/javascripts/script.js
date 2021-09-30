var cl = function(data) {
    console.log(data)
}



angular.module('inventuurApp', ['ngRoute'])



//ROUTER
    .config(['$locationProvider', '$routeProvider', function($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(false)
        $locationProvider.hashPrefix('')
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
            .when('/:customer/:parentId/:definition/:property/:referenceParentId/:referenceDefinition', {
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



// UPDATE GOOGLE ANALYTICS
    .run(['$rootScope', '$location', '$routeParams', '$window', function($rootScope, $location, $routeParams, $window) {
        $rootScope.$on('$routeChangeSuccess', function() {
            ga('send', 'pageview', {
                page: $location.path()
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
            parent: function(callback) {
                if(!$routeParams.parentId) { return callback(null) }
                entu.getEntity($routeParams.parentId, callback)
            },
            items: function(callback) {
                if($routeParams.parentId === '*') {
                    entu.getEntities({ definition: $routeParams.definition }, true, callback)
                } else {
                    entu.getChilds($routeParams.parentId, { definition: $routeParams.definition }, true, callback)
                }
            },
            references: function(callback) {
                if($routeParams.referenceParentId === '*') {
                    entu.getEntities({ definition: $routeParams.referenceDefinition }, false, callback)
                } else {
                    entu.getChilds($routeParams.referenceParentId, { definition: $routeParams.referenceDefinition }, false, callback)
                }
            },
        }, function(error, result) {
            if(error) { return cl(error) }

            for(var i in result.items) {
                if(!result.items.hasOwnProperty(i)) { continue }
                if(!result.items[i][$routeParams.property]) { continue }

                result.items[i]._referenceIds = []
                for(var v in result.items[i][$routeParams.property]) {
                    if(!result.items[i][$routeParams.property].hasOwnProperty(v)) { continue }
                    result.items[i]._referenceIds.push(result.items[i][$routeParams.property][v].db_value)
                }
            }

            $scope.rData.pageTitle = result.parent ? result.parent._name : null
            $scope.sData.items = result.items
            $scope.sData.references = result.references
        })

        $scope.isReferenceSet = function(ids) {
            if(!ids) return
            return ids.indexOf($scope.sData.selectedReference) > -1
        }

        $scope.setReference = function($event, item) {
            if($event.target.checked) {
                var properties = {}
                properties[$routeParams.property] = $scope.sData.selectedReference
                entu.changeEntity(item._id, properties,  function(error, property) {
                    if(error) { return cl(error) }
                    if(!property.properties) { return cl(property) }
                    if(!property.properties[$routeParams.property]) { return cl(property) }
                    if(!property.properties[$routeParams.property].id) { return cl(property) }
                    if(!property.properties[$routeParams.property].value) { return cl(property) }

                    item._referenceIds.push(property.properties[$routeParams.property].value)
                })
            } else {
                for(var i in item[$routeParams.property]) {
                    if(!item[$routeParams.property].hasOwnProperty(i)) { continue }
                    if(item[$routeParams.property][i].db_value !== $scope.sData.selectedReference) { continue }

                    var properties = {}
                    properties[$routeParams.property + '.' + item[$routeParams.property][i].id] = ''
                    entu.changeEntity(item._id, properties,  function(error, property) {
                        if(error) { return cl(error) }
                        if(!property.properties) { return cl(property) }
                    })
                }
            }
        }
    }])
