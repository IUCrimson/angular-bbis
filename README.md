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

###CountryService###
CountryService Provides methods for getting state and country information from the CRM using calls to the BBIS REST services.

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

###CodeTableService###
CodeTableService Provides methods for retrieving code table entries from the CRM using calls to the BBIS REST services.

```javascript
    // Service and ID for getting Code Table information.
    var codeTableSvc = new BbisApi.CodeTableService();
    var codeTableId = 'a19037c0-291a-4c8b-9595-c41b9d932a32';

    // Models for data returned from the CodeTable service.
    $scope.codeTable = [];
    $scope.selection = null;

    // Populate countries from the Country service.
    codeTableSvc.getEntries(codeTableId).then(function (entries) {
        $scope.codeTable = entries;
    });
```

###DonationService###
DonationService Provides methods needed for taking donations and retrieving confirmation information.

The `DonationService` requires the Part Id from an `Advanced Donation Part` to initialize.  The code can either be embedded in an `Advanced Donation Part` directly or anywhere on the same page as one so the Part Id can be selected.

```javascript

```

###ImageService###
ImageService Provides methods for getting information about images in the image gallery

```javascript

```

###QueryService###
QueryService Provides methods for retrieving query execution results from the CRM using calls to the BBIS REST services.

```javascript
    // Query service.
    var querySvc = new BbisApi.QueryService();

    // Note: The Query must have `Enable query for CMS REST API` enabled.
    var queryId = 'b1f11003-ed86-4aef-a861-e3b37b8fff3f';

    // Query results model
    $scope.queryResults = [];

    // Get results as an array of objects
    querySvc.getResultsAsObjects(queryId).then(function (results) {
        $scope.queryResults = results;
    });

    // Get results as an object with Fields: [] and Rows: []
    querySvc.getResults(queryId).then(function (results) {
        $scope.queryResults = results;
    });
```

###UserService###
UserService Provides methods for retrieving information about the currently logged in BBIS user from the CRM using calls to the BBIS REST services.

```javascript

```


##Project TODO##
- [ ] Complete basic examples in README
- [ ] Complete full examples in examples folder.
- [ ] Implement Cross Domain support.
- [ ] Decide whether or not to factor out BBIS API totally.
