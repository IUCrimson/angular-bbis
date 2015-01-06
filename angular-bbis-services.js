angular.module('bbis.api', [])

.config(function ($provide) {
    /**
     * Extends promises to have the .success() and .error() shortcuts
     * so that wrappers/custom methods can be called in the same way as the
     * methods returning $http calls directly.
     * 
     * Credit to @naturalethic at stackoverflow.
     * http://stackoverflow.com/questions/16797209/how-can-i-extend-q-promise-in-angularjs-with-a-succes-and-error
     */
    $provide.decorator('$q', function ($delegate) {
        var defer = $delegate.defer;
        $delegate.defer = function () {
            var deferred = defer();
            deferred.promise.success = function (fn) {
                deferred.promise.then(fn);
                return deferred.promise;
            };
            deferred.promise.error = function (fn) {
                deferred.promise.then(null, fn);
                return deferred.promise;
            };
            return deferred;
        };
        return $delegate;
    });

})

.factory('BbisApi', ['QueryService', 'UserService', 'CountryService', 'CodeTableService', 'ImageService', 'DonationService', function (QueryService, UserService, CountryService, CodeTableService, ImageService, DonationService) {
    /**
    * @class BbisApi wraps the other services so that they can be included at the same time instead of injecting them each individually.  
    * Note that they can still be injected individually.
    */
    return {
        QueryService: QueryService,
        UserService: UserService,
        CountryService: CountryService,
        CodeTableService: CodeTableService,
        ImageService: ImageService,
        DonationService: DonationService
    }
}])

.factory('QueryService', ['$http', '$q', function ($http, $q) {

    /**
    * @class QueryService Provides methods for retrieving query execution results from the CRM using calls to the BBIS REST services.
    * @param {Object} options An object literal containing one or more of the following optional properties:
    * <ul>
    * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved. This value is optional when accessed from a BBIS page. The default value will be the BBIS URL of the current page.</li>
    * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page. When True, the class will handle the complexities of making cross domain requests to retrieve data. The default value is False.</li>
    * </ul>
    */
    var QueryService = function (options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.baseUrl = url + "WebApi";
    };

    QueryService.prototype = {

        /**
         * Returns the result of executing the specified, published query. The query is executed as
         * the last user to save the query. The results are cached and may be up to 10 minutes old. The
         * results are limited to 5000 rows.
         * @param {String} queryId The Id of a query whose results should be returned.
         * @param {Array} filters An array of the filters to filter the results to rows that contain the
         * specified value in the specified column. When specifying a column, use the name that is found
         * in the query response. Depending on the type of column being filtered, the results may filter to rows
         * that exactly match the specified value instead of those that contain the specified value. Summary
         * columns such as MAX, MIN, and COUNT cannot be used as filters and will be ignored. The array should
         * contain objects with the following properties:
         * <ul>
         * <li><tt>columnName</tt> : The name of the column that should be used to filter the results.</li>
         * <li><tt>value</tt> : The value that the specified column should be filtered by.</li>
         * </ul>
         * @returns The promise will resolve with an object with the following properties:
         * <ul>
         * <li><tt>Fields</tt> : An array of objects describing the fields returned from the query. The objects
         * have have the following properties:
         * <ul>
         * <li><tt>Name</tt> : The name of the column in the query.</li>
         * <li><tt>Caption</tt> : The caption of the column defined in the query.</li>
         * </ul>
         * </li>
         * <li><tt>Rows</tt> : An array of objects describing the rows returned from the query. The objects
         * have have the following properties:
         * <ul>
         * <li><tt>Values</tt> : An array of the values returned for the row. The values are in the same order as the array of fields.</li>
         * </ul>
         * </li>
         * </ul>
        */
        getResults: function (queryId, filters) {
            var columnName,
                i,
                filter,
                value,
                queryString,
                url = this.baseUrl + "/Query/" + queryId;

            if (filters) {
                queryString = '';
                for (i = 0; i < filters.length; i++) {
                    filter = filters[i];
                    columnName = filter.columnName;
                    value = filter.value;

                    if (columnName && value) {
                        if (queryString.length > 0) {
                            queryString += '&';
                        }
                        queryString += encodeURIComponent(columnName) + "=" + encodeURIComponent(value);
                    }
                }

                if (queryString.length > 0) {
                    url += '?' + queryString;
                }
            }

            return $http.get(url);
        },

        /**
         * Returns result data retrieved from BLACKBAUD.api.QueryService transformed into an array of objects.
         * 
         * @param {String} queryId The Id of a query whose results should be returned.
         * @param {Array} filters An array of the filters to filter the results to rows that contain the
         * specified value in the specified column. When specifying a column, use the name that is found
         * in the query response. Depending on the type of column being filtered, the results may filter to rows
         * that exactly match the specified value instead of those that contain the specified value. Summary
         * columns such as MAX, MIN, and COUNT cannot be used as filters and will be ignored. The array should
         * contain objects with the following properties:
         * <ul>
         * <li><tt>columnName</tt> : The name of the column that should be used to filter the results.</li>
         * <li><tt>value</tt> : The value that the specified column should be filtered by.</li>
         * </ul>            
        */
        getResultsAsObjects: function (id, columnFilter) {
            var deferred = $q.defer();

            this.getResults(id, columnFilter).success(function (results) {
                var objects = [];
                var fields = results.Fields;
                var rows = results.Rows;

                angular.forEach(rows, function (row) {
                    var obj = {};

                    for (var i = 0, j = row.Values.length; i < j; i++)
                        obj[fields[i].Caption] = row.Values[i];

                    objects.push(obj);
                });

                deferred.resolve(objects);
            });

            return deferred.promise;
        }
    };

    return QueryService;
}])

