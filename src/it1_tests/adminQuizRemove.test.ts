import { 
    clearRequest, 
    authRegisterRequest, 
    //quizInfoRequest, 
    quizCreateRequest,
    quizRemoveRequest,
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
let quiz: QuizCreate;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '').body;
});

describe('Token invalid', () => {
  
  test.each([
    {testName: 'token just letters', token: 'hello'},
    {testName: 'token starts with letters', token: 'a54364'},
    {testName: 'token ends with letters', token: '54356s'},
    {testName: 'token includes letter', token: '5436h86'},
    {testName: 'token has space', token: '4324 757'},
    {testName: 'token only whitespace', token: '  '},
    {testName: 'token has other characters', token: '6365,53'},
    {testName: 'empty string', token: ''},
    {testName: 'token has decimal point', token: '53.74'},
    {testName: 'token has negative sign', token: '-37294'},
    {testName: 'token has positive sign', token: '+38594'},
  ])('token is not a valid structure: $testName', ({token}) => {
    const removeQuiz = quizRemoveRequest(token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const removeQuiz = quizRemoveRequest("7", quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const removeQuiz = quizRemoveRequest(user.token + 1, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(403);
  });

});

describe('Failed to remove', () => {
  // Testing quizID does not exist
  test('Quiz ID does not refer to a valid quiz', () => {
    const removeQuiz = quizRemoveRequest(user.token, quiz.quizId + 1);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(400);
  });


  // Testing the user does not own the quiz that is trying to be removed
  test('Quiz ID does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('user2@gmail.com', 'StrongPassword123', 'TestFirst', 'TestLast').body;
    const quiz2 = quizCreateRequest(user2.token, 'quiz2', '').body;

    const removeQuiz = quizRemoveRequest(user.token, quiz2.quizId);
    expect(removeQuiz.body).toStrictEqual(ERROR);
    expect(removeQuiz.statusCode).toStrictEqual(400);
  });

});

describe('Successfully removed quiz check', () => {
  // Sucessfully remove the quiz
  test('Sucessful quiz remove return', () => {
    const removeQuiz = quizRemoveRequest(user.token, quiz.quizId);
    expect(removeQuiz.body).toStrictEqual({});
    expect(removeQuiz.statusCode).toStrictEqual(200);
  });

  // Check that the quiz is actually removed
//   test('Sucessful quiz remove integrated check', () => {
//     const quiz2 = adminQuizCreate(user.authUserId, 'quiz2', '');
//     const quizToRemove = adminQuizCreate(user.authUserId, 'quizToRemove', '');
//     const quiz3 = adminQuizCreate(user.authUserId, 'quiz3', '');

//     adminQuizRemove(user.authUserId, quizToRemove.quizId);

//     const received = adminQuizList(user.authUserId);
//     const expected = {
//       quizzes: [
//         {
//           quizId: quiz.quizId,
//           name: 'quiz1',
//         },
//         {
//           quizId: quiz2.quizId,
//           name: 'quiz2',
//         },
//         {
//           quizId: quiz3.quizId,
//           name: 'quiz3',
//         },
//       ]
//     };

//     const receivedSet = new Set(received.quizzes);
//     const expectedSet = new Set(expected.quizzes);
//     expect(receivedSet).toStrictEqual(expectedSet);
//   });

  // check that once a quiz is removed, the quiz id no longer exists
//   test('No quiz Id once a quiz is removed', () => {
//     adminQuizRemove(user.authUserId, quiz.quizId);
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(ERROR);
//     adminQuizCreate(user.authUserId, 'quiz2', '');
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(ERROR);
//   });

  // check that once a quiz is removed, the next quiz still has a unique quiz id
  test('Unique quiz Id once a quiz is removed', () => {
    const quizToRemove = quizCreateRequest(user.token, 'quizToRemove', '').body;
    const quiz2 = quizCreateRequest(user.token, 'quiz2', '').body;
    quizRemoveRequest(user.token, quizToRemove.quizId);
    const quiz3 = quizCreateRequest(user.token, 'quiz3', '').body;
    
    
    expect(quiz3.quizId).not.toStrictEqual(quiz.quizId);
    expect(quiz3.quizId).not.toStrictEqual(quiz2.quizId);
  });
});
