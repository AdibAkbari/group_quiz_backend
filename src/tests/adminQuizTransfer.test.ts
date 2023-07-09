import {
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  quizTransferRequest,
  // QuizInfoRequest,
} from './testRoutes';

const ERROR = { error: expect.any(String) };

interface Token {
  token: string
}

interface QuizCreate {
  quizId: number
}
// Before each test, clear data and then create a new user and new quiz
let user: Token;
let user2: Token;
let quiz: QuizCreate;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '').body;
  user2 = authRegisterRequest('email2@gmail.com', 'password2', 'firsttwo', 'lasttwo').body;
});




// token not valid
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
    const transfer = quizTransferRequest(token, quiz.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const transfer = quizTransferRequest('7', quiz.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const transfer = quizTransferRequest(user.token + 1, quiz.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(403);
  });
});

// quizId wrong
describe('invalid quizId', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    const transfer = quizTransferRequest(user.token, quiz.quizId + 1, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(400);
  });

  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const transfer = quizTransferRequest(user.token, quiz2.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(400);
  });

  // Quiz ID refers to a quiz that has a name that is already used by the target user
  test('User already has a quiz named', () => {
    const quiz2 = quizCreateRequest(user.token, 'quiz1', '').body;

    const transfer = quizTransferRequest(user.token, quiz2.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(400);
  });

});


// userEmail wrong
describe('invalid userEmail', () => {
  test('userEmail is not a real user', () => {
    const transfer = quizTransferRequest(user.token, quiz.quizId, 'fakeemail@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(400);
  });

  test('userEmail is the current logged in user', () => {
    const transfer = quizTransferRequest(user.token, quiz.quizId, 'email@gmail.com');
    expect(transfer.body).toStrictEqual(ERROR);
    expect(transfer.statusCode).toStrictEqual(400);
  });

});

// Success cases 
describe('Successful quiz transfer', () => {
  test('Successful transfer quiz empty object response', () => {
    const transfer = quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com');
    expect(transfer.body).toStrictEqual({});
    expect(transfer.statusCode).toStrictEqual(200);
  });


//   test('Successful transfer quiz integrated test', () => {
//     const transfer = quizTransferRequest(user.token, quiz.quizId, 'email2@gmail.com');
//     expect(transfer.body).toStrictEqual({});
//     expect(transfer.statusCode).toStrictEqual(200);

//     expect(adminQuizListRequest(user2.token).body).toStrictEqual({
//       quizzes: [
//         {
//           quizId: quiz.quizId,
//           name: 'quiz1'
//         }
//       ]
//     });

//     expect(adminQuizListRequest(user.token).body).toStrictEqual({
//       quizzes: []
//     });
//   });

});
