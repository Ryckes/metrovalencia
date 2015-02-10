
var Promise = require('bluebird');

module.exports = (function() {

    var ajaxMethod;

    function processResponse(data) {
        var regexp = /salida a las (\d+:\d+) llegada a las (\d+:\d+)/im,
            results = data.match(regexp);

        if(results) {

            var steps = [];

            var originsRegexp = /<span class="time">(\d+:\d+)<\/span>\s*L[ií]nea <img src="images\/icon_linea\d.gif" alt="\d"> Salida de ([^<]+)\s*<br>/g,
                destinationsRegexp = /<span class="time">(\d+:\d+)<\/span>\s*L[ií]nea <img src="images\/icon_linea\d.gif" alt="\d"> Llegada a ([^<]+)\s*<br>/g,
                origin,
                destination;

            while((origin = originsRegexp.exec(data)))
                steps.push({
                    departureTime: origin[1],
                    departureStation: origin[2]
                });

            var i = 0;
            while((destination = destinationsRegexp.exec(data))) {
                steps[i].arrivalTime = destination[1];
                steps[i++].arrivalStation = destination[2];
            }

            return steps;
        }
        else {
            return [];
        }
    }

    function seekCombination(from, to, dateString, timeString, timeType) {
        // from and to are station codes

        var data = {
	    origen: from,
	    destino: to,
	    tipo_hora: (timeType === 'departure')?'D':'A',
	    fecha: dateString,
	    hora: timeString,
	    form1: '',
	    dir_origen: '',
	    origen_x: '',
	    origen_y: '',
	    dir_destino: '',
	    destino_x: '',
	    destino_y: '',
	    calcular: 1
        };

        return new Promise(function(resolve, reject) {

            var opts = {
                data: data,
                dataType: 'html',
                type: 'POST',
                error: function(xhr, status, error) {
                    reject(error);
                },
                success: function(data) {
                    var steps = processResponse(data);

                    if(steps.length === 0)
                        reject('Received page could not be parsed for a trip.');
                    else
                        resolve(steps);
                },
                url: 'http://www.metrovalencia.es/planificador.php'
            };

            ajaxMethod(opts);
        });
    }

    return {
        initialize: function(ajaxMethodLocal) {
            ajaxMethod = ajaxMethodLocal;
        },
        seekCombination: seekCombination
    };

}());