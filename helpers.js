function isPositiveInteger(n) {
    return 0 === n % (!isNaN(parseFloat(n)) && 0 <= ~~n);
}

function roll(user, a, b) {
	if (b === undefined || b === null) {
		var rand_roll = Math.floor(Math.random()*a);
		if (a > 0) {
			return user + " rolls " + rand_roll + " (1-" + a + ")";
		} else {
			return user + " rolls " + rand_roll + " (" + a + "-0)";
		}
	// 2 numbers given, roll from a to b, assuming a < b
	} else {
		if (a > b) {
			return "Rolls require the first number to be less than the second.";
		}
		var rand_roll = Math.floor(Math.random()*(b-a)+a);
		return user + " rolls " + rand_roll + " (" + a + "-" + b + ")"; 
	}
}