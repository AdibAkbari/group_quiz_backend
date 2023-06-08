/**
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