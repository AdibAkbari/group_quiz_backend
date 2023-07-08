import { adminQuizInfo } from '../quiz';
import {
    quizCreateRequest,
    authRegisterRequest,
    clearRequest,
    createQuizQuestionRequest,
    updateQuizQuestionRequest
  //  deleteQuizQuestionRequest,
  //  adminQuizInfoRequest
  } from './testRoutes';

interface Token {
    token: string
}

const validAnswers = [{ answer: 'great', correct: true }, { answer: 'bad', correct: false }];

const ERROR = { error: expect.any(String) };

let user: Token;
let quizId: number;
let questionId: number;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quizId = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').body.quizId;
  questionId = createQuizQuestionRequest(quizId, user.token, 'Question 1?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
});

describe('Invalid params', () => {
    test('QuizId does not refer to a valid quiz', () => {
      const result = updateQuizQuestionRequest(quizId + 1, questionId, user.token, 'How are you?', 5, 5, validAnswers);
      expect(result.body).toStrictEqual(ERROR);
      expect(result.statusCode).toStrictEqual(400);
    });
  
    test('QuizId does not refer to a quiz that this user owns', () => {
       const user2 = authRegisterRequest('email1@gmail.com', 'password2', 'FirstnameB', 'LastnameB').body;
       const result = updateQuizQuestionRequest(quizId, questionId, user2.token, 'How are you?', 5, 5, validAnswers);
       expect(result.body).toStrictEqual(ERROR);
       expect(result.statusCode).toStrictEqual(400);
    });

    test('No questions in any quiz with this questionId', () => {
        const result = updateQuizQuestionRequest(quizId, questionId + 1, user.token, 'How are you?', 5, 5, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(400);
    });

    test('No questions in this quiz with this questionId', () => {
        const quiz2Id = quizCreateRequest(user.token, 'Quiz2', '').body.quizId;  
        const result = updateQuizQuestionRequest(quiz2Id, questionId, user.token, 'How are you?', 5, 5, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(400);
    });

    test.todo('question with given questionId has been removed');
    // test('question with given questionId has been removed', () => {
    //     deleteQuizQuestionRequest(quizId, questionId, user.token);
    //     const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, validAnswers);          
    //     expect(result.body).toStrictEqual(ERROR);
    //     expect(result.statusCode).toStrictEqual(400);
    // });
});


 describe('invalid question body - question, duration, points', () => { 
    test.each([
      { testname: 'Question string <5 characters', question: 'abcd' },
      { testname: 'Question string >50 characters', question: 'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyz' },
      { testname: 'Question string empty', question: '' },
      { testname: 'Question string just whitespace', question: '       ' },
    ])('Incorrect question string: $testName', ({ question }) => {
        const result = updateQuizQuestionRequest(quizId, questionId, user.token, question, 5, 5, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(400);
    });
  
    test.each([
      { testname: 'Question duration negative', duration: -2, points: 5 },
      { testname: 'Question duration 0', duration: 0, points: 5 },
      { testname: 'Question duration >3 minutes', duration: 200, points: 5 },
      { testname: 'Question points negative', duration: 5, points: -5 },
      { testname: 'Question points 0', duration: 5, points: 0 },
      { testname: 'Question points >10', duration: 5, points: 15 },
    ])('Invalid question points or duration: $testName', ({ duration, points }) => {
        const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', duration, points, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(400);
    });
  
    test('if this quiz were to be updated, sum of question durations exceed 3 minutes', () => {
      createQuizQuestionRequest(quizId, user.token, 'Question 2', 50, 5, validAnswers);
      createQuizQuestionRequest(quizId, user.token, 'Question 3', 50, 5, validAnswers);
      createQuizQuestionRequest(quizId, user.token, 'Question 4', 50, 5, validAnswers);
      const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 40, 5, validAnswers);
      expect(result.body).toStrictEqual(ERROR);
      expect(result.statusCode).toStrictEqual(400);
    });
  });

  describe('invalid question body - answers', () => {
    test.each([
        {
          testname: '>6 answers',
          answers: [
            { answer: 'ans1', correct: true },
            { answer: 'ans2', correct: false },
            { answer: 'ans3', correct: false },
            { answer: 'ans4', correct: false },
            { answer: 'ans5', correct: false },
            { answer: 'ans6', correct: false },
            { answer: 'ans7', correct: false }
          ]
        },
        {
          testname: '<2 answers',
          answers: [
            { answer: 'great', correct: true },
          ]
        },
        {
          testname: 'no answers',
          answers: []
        },
        {
          testname: 'length of an answer <1 character long',
          answers: [
            { answer: 'great', correct: true },
            { answer: 'bad', correct: false },
            { answer: '', correct: false }
          ]
        },
        {
          testname: 'length of an answer >30 character long',
          answers: [
            { answer: 'great', correct: true },
            { answer: 'abcdefghijklmnopqrstuvwxyzabcdefghij', correct: false },
            { answer: 'bad', correct: false }
          ]
        },
        {
          testname: 'answer strings duplicate of one another, both false',
          answers: [
            { answer: 'great', correct: true },
            { answer: 'bad', correct: false },
            { answer: 'bad', correct: false }
          ]
        },
        {
          testname: 'answer strings duplicate of one another, one false one true',
          answers: [
            { answer: 'great', correct: false },
            { answer: 'bad', correct: true },
            { answer: 'bad', correct: false }
          ]
        },
        {
          testname: 'no correct answers',
          answers: [
            { answer: 'great', correct: false },
            { answer: 'bad', correct: false }
          ]
        },
      ])('invalid answers: $testname', ({ answers }) => {
        const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'How are you?', 5, 5, answers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(400);
      });
  });

  describe('Token invalid', () => {
    test.each([
      { testName: 'token just letters', token: 'hello' },
      { testName: 'token starts with letters', token: 'a54364' },
      { testName: 'token ends with letters', token: '54356s' },
      { testName: 'token includes letter', token: '5436h86' },
      { testName: 'token has space', token: '4324 757' },
      { testName: 'token only whitespace', token: '  ' },
      { testName: 'token has other characters', token: '6365,53' },
      { testName: 'empty string', token: '' },
      { testName: 'token has decimal point', token: '53.74' },
      { testName: 'token has negative sign', token: '-37294' },
      { testName: 'token has positive sign', token: '+38594' },
    ])('token is not a valid structure: $testName', ({ token }) => {
        const result = updateQuizQuestionRequest(quizId, questionId, token, 'How are you?', 5, 5, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(401);
    });
  
    test('Unused tokenId', () => {
        const result = updateQuizQuestionRequest(quizId, questionId, user.token + 1, 'How are you?', 5, 5, validAnswers);
        expect(result.body).toStrictEqual(ERROR);
        expect(result.statusCode).toStrictEqual(403);
    });
  });

  describe('valid input', () => {
    test('correct return type and status code', () => {
        const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers);
        expect(result.body).toStrictEqual({});
        expect(result.statusCode).toStrictEqual(200);
    });

    test.todo('quiz with one question successfully updated')
    // test('quiz with one question successfully updated', () => {
    //     updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers);
    //     expect(adminQuizInfoRequest(quizId, user.token).body).toStrictEqual({
    //         quizId: quizId,
    //         name: 'Cats',
    //         timeCreated: expect.any(Number),
    //         timeLastEdited: expect.any(Number),
    //         description: 'A quiz about cats',
    //         numQuestions: 1,
    //         questions: [
    //             {
    //                 questionId: questionId,
    //                 question: "New Question",
    //                 duration: 5,
    //                 points: 4,
    //                 answers: [
    //                     {answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true},
    //                     {answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false},
    //                 ]
    //             }
    //         ]
    //     })
    // });

    // test('quiz with multiple questions successfully updated', () => {
    //     const q2Id = createQuizQuestionRequest(quizId, user.token, 'Question 2?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
    //     const q3Id = createQuizQuestionRequest(quizId, user.token, 'Question 3?', 6, 3, [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }]).body.questionId;
    //     updateQuizQuestionRequest(quizId, q2Id, user.token, 'New Question 2', 5, 4, validAnswers);

    //     const expected = {
    //         quizId: quizId,
    //         name: 'Cats',
    //         timeCreated: expect.any(Number),
    //         timeLastEdited: expect.any(Number),
    //         description: 'A quiz about cats',
    //         numQuestions: 3,
    //         questions: [
    //             {
    //                 questionId: questionId,
    //                 question: "Question 1?",
    //                 duration: 6,
    //                 points: 3,
    //                 answers: [
    //                     {answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true},
    //                     {answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false},
    //                 ]
    //             }, 
    //             {
    //                 questionId: q2Id,
    //                 question: "New Question 2",
    //                 duration: 5,
    //                 points: 4,
    //                 answers: [
    //                     {answerId: expect.any(Number), answer: 'great', colour: expect.any(String), correct: true},
    //                     {answerId: expect.any(Number), answer: 'bad', colour: expect.any(String), correct: false},
    //                 ]
    //             }, 
    //             {
    //                 questionId: q3Id,
    //                 question: "Question 3?",
    //                 duration: 6,
    //                 points: 3,
    //                 answers: [
    //                     {answerId: expect.any(Number), answer: 'answer1', colour: expect.any(String), correct: true},
    //                     {answerId: expect.any(Number), answer: 'answer2', colour: expect.any(String), correct: false},
    //                 ]
    //             }, 
    //         ]
    //     };

    //     const received = adminQuizInfoRequest(quizId, user.token).body;
        
    //     const expectedQuestionsSet = new Set(expected.questions);
    //     const receivedQuestionsSet = new Set(received.questions);


    //     expect(receivedQuestionsSet).toStrictEqual(expectedQuestionsSet);
    //     expect(received.numQuestions).toStrictEqual(3);
    // })
        // test('timeLastEdited successfully updated', () => {
        //   updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question', 5, 4, validAnswers).body;
        //   const timeNow = Math.floor(Date.now() /1000);
        //   const result = adminQuizInfoRequest(quiz.quizId, user.token).body;
        //   expect(result.timeLastEdited).toBeGreaterThanOrEqual(timeNow);
        //   expect(result.timeLastEdited).toBeLessThanOrEqual(timeNow + 1);
        // });

        test('quiz duration only <3 minutes when old question duration no longer included', () => {
          const q2Id = createQuizQuestionRequest(quizId, user.token, 'Question 2', 50, 5, validAnswers).body.questionId;
          createQuizQuestionRequest(quizId, user.token, 'Question 3', 50, 5, validAnswers);
          createQuizQuestionRequest(quizId, user.token, 'Question 4', 50, 5, validAnswers);
          const result = updateQuizQuestionRequest(quizId, q2Id, user.token, 'How are you?', 55, 5, validAnswers);
          expect(result.body).toStrictEqual({});
          expect(result.statusCode).toStrictEqual(200);
        });

    });

    


  describe('valid edge cases', () => {
    test.each([
      { testname: 'question string length 5', question: 'abcde', duration: 5, points: 5 },
      { testname: 'question string length 50', question: 'qwertyuioplkjhgfdsazxcvbnmqwertyuioplkjhgfdsazxcvb', duration: 5, points: 5 },
      { testname: 'duration 3 minutes', question: 'valid question', duration: 180, points: 5 },
      { testname: 'points is 1', question: 'valid question', duration: 5, points: 1 },
      { testname: 'points is 10', question: 'valid question', duration: 5, points: 10 }
    ])('valid edge cases for question, duration and points: $testname', ({ question, duration, points }) => {
      const result = updateQuizQuestionRequest(quizId, questionId, user.token, question, duration, points, validAnswers);
      expect(result.body.questionId).toStrictEqual(expect.any(Number));
      expect(result.statusCode).toStrictEqual(200);
    });

    test('sum of new duration equals 3 minutes', () => {
      createQuizQuestionRequest(quizId, user.token, 'Question 1', 60, 5, validAnswers);
      createQuizQuestionRequest(quizId, user.token, 'Question 2', 60, 5, validAnswers);
      const result = updateQuizQuestionRequest(quizId, questionId, user.token, 'New Question 1', 60, 5, validAnswers);
      expect(result.body.questionId).toStrictEqual(expect.any(Number));
      expect(result.statusCode).toStrictEqual(200);
    });
  });
  