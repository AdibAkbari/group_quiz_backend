import {adminQuizCreate, adminQuizInfo, adminQuizDescriptionUpdate} from '../quiz.js';
import {adminAuthRegister} from '../auth.js';
import {clear} from '../other.js';

const ERROR = { error: expect.any(String) };
let user;
let quiz;
beforeEach(() => {
    clear();
    user = adminAuthRegister('email@gmail.com', 'password1', 'first', 'last');
    quiz = adminQuizCreate(user.authUserId, 'My Quiz', 'First Description');
});

describe('invalid edge cases', () => {
    test('authUserId not valid user', () => {
        expect(adminQuizDescriptionUpdate(user.authUserId + 1, quiz.quizId, 'New Description')).toStrictEqual(ERROR);
    });

    test('quizId not valid', () => {
        expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId + 1, 'New Description')).toStrictEqual(ERROR);
    });

    test('user does not own quiz', () => {
        let user2 = adminAuthRegister ('email2@gmail.com', 'password1', 'first', 'last');
        let quiz2 = adminQuizCreate(user2.authUserId, 'user2 quiz', '');
        expect(adminQuizDescriptionUpdate(user.authUserId, quiz2.quizId, 'New Description')). toStrictEqual(ERROR);
    });

    test('description too long', () => {
        expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 
            '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
        )).toStrictEqual(ERROR);
        expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 
            '                                                                                                       '
        )).toStrictEqual(ERROR);
    });
});

describe('valid input', () => {
    test('valid input', () => {
        expect(adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'New Description')).toStrictEqual({ });
    });

    test('testing correct quiz description change', () => {     
        adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'New Description');    
        expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(
            {
                quizId: quiz.quizId,
                name: 'My Quiz',
                timeCreated: expect.any(Number),
                timeLastEdited: expect.any(Number),
                description: 'New Description',
            }
        );
    });
        

});
