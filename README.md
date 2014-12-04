#The Journey's Resource Factory.
Provides an AngularJS Factory for interfacing with data from The Journey's api.

##Installation
>bower install --save tjresource

##Usage:

- Include `tj.resource` as a dependency of your app.
- call `tjResourceProvider.setConfig()` in your `config()` block like so:
```javascript
myapp.config(function(tjResourceProvider) {
    tjResourceProvider.setConfig({
      apiUrl: 'https://yourapiendpoint/',
      apiKey: 'yourapikey',
  });
});
```
- Inject `tjResource` into your controller (or service/factory). Instantiate with collection name and default `Resource` (optional) like so:
```javascript
// simple example
myapp.service('posts', function(tjResource) {
  return new tjResource('posts');
})

// advanced example
myapp.service('People', function(tjResource) {
  var resource = function(data) {
    // do any transformation on data when Resource is initiated (ie converting strings into real dates, etc).
    this.dob = new Date(this.dob);
  }

  // add any prototype methods. These methods will be available on every item.
  resource.prototype.whatMyName = function() {
    return this.name;
  }

  // add any base methods. These methods will be available on People.
  resource.loadSomeNames = function() {
    return this.query({fields: 'name'}).then(function(res) {
      return res.results;
    });
  }

  return new tjResource('people', resource);
});
```
##Methods
Note: All methods are promise based.

###Factory Methods
`tjResource` exposes the following methods:

- `query` - Makes a `GET` call to a collection. Note, returned results are converted into instantiated `Resources` that have all `prototype` methods available.
- `load` - Loads a single resource.

###Resource Methods
`tjResource` also exposes the following default methods for each `Resource`:

- `save` - Calls `POST` (for new items) or `PUT` for existing items.
- `delete` - Calls `DELETE` for an item.

###Resource Hooks
`tjResource` also exposes the following hooks for each `Resource`:

- `preSave` - Promised-based method that is called before a `Resource` is saved
- `postSave` - Promised-based method that is called after a `Resource` is saved