.factory('UserService', ['$http', 'filterFilter', '$q', function ($http, filterFilter, $q) {

    /**
    * @class UserService Provides methods for retrieving information about the currently logged in BBIS user from the CRM using calls to the BBIS REST services.
    * @param {Object} options An object literal containing one or more of the following optional properties:
    * <ul>
    * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved. This value is optional when accessed from a BBIS page. The default value will be the BBIS URL of the current page.</li>
    * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page. When True, the class will handle the complexities of making cross domain requests to retrieve data. The default value is False.</li>
    * </ul>
    */
    var UserService = function (options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.baseUrl = url + "WebApi";
    };

    UserService.prototype = {
        /**
         * Returns profile information for the current user. If the user is not logged in,
         * then it may be populated based on the current email-recipient information.
         * @returns An object with the following properties:
         * <ul>
         * <li><tt>Addresses</tt> : An array of objects describing the addresses of the
         * current user.  The objects have have the following properties:
         * <ul>
         * <li><tt>City</tt> : The address's city.</li>
         * <li><tt>Country</tt> : The address's country.</li>
         * <li><tt>Id</tt> : The Id of the address.</li>
         * <li><tt>IsPrimary</tt> : Boolean indicating if the address is the user's primary address.</li>
         * <li><tt>PostalCode</tt> : The address's postal code.</li>
         * <li><tt>State</tt> : The address's state.</li>
         * <li><tt>StreedAddress</tt> : The address's street address.</li>
         * <li><tt>Type</tt> : The Id of the type of the address.</li>
         * </ul>
         * </li>
         * <li><tt>EmailAddresses</tt> : An array of objects describing the email addresses of the
         * current user.  The objects have have the following properties:
         * <ul>
         * <li><tt>EmailAddress</tt> : The email address.</li>
         * <li><tt>Id</tt> : The Id of the email address.</li>
         * <li><tt>IsPrimary</tt> : Boolean indicating if the email address is the user's primary email address.</li>
         * <li><tt>Type</tt> : The Id of the type of the email address.</li>
         * </ul>
         * </li>
         * <li><tt>FirstName</tt> : The first name of the current user.</li>
         * <li><tt>LastName</tt> : The last name of the current user.</li>
         * <li><tt>Phone</tt> : The phone number of the current user.</li>
         * <li><tt>Title</tt> : The title of the current user.</li>
         * </ul>
        */
        getProfile: function () {
            return $http.get(this.baseUrl + '/User');
        },

        /**
         * Returns profile information for the current user. If the user is not logged in,
         * then it may be populated based on the current email-recipient information.  
         * 
         * This is the same as getProfile except it plucks out the primary email and home 
         * address and puts their fields into the profile object returned. 
         * 
         * The resulting format is suitable to be passed as the Donor object in a DonationQuery call.     
        */
        getDonorProfile: function () {
            var deferred = $q.defer();

            this.getProfile().success(function (profile) {
                var user = {
                    Title: profile.Title,
                    FirstName: profile.FirstName,
                    LastName: profile.LastName,
                    Phone: profile.Phone,
                    Address: {}
                };

                // Email and Addresses come in arrays and we only want the primary.
                if (profile.EmailAddresses && profile.EmailAddresses.length) {
                    var primaryEmail = filterFilter(profile.EmailAddresses, { IsPrimary: true })[0];
                    user.EmailAddress = primaryEmail.EmailAddress;
                }

                if (profile.Addresses && profile.Addresses.length) {
                    var primaryAddress = filterFilter(profile.Addresses, { IsPrimary: true })[0];
                    user.Address.StreetAddress = primaryAddress.StreetAddress;
                    user.Address.City = primaryAddress.City;
                    user.Address.State = primaryAddress.State;
                    user.Address.PostalCode = primaryAddress.PostalCode;
                    user.Address.Country = primaryAddress.Country || 'United States';
                }

                deferred.resolve(user);
            });

            return deferred.promise;
        }
    };

    return UserService;
}])

