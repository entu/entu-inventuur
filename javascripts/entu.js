var entu = {
    url: null,
    userId: null,
    userToken: null,
    http: null
}



entu.getAuthUrl = function(state, redirect_url, callback) {
    entu.http.post(entu.url + '/api2/user/auth', {state: state, redirect_url: redirect_url})
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
}



entu.getUser = function(callback) {
    entu.http.get(entu.url + '/api2/user', {
            headers: {
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
            },
            params: params
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }
            if(data.result.length === 0) { return callback(data) }

            async.map(data.result, function(entity, callback) {
                entu.getEntity(entity.id, callback)
            }, callback)
        })
        .error(callback)
}



entu.getChilds = function(entityId, params, callback) {
    entu.http.get(entu.url + '/api2/entity-' + entityId +'/childs', {
            headers: {
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
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
                'X-Auth-UserId': entu.userId,
                'X-Auth-Token': entu.userToken
            }
        })
        .success(function(data) {
            if(!data.result) { return callback(data) }

            callback(null, data.result)
        })
        .error(callback)
}
