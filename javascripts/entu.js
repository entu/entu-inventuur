var entu = {
    url: null,
    http: null
}



entu.userLogin = function(redirect_url, callback) {
    var state = '1234567890abcdefg'

    window.sessionStorage.setItem('authState', state)

    entu.http.post(entu.url + '/api2/user/auth', {state: state, redirect_url: redirect_url}, callback)
        .then(function(data) {
            if(!data.result) { return callback(data) }
            if(!data.result.auth_url) { return callback(data) }

            window.sessionStorage.setItem('authUrl', data.result.auth_url)
            window.location = data.result.auth_url

            callback(null)
        })
        .catch(callback)
}



entu.userAuthenticate = function(callback) {
    entu.http.post(window.sessionStorage.getItem('authUrl'), {state: window.sessionStorage.getItem('authState')})
        .then(function(data) {
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
        .catch(callback)
}



entu.getUser = function(callback) {
    entu.http.get(entu.url + '/api2/user', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }

            var user = {
                id: data.result.id,
                token: data.result.session_key,
                name: data.result.name
            }

            callback(null, user)
        })
        .catch(callback)
}



var getEntity = function(entityId, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }
            console.log(data.result);
            if(!data.result.displaytable) { return callback(data) }

            var entity = {
                _id: data.result.id,
                _name: data.result.displayname,
                _longname: data.result.displaytable.join(' | '),
                _info: data.result.displayinfo
            }
            for(var p in data.result.properties) {
                if(!data.result.properties.hasOwnProperty(p)) { continue }
                if(!data.result.properties[p].values) { continue }
                entity[data.result.properties[p].keyname] = data.result.properties[p].values
            }

            callback(null, entity)
        })
        .catch(callback)
}
entu.getEntity = getEntity



entu.getEntities = function(params, fullEntity, callback) {
    entu.http.get(entu.url + '/api2/entity', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }
            if(data.result.length === 0) { return callback(null, []) }

            async.map(data.result, function(entity, callback) {
                if(fullEntity) {
                    entu.getEntity(entity.id, callback)
                } else {
                    callback(null, {
                        _id: entity.id,
                        _name: entity.name,
                        _info: entity.info
                    })
                }
            }, callback)
        })
        .catch(callback)
}



entu.getChilds = function(entityId, params, fullEntity, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId +'/childs', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }

            var entities = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    entities.push(data.result[i].entities[n])
                }
            }
            async.map(entities, function(entity, callback) {
                if(fullEntity) {
                    entu.getEntity(entity.id, callback)
                } else {
                    callback(null, {
                        _id: entity.id,
                        _name: entity.name,
                        _info: entity.info
                    })
                }
            }, callback)
        })
        .catch(callback)
}



entu.getReferrals = function(entityId, params, fullEntity, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId +'/referrals', {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            },
            params: params
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }

            var entities = []
            for(var i in data.result) {
                if(!data.result.hasOwnProperty(i)) { continue }
                for(var n in data.result[i].entities) {
                    if(!data.result[i].entities.hasOwnProperty(n)) { continue }
                    entities.push(data.result[i].entities[n])
                }
            }

            async.map(entities, function(entity, callback) {
                if(fullEntity) {
                    entu.getEntity(entity.id, callback)
                } else {
                    callback(null, {
                        _id: entity.id,
                        _name: entity.name,
                        _info: entity.info
                    })
                }
            }, callback)
        })
        .catch(callback)
}



entu.addEntity = function(parentEntityId, properties, callback) {
    entu.http.post(entu.url + '/api2/entity-' + parentEntityId, properties, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .catch(callback)
}



entu.changeEntity = function(entityId, properties, callback) {
    entu.http.put(entu.url + '/api2/entity-' + entityId, properties, {
            headers: {
                'X-Auth-UserId': window.sessionStorage.getItem('userId'),
                'X-Auth-Token': window.sessionStorage.getItem('userToken')
            }
        })
        .then(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .catch(callback)
}
