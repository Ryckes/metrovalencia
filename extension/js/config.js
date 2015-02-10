
;(function(exports) {

    var defaults = {
        minimumConnectionTime: 2
    };

    function set(field, value) {
        var opts = {};
        opts[field] = value;
        chrome.storage.sync.set(opts);
    }

    function get(field, cb) {
        chrome.storage.sync.get(field, function(data) {
            var value = data[field] || defaults[field];
            cb(value);
        });
    }

    function getDefault(field) {
        return defaults[field];
    }

    exports.get = get;
    exports.getDefault = getDefault;
    exports.set = set;

}(typeof exports === 'undefined'? this : exports));