.factory('CountryService', ['$http', function ($http) {

    /**
     * @class CountryService Provides methods for getting state and country information from the CRM using calls to the BBIS REST services.
     * @param {Object} options An object literal containing one or more of the following optional properties:
     * <ul>
     * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved. This value is optional when accessed from a BBIS page. The default value will be the BBIS URL of the current page.</li>
     * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page. When True, the class will handle the complexities of making cross domain requests to retrieve data. The default value is False.</li>
     * </ul>
    */
    var CountryService = function (options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.baseUrl = url + "WebApi";
    };

    CountryService.prototype = {

        /**
         * Returns a list of all active countries alphabetized by their description.
         * @returns An array of objects with the following properties:
         * <ul>
         * <li><tt>Id</tt> : The Id of a country.</li>
         * <li><tt>Abbreviation</tt> : The abbreviation of a country.</li>
         * <li><tt>Description</tt> : The description of a country.</li>
         * </ul>
        */
        getCountries: function () {
            return $http.get(this.baseUrl + '/Country');
        },

        /**
         * Returns a list of states associated with a specified country, alphabetized by their description.
         * @param {String} countryId The Id of a country whose states should be returned.
         * @returns An array of objects with the following properties:
         * <ul>
         * <li><tt>Id</tt> : The Id of a state.</li>
         * <li><tt>Abbreviation</tt> : The abbreviation of a state.</li>
         * <li><tt>Description</tt> : The description of a state.</li>
         * </ul>
         */
        getStates: function (countryId) {
            var url = this.baseUrl + "/Country/" + countryId + "/State";
            return $http.get(url);
        },

        /**
         * Returns the internationalized address captions associated with a specified country.
         * @param {String} countryId The Id of a country whose address captions should be returned.
         * @returns An object with the following properties:
         * <ul>
         * <li><tt>AddressLines</tt> : The caption for the address lines.</li>
         * <li><tt>City</tt> : The caption for the city.</li>
         * <li><tt>State</tt> : The caption for the state.</li>
         * <li><tt>PostCode</tt> : The caption for the postal code.</li>
         * </ul>
         */
        getAddressCaptions: function (countryId) {
            var url = this.baseUrl + "/Country/" + countryId + "/AddressCaptions";
            return $http.get(url);
        }
    };

    return CountryService;
}])

