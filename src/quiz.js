import { getData, setData } from "./dataStore.js";
import { checkNameValidity, isValidCreator, isValidQuizId, isValidUserId, isWhiteSpace} from "./other.js";
 
/** 
 * Provide a list of all quizzes that are owned by the currently logged in user.
 * 
 * @param {number} authUserId
 * @returns {{quizzes: Array<{
 *                  quizId: number, 
 *                  name: string
 *              }>
 *          }}
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
 * Given basic details about a new quiz, create one for the user.
 * 
 * @param {number} authUserId
 * @param {string} name
 * @param {string} description
 * @returns {{quizId: number}} quizId
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
 * Given a particular quizId, permanently remove the quiz.
 * 
 * @param {number} authUserId
 * @param {number} quizId
 * @returns {{ }} empty object
 */
export function adminQuizRemove(authUserId, quizId) {
    
    if (isValidUserId(authUserId) === false) {
        return {error: 'AuthUserId is not a valid user'};
    }

    if (isValidQuizId(quizId) === false) {
        return {error: 'Quiz ID does not refer to valid quiz'};
    }

    if (isValidCreator(quizId, authUserId) === false) {
        return {error: 'Quiz ID does not refer to a quiz that this user owns'};
    }

    let data = getData();
    for (const i in data.quizzes) {
        if (data.quizzes[i].quizId  === quizId) {
            data.quizzes.splice(i, 1);
            setData(data);
        }
    };
    
    return { };
}

/**
 * Get all of the relevant information about the current quiz.
 * 
 * @param {number} authUserId
 * @param {number} quizId
 * @returns {{
 *           quizId: number,
 *           name: string,
 *           timeCreated: number,
 *           timeLastEdited: number,
 *           description: string,
 *          }} 
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
 * Update the name of the relevant quiz given the authUserId
 * of the owner of the quiz, the quizId of the quiz to change and the
 * new name.
 * 
 * @param {number} authUserId
 * @param {number} quizId
 * @param {string} name
 * @returns {{ }} empty object
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
    // Check name isn't just whitespace
    if (isWhiteSpace(name)) {
        return { error: 'Quiz name cannot be solely white space' };
    };

    let data = getData();
    const timeNow = Math.floor((new Date()).getTime() / 1000);
    for (const current of data.quizzes) {
        if (current.quizId === quizId) {
            current.name = name;
            current.timeLastEdited = timeNow;
            setData(data);
        }
    };

    return { }
}

/**
 * Update the description of the relevant quiz given the authUserId
 * of the owner of the quiz, the quizId of the quiz to change and the
 * new description.
 * 
 * @param {number} authUserId
 * @param {number} quizId
 * @param {string} description
 * @returns {{ }}
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



