import {adminQuizCreate, adminQuizInfo} from '../quiz.js';
import {adminAuthRegister} from '../auth.js';
import {clear} from '../other.js';


const ERROR = { error: expect.any(String) };
let user;
beforeEach(() => {
    clear();
    user = adminAuthRegister('email@gmail.com', 'password1', 'first', 'last');
});
  
describe('invalid name edge cases', () => {
    test.each([
        { name: 'test1;' }, // not alpha-numeric
        { name: 'user\'s test' }, // not alpha-numeric
        { name: 'test quiz' }, // spaces
        { name: 'Q1' }, // <3 chars
        { name: '0123456789012345678901234567890' }, // >30 chars
        ])("invalid quiz name: '$name'", ({ name }) => {
        expect(adminQuizCreate(user.authUserId, name, '')).toStrictEqual(ERROR);
    });

    test('name already used by user for another quiz', () => {
        adminQuizCreate(user.authUserId, 'TestQuiz', '')
        expect(adminQuizCreate(user.authUserId, 'TestQuiz', '')).toStrictEqual(ERROR);
    });
});

// authUserId not valid user error
test('authUserId not valid user', () => {
    expect(adminQuizCreate(user.authUserId + 1, 'TestQuiz', '')).toStrictEqual(ERROR);
});

// description more than 100 character error
test('invalid description (>100 characters)', () => {
    expect(adminQuizCreate
        (
            user.authUserId, 
            'TestQuiz', 
            // string of length 101
            '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
        )).toStrictEqual(ERROR);
});


describe('valid input tests', () => {
    // test adminQuizCreate correct output
    test('valid input - testing quizId creation', () => {
        expect(adminQuizCreate(user.authUserId, 'TestQuiz', 'Test')).toStrictEqual(
            {quizId: expect.any(Number)});
    });

    // NOTE: Relies on adminQuizInfo, so will skip for now.
    // test that the quiz is correctly added to the array of quizzes
    test.skip('testing correct quiz object creation', () => {
        const quiz = adminQuizCreate(user.authUserId, 'TestQuiz', 'Test');     
        expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(
            {
                quizId: quiz.quizId,
                name: 'TestQuiz',
                timeCreated: expect.any(Number),
                timeLastEdited: expect.any(Number),
                description: 'Test',
            }
        );
    });

});