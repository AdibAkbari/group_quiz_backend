/**
 * Provide a list of all quizzes that are owned by the currently logged in user.
 * @param = {number} authUserId
 * @returns = {quizzes: [{quizId: number, name: string,}]} object
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
