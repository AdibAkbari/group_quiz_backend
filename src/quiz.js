import { getData, setData } from "./dataStore.js";
import { checkNameValidity, isValidUserId, isValidQuizId, isValidCreator} from "./other.js";

 
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
export function adminQuizRemove(authUserId, quizId) {
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
export function adminQuizInfo(authUserId, quizId) {
    
    if (!isValidUserId(authUserId)) {
        return {error: 'authUserId does not refer to valid user'};
    }

    if (!isValidQuizId(quizId)) {
        return {error: 'quizId does not refer to valid quiz'};
    }

    if (!isValidCreator(quizId, authUserId)) {
        return {error: 'quizId does not refer to quiz that this user owns'};
    }

    let data = getData();
    for (const quiz of data.quizzes) {
        if(quiz.quizId === quizId) {
            return {
                quizId: quiz.quizId,
                name: quiz.name,
                timeCreated: quiz.timeCreated,
                timeLastEdited: quiz.timeLastEdited,
                description: quiz.description,
            }
        }
    };
    
    return {
        error: 'Quiz could not be found'
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
export function adminQuizDescriptionUpdate (authUserID, quizId, description) {
    if (!isValidUserId(authUserID)) {
        return { error: 'authUserId does not refer to valid user'};
    };

    if (!isValidQuizId(quizId)) {
        return { error: 'quizId does not refer to valid quiz'};
    };

    if (!isValidCreator(quizId, authUserID)) {
        return { error: 'quizId does not refer to a quiz that this user owns'};
    };

    if (description.length > 100) {
        return {error: 'description must be less than 100 characters'};
    }

    let store = getData();
    const quizIndex = store.quizzes.findIndex(id => id.quizId === quizId);
    const timeNow = Math.floor((new Date()).getTime() / 1000);
    store.quizzes[quizIndex].description = description;
    store.quizzes[quizIndex].timeLastEdited = timeNow;
    setData(store);

    return { };
}

