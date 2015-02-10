

suite('Combination seeker', function() {

    var combinationSeeker = require('../extension/js/combination-seeker'),
        popupView = require('../extension/js/popup-view');

    var assert = require('chai').assert;

    suite('#getFeedback()', function() {

        var noCombinationMessage = 'No hay ninguna combinación de metros que permita realizar este trayecto.';

        test('should output "no combination message" if trip is an empty list', function() {
            // Arrange
            
            // Act
            var output = popupView.getFeedback([]);
            
            // Assert
            assert.equal(output, noCombinationMessage);
        });

        test('should not output "no combination" message if trip is a valid list of steps', function() {
            // Arrange
            // This set of steps has already been processed by
            // resolveDates and resolveTimeConstraints, they are not
            // called here because that would make this test dependent
            // on timeFunctions being tested and correct
            var returnedSteps = [{
                departureTime: '10:05',
                departureStation: 'Here',
                arrivalTime: '10:25',
                arrivalStation: 'There',
                departureDate: new Date('Sun Feb 01 2015 10:05:00 GMT+0100 (CET)'),
                arrivalDate: new Date('Sun Feb 01 2015 10:25:00 GMT+0100 (CET)'),
                findAnotherTrainButton: null }];

            // Act
            var output = popupView.getFeedback(returnedSteps);
            
            // Assert
            assert.notEqual(output, noCombinationMessage);
        });
    });


    suite('#seekCombination()', function() {

        test('should reject the promise if received page does not contain the trip information', function(done) {
            // Arrange
            var page = '<html><head><title>Out of luck</title></head><body>404 Not found</body></html>';
            var from = 'Here', to = 'There',
                time = '10:00', timeType = 'departure';
            combinationSeeker.initialize(function(opts) {
                opts.success(page);
            });
            
            // Act
            var promise = combinationSeeker.seekCombination(from, to, time, timeType);
            
            // Assert
            promise.then(undefined, function(e) {
                done();
            });
        });

        test('should call the ajax function with the expected data', function(done) {
            // Arrange
            var from = 1, to = 2, // station codes
                timeString = '19:00', timeType = 'departure',
                dateString = '3/50/2015';

            var ajaxFun = function(opts) {
                try {
                    // Assert
                    assert.equal(opts.data.origen, from);
                    assert.equal(opts.data.destino, to);
                    assert.equal(opts.data.tipo_hora, 'D');
                    assert.equal(opts.data.fecha, dateString);
                    assert.equal(opts.data.hora, timeString);
                    done();
                }
                catch(e) {
                    done(e);
                }
            };
            combinationSeeker.initialize(ajaxFun);

            // Act
            combinationSeeker.seekCombination(from, to, dateString, timeString, timeType);
        });

        test('should return the expected list of steps if received page is valid', function(done) {
            // Arrange
            var page = '<!--cabecera de inicio--><h2>Resultados de la busqueda</h2><br><div><strong>Tiempo estimado del trayecto: <font color="#CC0000"> 2 minutos aprox,</font>  salida a las 19:08 llegada a las 19:10</strong></div><div class="route">	<div class="steps"><div id="duracion"></div><div class="step main" style="cursor:pointer;" onmouseup="G.centrar_punto(puntos_camino[0])"><img class="type" src="images/route_step_begin.gif" /><div class="description">Here</div></div><!--bucle de los transbordos--><div class="step" style="background-repeat:none;cursor:pointer;" onmouseup="G.centrar_parada(18)"><img class="type" src="images/route_step_train.gif" alt="en tren"/><div class="description"><div>Toma la línea 5 en dirección Yonder en la estación Here<br><div class="stop"><span class="time">19:08</span> Linea <img src="images/icon_linea5.gif" alt="5"> Salida de Here<br><div class="duration">0 minutos aprox.</div></div><div class="stop"><span class="time">19:10</span> Linea <img src="images/icon_linea5.gif" alt="5"> Llegada a There<br><div class="duration">2 minutos aprox.</div></div>					</div>				</div>	</div>										<!--pie de destino--><div class="step main" style="cursor:pointer;" onmouseup="G.centrar_punto(puntos_camino[puntos_camino.length-1])"><img class="type" src="images/route_step_end.gif" /><div class="description">There</div></div> </div></div>';
            var ajaxFun = function(opts) {
                opts.success(page);
            };
            var from = 0, to = 1,
                timeString = '19:00', timeType = 'departure',
                dateString = '3/50/2015';
            
            var expectedTrip = [{
                departureTime: '19:08',
                departureStation: 'Here',
                arrivalTime: '19:10',
                arrivalStation: 'There'
            }];
            combinationSeeker.initialize(ajaxFun);
            
            // Act
            var promise = combinationSeeker.seekCombination(from, to, dateString, timeString, timeType);
            
            // Assert
            promise.then(function(trip) {
                try {
                    assert.deepEqual(trip, expectedTrip);
                    done();
                }
                catch(e) {
                    done(e);
                }
            }, done);
        });

        test('should return the expected list of steps if received page is valid and has two steps', function(done) {
            // Arrange
            var page = '<!-- Seccion donde se muestra el resultado de la planificacion del trayecto --><!--cabecera de inicio--><h2>Resultados de la busqueda</h2><br><div><strong>Tiempo estimado del trayecto: <font color="#CC0000"> 16 minutos aprox,</font>  salida a las 11:10 llegada a las 11:26</strong></div><div class="route">	<div class="steps"><div id="duracion"></div><div class="step main" style="cursor:pointer;" onmouseup="G.centrar_punto(puntos_camino[0])"><img class="type" src="images/route_step_begin.gif" /><div class="description">Av. del Cid</div></div><!--bucle de los transbordos--><div class="step" style="background-repeat:none;cursor:pointer;" onmouseup="G.centrar_parada(18)"><img class="type" src="images/route_step_train.gif" alt="en tren"/><div class="description"><div>Toma la línea 3 en dirección Alboraya-Peris AragÃ³ en la estación Av. del Cid<br><div class="stop"><span class="time">11:10</span> Linea <img src="images/icon_linea3.gif" alt="3"> Salida de Av. del Cid<br><div class="duration">0 minutos aprox.</div></div><div class="stop"><span class="time">11:21</span> Linea <img src="images/icon_linea3.gif" alt="3"> Llegada a Benimaclet<br><div class="duration">11 minutos aprox.</div></div>					</div>				</div>	</div><div class="step" style="background-repeat:none;cursor:pointer;" onmouseup="G.centrar_parada(12)"><img class="type" src="images/route_step_train.gif" alt="en tren"/><div class="description"><div>Transbordo en Benimaclet y toma la línea 4 en dirección Dr. Lluch<br>Tiempo de espera 1 minutos aprox.<div class="stop"><span class="time">11:22</span>  Línea <img src="images/icon_linea4.gif" alt="4"> Salida de Benimaclet<br><div class="duration">12 minutos aprox.</div></div><div class="stop"><span class="time">11:26</span> Línea <img src="images/icon_linea4.gif" alt="4"> Llegada a Universitat Politècnica<br><div class="duration">16 minutos aprox.</div></div>					</div>				</div>	</div>										<!--pie de destino--><div class="step main" style="cursor:pointer;" onmouseup="G.centrar_punto(puntos_camino[puntos_camino.length-1])"><img class="type" src="images/route_step_end.gif" /><div class="description">Universitat Politècnica</div></div> </div></div>';
            var ajaxFun = function(opts) {
                opts.success(page);
            };
            var from = 0, to = 1,
                timeString = '11:32', timeType = 'arrival',
                dateString = '21/1/2015';
            
            var expectedTrip = [{
                departureTime: '11:10',
                departureStation: 'Av. del Cid',
                arrivalTime: '11:21',
                arrivalStation: 'Benimaclet'
            }, {
                departureTime: '11:22',
                departureStation: 'Benimaclet',
                arrivalTime: '11:26',
                arrivalStation: 'Universitat Politècnica'
            }];
            combinationSeeker.initialize(ajaxFun);
            
            // Act
            var promise = combinationSeeker.seekCombination(from, to, dateString, timeString, timeType);
            
            // Assert
            promise.then(function(trip) {
                try {
                    assert.deepEqual(trip, expectedTrip);
                    done();
                }
                catch(e) {
                    done(e);
                }
            }, done);
        });

    });

});
