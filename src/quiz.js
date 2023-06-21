import { getData, setData } from "./dataStore.js";
import { checkNameValidity, isValidUserId, isValidCreator, isValidQuizId} from "./other.js";
 
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
    
    // create new quizId
    let id = getData().quizzes.length + 1;

    // create new Date object
    const timeNow = Math.floor((new Date()).getTime() / 1000);


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
    const timeNow = Math.floor((new Date()).getTime() / 1000);
    for (const current of data.quizzes) {
        if (current.quizId  === quizId) {
            current.name = name;
            current.timeLastEdited = timeNow;
            setData(data);
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