.factory('CodeTableService', ['$http', function ($http) {

    /**
     * @class CodeTableService Provides methods for retrieving code table entries from the CRM using calls to the BBIS REST services.
     * @param {Object} options An object literal containing one or more of the following optional properties:
     * <ul>
     * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved. This value is optional when accessed from a BBIS page. The default value will be the BBIS URL of the current page.</li>
     * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page. When True, the class will handle the complexities of making cross domain requests to retrieve data. The default value is False.</li>
     * </ul>
    */
    var CodeTableService = function (options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.baseUrl = url + "WebApi";
    }

    CodeTableService.prototype = {
        /**
         * Returns the active code table entries for the specified code table Id ordered as configured in the CRM.
         * @returns An array of objects with the following properties:
         * <ul>
         * <li><tt>Id</tt> : The Id of a code table entry.</li>
         * <li><tt>Description</tt> : The description of a code table entry.</li>
         * </ul>
         */
        getEntries: function (codeTableId) {
            var url = this.baseUrl + "/CodeTable/" + codeTableId;
            return $http.get(url);
        }
    };

    return CodeTableService;
}])

.factory('ImageService', ['$http', function ($http) {

    /**
     * @class ImageService Provides methods for getting information about images in the image gallery
     * @param {Object} options An object literal containing one or more of the following optional properties:
     * <ul>
     * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved. This value is optional when accessed from a BBIS page. The default value will be the BBIS URL of the current page.</li>
     * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page. When True, the class will handle the complexities of making cross domain requests to retrieve data. The default value is False.</li>
     * </ul>
    */
    var ImageService = function (options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.baseUrl = url + "WebApi";
    };

    ImageService.prototype = {

        /**
         * Returns a list of images in the specified folder.  Only approved images that the user has rights
         * to view will be returned.
         * @param {String} folderGUID The GUID of an image folder whose images should be returned.
         * @returns An array of objects with the following properties:
         * <ul>
         * <li><tt>Url</tt> : The Url of the image.</li>
         * <li><tt>Caption</tt> : The caption of the image.</li>
         * </ul>
         */
        getImagesByFolderGUID: function (folderGUID) {
            var url = this.baseUrl + "/Images?FolderGUID=" + encodeURIComponent(folderGUID);
            return $http.get(url);
        },

        /**
         * Returns a list of images with the specified tag.  Only approved images that the user has rights
         * to view will be returned.
         * @param {String} tag The tag whose images should be returned.
         * @returns n array of objects with the following properties:
         * <ul>
         * <li><tt>Url</tt> : The Url of the image.</li>
         * <li><tt>Caption</tt> : The caption of the image.</li>
         * </ul>
         */
        getImagesByTag: function (tag) {
            var url = this.baseUrl + "/Images?Tag=" + encodeURIComponent(tag);
            return $http.get(url);
        },

        /**
         * Returns a list of images in the specified folder.  Only approved images that the user has rights
         * to view will be returned.
         * @param {String} folderPath The path of an image folder whose images should be returned.  Example: Folder1/SubFolder1/SubFolder2
         * @returns An array of objects with the following properties:
         * <ul>
         * <li><tt>Url</tt> : The Url of the image.</li>
         * <li><tt>Caption</tt> : The caption of the image.</li>
         * </ul>
         */
        getImagesByFolder: function (folderPath) {
            var url = this.baseUrl + "/Images/" + encodeURIComponent(folderPath);
            return $http.get(url);
        }
    };

    return ImageService;
}])

