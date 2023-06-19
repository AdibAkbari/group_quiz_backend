
/** 
 * Provide a list of all quizzes that are owned by the currently logged in user.
 * 
 * @param {number} authUserId - passes through authUserId
 * @returns {quizzes: [{quizId: number, name: string,}]} - returns an object
 */
function adminQuizList (authUserId) {
    return {
        quizzes:
        [
            {
                quizId: 1,
                name: 'My Quiz',
            }
        ]
    }
}

/**
 * Given basic details about a new quiz, create one for the logged in user.
 * 
 * @param {number} authUserId - passes through authUserId
 * @param {string} name - passes through the name of the user
 * @param {string} description - passes through the description
 * @returns {quizId: 2} - returns quizId: 2
 */
function adminQuizCreate(authUserId, name, description) {
    return {
        quizId: 2
    }
}

/**
 * Given a particular quiz, permanently remove the quiz.
 * 
 * @param {number} authUserId - passes through authUserId
 * @param {number} quizId - passes through the quizId of the quiz to remove
 * @returns { } - empty object
 */
function adminQuizRemove(authUserId, quizId) {
    return { }
}

/**
 * Get all of the relevant information about the current quiz.
 * 
 * @param {number} authUserId - passes through the authUserId
 * @param {number} quizId - passes through the quizId 
 * @returns {
 *           quizId: 1,
 *           name: 'My Quiz',
 *           timeCreated: 1683125870,
 *           timeLastEdited: 1683125871,
 *           description: 'This is my quiz',
 *          } - returns Quiz info 
 */
function adminQuizInfo(authUserId, quizId) {
    return {
        quizId: 1,
        name: 'My Quiz',
        timeCreated: 1683125870,
        timeLastEdited: 1683125871,
        description: 'This is my quiz',
    }
}

/**
 * Update the name of the relevant quiz.
 * 
 * @param {number} authUserId - passes through authUserId
 * @param {number} quizId - passes through the quizId to update the name of
 * @param {string} name - passes through the name to update with
 * @returns { } - empty object
 */
export function adminQuizNameUpdate(authUserId, quizId, name) {
    // Check inputted UserId is valid
    if (isValidUserId(authUserId) === false) {
        return {error: 'Please enter a valid user'};
    }
    // Check inputted quizId is valid
    if (isValidQuizId(quizId) === false) {
        return {error: 'Please enter a valid quiz'};
    }
    // Check inputted Quiz ID does not refer to a quiz that this user owns
    if (isValidCreator(quizId, authUserId) === false) {
        return {error: 'You do not own this quiz'};
    }
    // Check inputted name is valid
    if (!checkNameValidity(name, authUserId)) {
        return {error: 'Name not valid'};
    }

    let data = getData();
    for (const current of data.quizzes) {
        if (current.quizId  === quizId) {
            let newName = current;
            newName.name = name;
            newName.timeLastEdited = date.getTime();
            
            setData(newName);
        }
    };

    return { }
}

/**
 * Update the description of the relevant quiz.
 * 
 * @param {number} authUserId - passes through authors user ID
 * @param {number} quizId - passes through the id number for the quiz
 * @param {string} description - passes through description of quiz
 * @returns {} - doesn't return anything
 */
function adminQuizDescriptionUpdate (authUserID, quizId, description) {
    
    return { }

}

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
    if(isNaN(quizId) || isNaN(authUserID)) {
        return false;
    };

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
 * Helper function to check if name is valid
 * 
 * @param {number} authUserId id of the user
 * @param {String} name name of the quiz
 * @returns {Boolean} whether the name is valid
 */
function isValidName(name, authUserId) {
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
