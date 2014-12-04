'use strict';

/**
 * @ngdoc service
 * @name tjResource
 * @description
 * # Resource
 * Service for interacting with data from The Journey's api.
 */
angular.module('tj.resource', [])
  .provider('tjResource', function tjResourceProvider() {
    var config = {
      apiUrl: null,
      apiKey: null,
    };

    this.setConfig = function(conf) {
      if(conf.apiUrl) {
        config.apiUrl = conf.apiUrl;
      }
      if(conf.apiKey) {
        config.apiKey = conf.apiKey;
      }
    }

    this.$get = function tjResourceFactory() {
      return new tjResource();
    }
  })
  .factory('Resource', ['$http', '$q', 'ENV', function ($http, $q, ENV) {
    return function (collection, Extend) {
      var headers = {
        'x-apikey': ENV.apiKey,
      }
      var Resource = function(data) {
        if(data) {
          if(data.published) {
            data.published = new Date(data.published);
          }
          if(typeof(Extend) == 'function') {
            Extend(data);
          }
          angular.extend(this, data);
        }
      };

      Resource.query = function (params, pagenate) {
        var self = this;
        if(params === undefined) {
          params = {};
        }

        if(pagenate === undefined || typeof pagenate !== 'boolean') {
          pagenate = true;
        }

        var config = {
          headers: headers,
          params: {
            query: JSON.stringify(params.query) || {},
            limit: params.limit !== undefined ? params.limit : null,
            offset: params.offset || 0,
            sort: params.sort || {label: 1},
            fields: params.fields || null,
            populate: params.populate || null,
          },
        };

        return $http.get(ENV.apiEndpoint + collection + '', config)
          .then(function(response) {
            var result = {
              limit: response.data.limit,
              num_found: response.data.num_found,
              offset: response.data.offset,
              results: [],
            };
            angular.forEach(response.data.results, function(v, k) {
              v._loaded = true;
              result.results[k] = new Resource(v);
            });

            if(!pagenate && (result.offset < result.num_found)) {
              if(!params.offset) {
                params.offset = 0;
              }
              params.offset += result.limit;
              return self.query(params, pagenate).then(function(res) {
                result.results = result.results.concat(res.results);
                return result;
              });
            } else {
              return result;
            }
          });
      };

      Resource.load = function(id, options) {
        var config = {
          headers: headers,
          params: {},
        };
        if(options === undefined) {
          options = {};
        }
        for(var x in options) {
          switch(x) {
            case 'fields':
              config.params.fields = JSON.stringify(options[x]);
              break;
            case 'populate':
              config.params.populate = JSON.stringify(options[x]);
              break;
          }
        }
        return $http.get(ENV.apiEndpoint + collection + '/' + id, config)
          .then(function(response) {
            response.data._loaded = true;
            return new Resource(response.data);
          });
      }

      Resource.prototype.load = function() {
        var r = this
          , deferred = $q.defer();
        if(!this._loaded && this.hasOwnProperty('_id')) {
          Resource.load(this._id).then(function(res) {
            angular.extend(r, res);
            deferred.resolve(res);
          });
        } else {
          deferred.resolve(r);
        }

        return deferred.promise;
      }

      /**
       * Default pre-save hook.
       *
       * Called prior to saving a resource.
       *
       * @return (object) Must return a promise. Once resolved, the resource
       *  will be saved.
       */
      Resource.prototype.preSave = function() {
        var deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      };

      /**
       * Default post-save hook.
       *
       * Called after saving a resource.
       *
       * @return (object) Must return a promise. Once resolved, the resource
       *  will be saved.
       */
      Resource.prototype.postSave = function() {
        return $q.all([]);
      }

      Resource.prototype.save = function() {
        var self = this;

        return self.preSave().then(function() {
          if(self.hasOwnProperty('_id')) {
            return $http.put(ENV.apiEndpoint + collection + '/' + self._id, self, {headers: headers}).then(function(result) {
              // Set protected values
              for(var x in result.data) {
                if(x.substring(0,1) === '_') {
                  self[x] = result.data[x];
                }
              }
              self.postSave();
            });
          } else {
            return $http.post(ENV.apiEndpoint + collection, self, {headers: headers})
              .then(function(result) {
                // Set protected values
                for(var x in result.data) {
                  if(x.substring(0,1) === '_') {
                    self[x] = result.data[x];
                  }
                }
                self.postSave();
              });
          }
        });
      }

      Resource.prototype.delete = function() {
        var self = this;
        return $http.delete(ENV.apiEndpoint + collection + '/' + self._id, {headers: headers}).then(function() {
          self._deleted = true;
        });
      }

      if(typeof(Extend) == 'function') {
        angular.extend(Resource, Extend);
        angular.extend(Resource.prototype, Extend.prototype);
      }

      return Resource;
    };
  }]);
