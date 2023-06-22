import { getData, setData } from "./dataStore.js";
import { checkNameValidity, isValidUserId} from "./other.js";

 
/** 
 * Provide a list of all quizzes that are owned by the currently logged in user.
 * 
 * @param {number} authUserId - passes through authUserId
 * @returns {quizzes: [{quizId: number, name: string,}]} - returns an object
 */
export function adminQuizList (authUserId) {
    let data = getData();
    
    if (!isValidUserId(authUserId)) {
        return {
            error: 'AuthUserId is not a valid user'
        }
    };

    let quizzes = [];

    for (const quiz of data.quizzes) {
        if (quiz.creator === authUserId) {
            let quizId = quiz.quizId;
            let name = quiz.name;
            quizzes.push({quizId, name});
        }
    };
    
    return {
        quizzes: quizzes
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
    // invalid authUserId
    if (!isValidUserId(authUserId)) {
        return {error: 'authUserId does not refer to valid user'};
    }

    if (!checkNameValidity(name, authUserId)) {
        return {error: 'name not valid'};
    }
    
    // invalid description
    if (description.length > 100) {
        return {error: 'description too long'};
    }
    
    // get time in seconds
    const timeNow = Math.floor((new Date()).getTime() / 1000);

    // get and set data to add quiz object to quizzes array
    let data = getData();
    data.quizCount++; // increment quizCount by 1
    let id = data.quizCount;
    data.quizzes.push(
      {
        name: name,
        description: description,
        quizId: id,
        creator: authUserId,
        questions: [],
        players: [],
        timeCreated: timeNow,
        timeLastEdited: timeNow,
      }
    );
    setData(data);
  
    return {
      quizId: id,
    };
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

