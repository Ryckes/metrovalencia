

module.exports = (function() {

    function computeTimeDifference(time1, time2) {
        var time1splitted = time1.split(':'),
            time2splitted = time2.split(':'),
            minutes1 = parseInt(time1splitted[0])*60 + parseInt(time1splitted[1]),
            minutes2 = parseInt(time2splitted[0])*60 + parseInt(time2splitted[1]),
            diff = minutes2 - minutes1;

        return diff;
    }

    function getDateString(date) {
        return date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
    }

    function getTimeString(date) {
        var hours = date.getHours(),
            minutes = date.getMinutes();
        
        if(hours < 10) hours = '0' + hours;
        if(minutes < 10) minutes = '0' + minutes;

        
        return hours + ':' + minutes;
    }
    
    return {
        computeTimeDifference: computeTimeDifference,
        getDateString: getDateString,
        getTimeString: getTimeString
    };

}());