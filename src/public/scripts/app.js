angular.module('heistApp', ['ngMaterial'])
	.config(function($mdThemingProvider){
		$mdThemingProvider.theme('default')
		    .primaryPalette('blue')
		    .accentPalette('teal')
		    .warnPalette('red')
		    .backgroundPalette('grey', {
		    	'default': '900'
		    });
		$mdThemingProvider.theme('default')
    .primaryPalette('green', {
      'default': '500'
    })
    .accentPalette('grey', {
      'default': '600' // use shade 200 for default, and keep all other shades the same
    });

    $mdThemingProvider.enableBrowserColor({
      hue: '500' // Default is '800'
    });
	})
	.controller('AppCtrl', [ '$scope', '$window', '$timeout', 'preloader', function( $scope, $window, $timeout, preloader ) {

		var totalTime = 10 * 60 * 1000;
		var gates = [
			2,
			4,
			5,
			6
		];
		var gateIndex = 0;

		var heistBGM = document.getElementById("heistBGM");
		var getawayBGM = document.getElementById("getawayBGM");

		var startTimer = function ()
		{
			$scope.timerRunning = true;
			$scope.timestamp = Date.now();
			$window.requestAnimationFrame($scope.updateTimeElapsed.bind($scope));
		};

		var startCountdown = function( nextState ) {
			$scope.state = "countdown";
			$scope.secondsToStart = 4;
			function decrementCountdown ()
			{
				$scope.secondsToStart --;
				if ( $scope.secondsToStart == 0)
				{
					$scope.state = nextState;
					startTimer ();
				}
				else
				{
					$timeout(decrementCountdown.bind($scope), 1000);
				}
			}

			$timeout(decrementCountdown.bind($scope), 1000);
		}

		var startHeist = function () {
			heistBGM.play();
			startCountdown ( "heist" );
		};

		var getawayLayouts = [
			'./img/getaway0.png',
			'./img/getaway2.png',
			'./img/getaway4.png',
			'./img/getaway5.png',
			'./img/getaway6.png'
		];

		var stopHeist = function () {
			heistBGM.pause ();
			heistBGM.currentTime = 0.0;
			$scope.state = "intermission";
			$scope.heistSeconds = $scope.timer;
			$scope.meterFullSeconds = totalTime - $scope.heistSeconds;
			$scope.meterGate = totalTime - $scope.heistSeconds;
			$scope.timerRunning = false;

			var layoutIndex = gateIndex;
			if ( layoutIndex < 0 || layoutIndex > getawayLayouts.length - 1 )
			{
				layoutIndex = getawayLayouts.length - 1;
			}

			$scope.getawayLayout = getawayLayouts[ layoutIndex ];
		};

		var startGetaway = function () {
			getawayBGM.play ();
			startCountdown ( "getaway" );
		};

		var endGame = function () {
			heistBGM.pause ();
			heistBGM.currentTime = 0.0;
			getawayBGM.pause ();
			getawayBGM.currentTime = 0.0;

			if ( $scope.state === 'heist' )
			{
				$scope.heistSeconds = $scope.timer;
				$scope.getawayTimeRemaining = 0;
			}
			else
			{
				$scope.getawayTimeRemaining = Math.max( 0, $scope.timer );
			}
			$scope.timerRunning = false;
			$scope.state = "postgame";
		};

		var updateMeterGate = function () {
			if ( gateIndex < gates.length )
			{
				$scope.meterGate = gates[gateIndex] * 60 * 1000;
			}
			else
			{
				$scope.meterGate = -1;
			}
		}

		$scope.rotateBgId = undefined;
		$scope.bgIndex = 0;

		$scope.rotateBg = function() {
			if ( $scope.game === undefined )
			{
				console.error ( "rotate failure");
				return;
			}

			$scope.bgIndex = ( $scope.bgIndex + 1 ) % $scope.game.bgs.length;
			$scope.rotateBgId = $window.setTimeout($scope.rotateBg.bind($scope), 60 * 1000);
			$scope.$apply();
		};

		$scope.reset = function () {
			$scope.game = undefined;
			$scope.timestamp = 0;
			$scope.heistSeconds = 0;
			$scope.getawayTimeRemaining = 0;
			$scope.state = "select"
			$scope.timerRunning = false;
			$scope.timer = 0;
			$scope.nextGate = 2;
			$scope.secondsToStart = 4;
			$scope.meterFullSeconds = totalTime;
			$scope.meterGate = 0;
			$scope.result = undefined;
			$scope.getawayLayout = undefined;
			$scope.failed = false;
			gateIndex = 0;
			$scope.bgIndex = 0;
			$window.clearTimeout($scope.rotateBgId);
			$scope.rotateBgId = undefined;
			updateMeterGate ();
		};

		$scope.selectGame = function ( game ) {
			$scope.game = $scope.heists[game];
			$scope.game.bgs = shuffle($scope.game.bgs);
			$scope.state = "pregame";
			$scope.rotateBgId = $window.setTimeout($scope.rotateBg.bind($scope), 60 * 1000);
			preloader.preloadImages ( $scope.game.bgs );
		};

		$scope.action = function() {
			switch ( $scope.state )
			{
			case "pregame":
				startHeist ();
				break;

			case "heist":
				stopHeist ();
				break;

			case "intermission":
				startGetaway ();
				break;

			case "getaway":
				endGame ();
				break;

			case "postgame":
				$scope.reset ();
				break;

			default:
				console.error ("fell through");
				break;
			}
		};

		$scope.updateTimeElapsed = function() {
			if ($scope.timerRunning)
			{
				if ( $scope.state === "heist" )
				{
					$scope.timer = Date.now() - $scope.timestamp;
				}
				else
				{
					$scope.timer = ( totalTime - $scope.heistSeconds ) - ( Date.now() - $scope.timestamp );
				}

				if($scope.state === "heist" && $scope.timer > $scope.meterGate )
				{
					gateIndex ++;
					updateMeterGate.call($scope);
				}

				if( $scope.timer <= 0.0 
					|| $scope.timer > totalTime )
				{
					$scope.fail();
				}
				
				$scope.$apply();
				$window.requestAnimationFrame($scope.updateTimeElapsed.bind($scope));
			}
		};

		$scope.fail = function () {
			$scope.failed = true;
			endGame();
		};

		$scope.heists = {
			Gas: {
				name: 'Gas Station Hit',
				bgs: [
					'./img/gas0.png',
					'./img/gas1.png',
					'./img/gas2.png',
					'./img/gas3.png',
					'./img/gas4.png',
					'./img/gas5.png',
					'./img/gas6.png',
					'./img/gas7.png',
					'./img/gas8.png',
					'./img/gas9.png'
				],
				result: './img/gas_result.png'
			},
			Bank: {
				name: 'Bank Job',
				bgs: [
					'./img/bank0.png',
					'./img/bank1.png',
					'./img/bank2.png',
					'./img/bank3.png',
					'./img/bank4.png',
					'./img/bank5.png',
					'./img/bank6.png',
					'./img/bank7.png',
					'./img/bank8.png',
				],
				result: './img/bank_result.png'
			},
			Casino: {
				name: 'Casino Gambit',
				bgs: [
					'./img/casino0.png',
					'./img/casino1.png',
					'./img/casino2.png',
					'./img/casino3.png',
					'./img/casino4.png',
					'./img/casino5.png',
					'./img/casino6.png',
					'./img/casino7.png',
					'./img/casino8.png',
					'./img/casino9.png',
					'./img/casino10.png',
				],
				result: './img/casino_result.png'
			},
			Mansion: {
				name: 'Mansion Abduction',
				bgs: [
					'./img/mansion0.png',
					'./img/mansion1.png',
					'./img/mansion2.png',
					'./img/mansion3.png',
					'./img/mansion4.png',
					'./img/mansion5.png',
					'./img/mansion6.png',
					'./img/mansion7.png',
				],
				result: './img/mansion_result.png'
			}
		};

		$scope.loading = true;
		$scope.reset ();

		var imgSources = [
			'./img/Logo.png',
			'./img/gas_result.png',
			'./img/bank_result.png',
			'./img/casino_result.png',
			'./img/mansion_result.png',
		];

		preloader.preloadImages ( imgSources )
			.then ( function() {
				$scope.loading = false;
			});
	}]);

function shuffle(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}
