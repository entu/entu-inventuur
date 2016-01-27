var entu = {
    url: null,
    http: null
}



entu.userLogin = function(redirect_url, callback) {
    var state = '1234567890abcdefg'

    window.sessionStorage.setItem('authState', state)

    entu.http.post(entu.url + '/api2/user/auth', {state: state, redirect_url: redirect_url}, callback)
        .success(function(data) {
            if(!data.result) { return callback(data) }
            if(!data.result.auth_url) { return callback(data) }

            window.sessionStorage.setItem('authUrl', data.result.auth_url)
            window.location = data.result.auth_url

            callback(null)
        })
        .error(callback)
}



entu.userAuthenticate = function(callback) {
    entu.http.post(window.sessionStorage.getItem('authUrl'), {state: window.sessionStorage.getItem('authState')})
        .success(function(data) {
            if(!data.result) { return callback(data) }
            if(!data.result.user) { return callback(data) }

            window.sessionStorage.removeItem('authUrl')
            window.sessionStorage.removeItem('authState')

            window.sessionStorage.setItem('userId', data.result.user.id)
            window.sessionStorage.setItem('userToken', data.result.user.session_key)
            window.sessionStorage.setItem('userName', data.result.user.name)
            window.sessionStorage.setItem('userEmail', data.result.user.email)

            callback(null, data.result.user)
        })
        .error(callback)
}



entu.getUser = function(callback) {
    entu.http.get(entu.url + '/api2/user', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var user = {
                id: data.result.id,
                token: data.result.session_key,
                name: data.result.name
            }

            callback(null, user)
        })
        .error(callback)
}



var getEntity = function(entityId, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var entity = {
                _id: data.result.id,
                _name: data.result.displayname,
                _info: data.result.displayinfo
            }
            for(var p in data.result.properties) {
                if(!data.result.properties.hasOwnProperty(p)) { continue }
                if(!data.result.properties[p].values) { continue }
                entity[p] = data.result.properties[p].values[0]
            }

            callback(null, entity)
        })
        .error(callback)
}
entu.getEntity = getEntity



entu.getEntities = function(params, callback) {
    entu.http.get(entu.url + '/api2/entity', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }
            if(data.result.length === 0) { return callback(null, []) }

            async.map(data.result, function(entity, callback) {
                entu.getEntity(entity.id, callback)
            }, callback)
        })
        .error(callback)
}



entu.getChilds = function(entityId, params, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId +'/childs', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var ids = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    ids.push(data.result[i].entities[n].id)
                }
            }
            async.map(ids, function(id, callback) {
                entu.getEntity(id, callback)
            }, callback)
        })
        .error(callback)
}



entu.getReferrals = function(entityId, params, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId +'/referrals', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            var ids = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    ids.push(data.result[i].entities[n].id)
                }
            }

            async.map(ids, function(id, callback) {
                entu.getEntity(id, callback)
            }, callback)
        })
        .error(callback)
}



entu.addEntity = function(parentEntityId, properties, callback) {
    entu.http.post(entu.url + '/api2/entity-' + parentEntityId, properties, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
}



entu.changeEntity = function(entityId, properties, callback) {
    entu.http.put(entu.url + '/api2/entity-' + entityId, properties, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
}



entu.getErply = function(method, params, callback) {
    entu.http.post(erplyAPI + method, params, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
}
