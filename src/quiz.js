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
