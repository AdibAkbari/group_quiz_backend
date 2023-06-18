import { getData, setData } from "./dataStore.js";

 
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
export function adminQuizCreate(authUserId, name, description) {
    if (!checkNameValidity(name, authUserId)) {
        return {error: 'name not valid'};
    }
    
    // invalid description
    if (description.length > 100) {
        return {error: 'description too long'};
    }

    // invalid authUserId
    let userIdValid = false;
    for (const user of getData().users) {
        if (user.authUserId === authUserId) {
            userIdValid = true;
        }
      }
      if (userIdValid === false) {
        return {error: 'authUserId does not refer to valid user'};
      }
    
    // create new quizId
    let id = getData().quizzes.length + 1;

    // create new Date object
    const date = new Date();

    // get and set data to add quiz object to quizzes array
    let data = getData();
    data.quizzes.push(
      {
        name: name,
        description: description,
        quizId: id,
        creator: authUserId,
        questions: [],
        players: [],
        timeCreated: date.getTime(),
        timeLastEdited: date.getTime(),
      }
    );
    setData(data);
  
    return {
      quizId: id,
    };
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
