import { getData, setData } from './dataStore.js';

/**
 * Reset the state of the application back to the start.
 * 
 * @param {} - no parameters
 * @returns {} - doesn't return anything
 */
export function clear () {
    let data = getData();
    
    data = {
        users: [],
        quizzes: [],
    };
    
    setData(data);

    return { };
}

// HELPER FUNCTIONS


/**
 * Checks whether a given number is a valid user id
 * 
 * @param {number} authUserId 
 * @returns {boolean} true if valid, false if invalid
 */
function isValidUserId(authUserId) {
    if(isNaN(authUserId)) {
        return false;
    };
    let data = getData();
    for (const current of data.users) {
        if (current.authUserId === authUserId) {
            return true;
        }
    };
    return false;
}


/**
 * finds the array index of a given user id
 * 
 * @param {number} authUserId 
 * @returns {number} index number that corresponds to user id
 */
function findUserIndex(authUserId) {
    let data = getData();
    for (const i in data.users) {
        if (data.users[i].authUserId === authUserId) {
            return i;
        }
    }
    return -1;
}

/**
 * Helper function for adminQuizCreate to check if a quiz name is valid
 * 
 * @param {number} authUserId id of the user
 * @param {String} name name of the quiz
 * @returns {Boolean} whether the name is valid
 */
function checkNameValidity(name, authUserId) {
    // length must be between 3 and 30 characters
    if (name.length < 3 || name.length > 30) {
        return false;
    }
    // only alpha-numeric characters
    for (let i = 0; i < name.length; i++) {
        let char = name.charCodeAt(i);
        if ((char < 48) || (char > 57 && char < 65) || (char > 90 && char < 97) || (char > 122))
        {
            return false;
        }
    }
    // name cannot be already used by user for another quiz
    const quizzes = getData().quizzes;
    for (const quiz of quizzes) {
        if (quiz.creator === authUserId && quiz.name === name) {
            return false;
        }
    }

    return true;
}



/**
 * Helper function to determine if the quizId exist
 * 
 * @param {number} quizId 
 * @returns {boolean} - returns true if does exist
 * @returns {boolean} - returns false if it dosn't exist 
 */
function isValidQuizId(quizId) {
    if(isNaN(quizId)) {
        return false;
    };

    let data = getData();
    for (const current of data.quizzes) {
        if (current.quizId  === quizId) {
            return true;
        }
    };
    
    return false;
}



/**
 * Helper function to determine if Quiz ID does not refer to a quiz that this user owns
 * 
 * @param {number} quizId 
 * @param {number} authUserID 
 * @returns {boolean} - returns true if user does own quiz
 * @returns {boolean} - returns false if user does not own quiz
 */
function isValidCreator(quizId, authUserID) {
    let data = getData();
    for (const current of data.quizzes) {
        if (current.quizId  === quizId) {
            if (current.creator  === authUserID) {
                return true;
            }
        }
    };
    
    return false;
}




/**
 * Helper function for adminQuizCreate to check if a quiz name is valid
 * 
 * @param {number} authUserId id of the user
 * @param {String} name name of the quiz
 * @returns {Boolean} whether the name is valid
 */
function checkNameValidity(name, authUserId) {
    // length must be between 3 and 30 characters
    if (name.length < 3 || name.length > 30) {
        return false;
    }
    // only alpha-numeric characters
    const alphaNumeric = /^[a-zA-Z0-9]*$/;
    if (!alphaNumeric.test(name)) {
        return false;
    }

    // name cannot be already used by user for another quiz
    const quizzes = getData().quizzes;
    for (const quiz of quizzes) {
        if (quiz.creator === authUserId && quiz.name === name) {
            return false;
        }
    }

    return true;
}

