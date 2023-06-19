import { adminQuizRemove, adminQuizCreate } from '../quiz.js';
import { adminAuthRegister } from '../auth.js';
import { clear } from '../other.js';


const ERROR = { error: expect.any(String) };

beforeEach(() => {
    clear();
});

describe('adminQuizRemove', () => {
    
    let user;
    let quiz;
    // Before each test, clear data and then create a new user and new quiz 
    beforeEach(() => {
        user = adminAuthRegister('user1@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');
        quiz = adminQuizCreate(user.authUserId, 'quiz1', '' );
    });
    
    // Testing AuthUserId does not exist 
    test('AuthUserId is not a valid user', () => {
        expect(adminQuizRemove(user.authUserId + 1, quiz.quizId)).toStrictEqual(ERROR);
    });

    // Testing quizID does not exist 
    test('Quiz ID does not refer to a valid quiz', () => {
        expect(adminQuizRemove(user.authUserId, quiz.quizId + 1)).toStrictEqual(ERROR);
    });

    // Testing the user does not own the quiz that is trying to be removed 
    test('Quiz ID does not refer to a quiz that this user owns', () => {
        let user2 = adminAuthRegister('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast');;
        let quiz2 = adminQuizCreate(user2.authUserId, 'quiz2', '' );
        
        expect(adminQuizRemove(user.authUserId, quiz2.quizId)).toStrictEqual(ERROR);
    });
    
    // Sucessfully remove the quiz 
    test('Sucessful quiz remove', () => {
        expect(adminQuizRemove(user.authUserId, quiz.quizId)).toStrictEqual({});
    });
})