// Controller for the poll list
function PollListCtrl($scope, Poll) {
	$scope.polls = Poll.query();
}

// Controller for an individual poll
function PollItemCtrl($scope, $routeParams, socket, Poll) {	
	Poll.get({pollId: $routeParams.pollId}, function(poll){
		$scope.poll = poll;
	});

	$scope.updateSelection = function(position, entities) {
      angular.forEach(entities, function(subscription, index) {
        if (position != index) 
          subscription.checked = false;
      });
    }
	
	socket.on('myvote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll = data;
			$scope.initChoice();
		}
	});
	
	socket.on('vote', function(data) {
		console.dir(data);
		if(data._id === $routeParams.pollId) {
			$scope.poll.choices = data.choices;
			$scope.poll.totalVotes = data.totalVotes;
			$scope.initChoice();
		}		
	});
	
	$scope.vote = function() {
		var choiceId = null;
		angular.forEach($scope.poll.choices, function(choiceItem) {
			if (choiceItem.checked === true) {
				choiceId = choiceItem._id
			};
		});
		var pollId = $scope.poll._id;
		console.log('USER CHOICE ', $scope.poll.userChoice);
		
		if(choiceId) {
			if (!$scope.poll.userChoice) {
				var voteObj = { poll_id: pollId, choice: choiceId };
				socket.emit('send:vote', voteObj);
			} else if(choiceId !== $scope.poll.userChoice._id) {
				var voteObj = { poll_id: pollId, choice: choiceId };
				socket.emit('send:vote', voteObj);
			} else {
				alert('You already choosed this one. Please change!');
			}	
		} else {
			alert('You must select an option to vote for');
		}
		$scope.initChoice();
	};

	$scope.initChoice = function() {
		if (!$scope.poll) {
			Poll.get({pollId: $routeParams.pollId}, function(poll){
				$scope.poll = poll;
				console.log('AAAAAAAA Type ', $scope.poll);
				for(var i=0; i<$scope.poll.choices.length; i++) {
					if ($scope.poll.userChoice && $scope.poll.choices[i]._id === $scope.poll.userChoice._id) {
						$scope.poll.choices[i].checked = true;
					} else {
						$scope.poll.choices[i].checked = false;
					}
				}
			});
		} else {
			for(var i=0; i<$scope.poll.choices.length; i++) {
				if ($scope.poll.userChoice && $scope.poll.choices[i]._id === $scope.poll.userChoice._id) {
					$scope.poll.choices[i].checked = true;
				} else {
					$scope.poll.choices[i].checked = false;
				}
			}
		}
		//$scope.poll = Poll.get({pollId: $routeParams.pollId});
		
	};
}

// Controller for creating a new poll
function PollNewCtrl($scope, $location, Poll) {
	// Define an empty poll model object
	$scope.poll = {
		question: '',
		choices: [ { text: '' }, { text: '' }, { text: '' }]
	};
	
	// Method to add an additional choice option
	$scope.addChoice = function() {
		$scope.poll.choices.push({ text: '' });
	};
	
	// Validate and save the new poll to the database
	$scope.createPoll = function() {
		var poll = $scope.poll;
		
		// Check that a question was provided
		if(poll.question.length > 0) {
			var choiceCount = 0;
			
			// Loop through the choices, make sure at least two provided
			for(var i = 0, ln = poll.choices.length; i < ln; i++) {
				var choice = poll.choices[i];
				
				if(choice.text.length > 0) {
					choiceCount++
				}
			}
		
			if(choiceCount > 1) {
				// Create a new poll from the model
				var newPoll = new Poll(poll);
				
				// Call API to save poll to the database
				newPoll.$save(function(p, resp) {
					if(!p.error) {
						// If there is no error, redirect to the main view
						$location.path('polls');
					} else {
						alert('Could not create poll');
					}
				});
			} else {
				alert('You must enter at least two choices');
			}
		} else {
			alert('You must enter a question');
		}
	};
}