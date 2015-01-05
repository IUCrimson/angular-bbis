Angular BBIS
============

This repo contains Angular native implimentations of the [BBIS REST API](http://developer.blackbaud.com/bbis/reference/rest/).  

##Notes##
- This port does not currently include cross domain support.
- Services are implimented as promises that return the data from a request.

##Examples##
For simplicity, examples are formatted as a single file that should be suitable to put in as an `Unformatted Text` part.

The `src` url for the `angular-bbis-services.js` file will need to be changed to your locally hosted version.

###Referencing Services###
- Include a reference to `angular-bbis-services.js` 
- When initializing your application, include a reference to `bbis.api`.
- Inject the services into your controller with `BbisApi`.

```html
    
    <!-- Include a reference to `angular-bbis-services.js`  -->
    <script src="angular-bbis-services.js"></script>

```

```javascript
    // When initializing your application, include a reference to `bbis.api`.
    var app = angular.module('MyApp', ['bbis.api']);

    // Inject the services into your controller with `BbisApi`.
    app.controller('MyController', function($scope, BbisApi) {
        var countrySvc = new BbisApi.CountryService();
        ...
    });

```

###Country and State###

Basic usage:

```javascript

    // Getting Countries
    var countrySvc = new BbisApi.CountryService();
    countrySvc.getCountries().then(function(countries) {
        $scope.countries = countries;
    });

    // Getting States
    countrySvc.getStates(countryId).then(function(states) {
        $scope.states = states;
    });

```

###Code Table###

###Donation###

###Images###

###Query###

###User###

##Project TODO##
- [ ] Complete basic examples in README
- [ ] Complete full examples in examples folder.
- [ ] Implement Cross Domain support.
- [ ] Decide whether or not to factor out BBIS API totally.