.factory('DonationService', ['$http', '$q', function ($http, $q) {

    /**
    * @class DonationService Provides methods needed for taking donations and retrieving confirmation information.
    * @param {Integer} partId The Id of an Advanced Donation Form part that will be used as a context for all method calls.
    * @param {Object} options An object literal containing one or more of the following optional properties:
    * <ul>
    * <li><tt>url</tt> : The URL of the BBIS site from which the data will be retrieved.  This value is optional when accessed from a BBIS page.  The default value will be the BBIS URL of the current page.</li>
    * <li><tt>crossDomain</tt> : Indicates the BBIS url specified is from a separate domain than the current page.  When True, the class will handle the complexities of making cross domain requests to retrieve data.  The default value is False.</li>
    * </ul>
    */
    var DonationService = function (partId, options) {
        var url;

        if (typeof options === "string")
            url = options;
        else if (typeof options === "object")
            url = options.url;

        url = url || BLACKBAUD.api.pageInformation.rootPath;

        this.contextId = partId;
        this.baseUrl = url + 'WebApi/' + this.contextId + '/Donation';
    };

    DonationService.prototype = {

        /**
        * Validates the specified donation parameter. If valid, creates a donation transaction
        * and saves it to the database. Stores the Id of the new donation in session so the user
        * has permissions for the donation transaction. If the payment type is credit card, 
        * communicates with Blackbaud secured payment to set up a check out URI and adds that
        * URI to the return object. For credit card payment, the donation is saved in a Pending
        * state. For payments not using a credit card, the donation is saved in a Completed state
        * and an acknowledgement email is sent.
        * For credit card payments, the page is redirected to the Blackbaud secured payment checkout
        * page after calling the successCallback function.
        * @param {Object} donation An object describing the donation transaction to be created.
        * @returns An object describing the donation that was created.
        */
        createDonation: function (donation) {
            var url = this.baseUrl + '/Create';

            return $http.post(url, donation).success(function (donation) {
                if (donation.BBSPCheckoutUri)
                    location.href = donation.BBSPCheckoutUri;
                else if (donation.PaymentPageUri)
                    location.href = donation.PaymentPageUri;

                return donation;
            });
        },

        /**
        * Ensures the user has access to this donation by finding the Id in their session.
        * If so, returns information about the donation
        * @param {String} id The GUID id of the donation whose information should be returned.
        * @returns An object describing the donation with the specified Id.
        */
        getDonation: function (id) {
            var url = this.baseUrl + '/' + id;
            return $http.get(url);
        },

        /**
        * Signals the application to confirm that the credit card donation has been paid in Blackbaud secured
        * payment and to complete the creation of the donation. Updates the donation status and sends the acknowledgment email.
        * @param {String} id The GUID id of the donation that should be completed.
        * @returns An object describing the donation with the specified Id after its status
        * has been updated.
        */
        completeBBSPDonation: function (id) {
            var url = this.baseUrl + '/' + id + '/CompleteBBSPDonation';
            return $http.post(url);
        },

        /**
        * Gets HTML for a confirmation screen for the completed donation. Ensures the user has access to this
        * donation by finding the Id in their session. If so, loads the donation and merges the fields
        * into the part’s confirmation block
        * @param {String} id The GUID id of the donation that should be completed.
        * @returns A string containing the confirmation HTML from the part with details
        * from the specified donation merged in.
        */
        getDonationConfirmationHtml: function (id) {
            var deferred = $q.defer();
            var url = this.baseUrl + '/' + id + '/ConfirmationHtml';

            $http.get(url).success(function (result) {
                // Has a buch of \t, \n and \" 
                var fixedHtml = result
                                .replace(/\\n/g, '')                    // \n
                                .replace(/\\t/g, '')                    // \t
                                .replace(/\\/g, '')                     // \ in front of "s
                                .substring(1, result.length - 1);       // 1st and last "

                deferred.resolve(fixedHtml);
            });

            return deferred.promise;
        }
    };

    return DonationService;
}]);
