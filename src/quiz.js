/**
 * Helper function to determine if the authUserId exist
 * 
 * @param {number} authUserId 
 * @returns {boolean} - returns true if does exist
 * @returns {boolean} - returns false if it dosn't exist 
 */
function checkUserId(authUserId) {
    for (const user of getData().users) {
        if (user.authUserId === authUserId) {
            return true;
        }
      }
    
    return false;
}

/**
 * Helper function to determine if the quizId exist
 * 
 * @param {number} quizId 
 * @returns {boolean} - returns true if does exist
 * @returns {boolean} - returns false if it dosn't exist 
 */
function checkQuizId(quizId) {
    for (const quiz of getData().quizzes) {
        if (quiz.quizId  === quizId) {
            return true;
        }
      }
    
    return false;
}

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
export function adminQuizRemove(authUserId, quizId) {
    
    if (checkUserId(authUserId) === false) {
        return {error: 'AuthUserId is not a valid user'};
    }

    if (checkQuizId(quizId) === false) {
        return {error: 'Quiz ID does not refer to valid quiz'};
    }

    
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
function adminQuizNameUpdate(authUserId, quizId, name) {
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
