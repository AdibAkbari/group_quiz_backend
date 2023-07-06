
import { 
    clearRequest, 
    authRegisterRequest, 
    quizNameUpdateRequest, 
    quizInfoRequest, 
    quizRemoveRequest, 
    quizCreateRequest,
} from './testRoutes';

const ERROR = { error: expect.any(String) };

interface Token {
  token: string
}

interface QuizCreate {
  quizId: number
}

let user: Token;
let quiz: QuizCreate;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname').body;
  quiz = quizCreateRequest(user.token, 'Cats', 'A quiz about cats').body;
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
    const quizInfo = quizInfoRequest(token, quiz.quizId);
    expect(quizInfo.body).toStrictEqual(ERROR);
    expect(quizInfo.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const quizInfo = quizInfoRequest("7", quiz.quizId);
    expect(quizInfo.body).toStrictEqual(ERROR);
    expect(quizInfo.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const quizInfo = quizInfoRequest(user.token + 1, quiz.quizId);
    expect(quizInfo.body).toStrictEqual(ERROR);
    expect(quizInfo.statusCode).toStrictEqual(403);
  });

});

describe('Quiz Id invalid', () => {
  test('Quiz Id does not refer to a valid quiz', () => {
    const quizInfo = quizInfoRequest(user.token, quiz.quizId + 1);
    expect(quizInfo.body).toStrictEqual(ERROR);
    expect(quizInfo.statusCode).toStrictEqual(400);
  });

  test('Quiz Id does not refer to a quiz that this user owns', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
    const quizInfo = quizInfoRequest(user2.token, quiz.quizId);
    expect(quizInfo.body).toStrictEqual(ERROR);
    expect(quizInfo.statusCode).toStrictEqual(400);

    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs').body;
    const quizInfo2 = quizInfoRequest(user.token, quiz2.quizId);
    expect(quizInfo2.body).toStrictEqual(ERROR);
    expect(quizInfo2.statusCode).toStrictEqual(400);
  });
});

describe('Valid inputs', () => {
  test('only one quiz created', () => {
    const quizInfo = quizInfoRequest(user.token, quiz.quizId);
    expect(quizInfo.body).toStrictEqual({
        quizId: quiz.quizId,
        name: 'Cats',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about cats',
    });
    expect(quizInfo.statusCode).toStrictEqual(200);
  });

  test('more than one quiz stored', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
    const quiz2 = quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs').body;

    const quizInfo = quizInfoRequest(user2.token, quiz2.quizId);
    expect(quizInfo.body).toStrictEqual({
        quizId: quiz2.quizId,
        name: 'Dogs',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about dogs',
    });
    expect(quizInfo.statusCode).toStrictEqual(200);
  });

  test('more than one quiz created by user', () => {
    const user2 = authRegisterRequest('email2@gmail.com', 'password1', 'FirstnameB', 'LastnameB').body;
    quizCreateRequest(user2.token, 'Dogs', 'A quiz about dogs');
    const quiz3 = quizCreateRequest(user.token, 'Birds', 'A quiz about birds').body;
    const quizInfo = quizInfoRequest(user.token, quiz3.quizId);
    expect(quizInfo.body).toStrictEqual({
        quizId: quiz3.quizId,
        name: 'Birds',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about birds',
    });
    expect(quizInfo.statusCode).toStrictEqual(200);
  });
});

describe('testing with other functions', () => {
  test('removing quiz', () => {
    const quizInfo = quizInfoRequest(user.token, quiz.quizId);
    expect(quizInfo.body).toStrictEqual({
        quizId: quiz.quizId,
        name: 'Cats',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about cats',
    });
    expect(quizInfo.statusCode).toStrictEqual(200);

    quizRemoveRequest(user.token, quiz.quizId);
    const quizInfo2 = quizInfoRequest(user.token, quiz.quizId);
    expect(quizInfo2.body).toStrictEqual(ERROR);
    expect(quizInfo2.statusCode).toStrictEqual(400);
  });

  test('name update', () => {
    const quizInfo = quizInfoRequest(user.token, quiz.quizId);
    expect(quizInfo.body).toStrictEqual({
        quizId: quiz.quizId,
        name: 'Cats',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about cats',
    });
    expect(quizInfo.statusCode).toStrictEqual(200);

    quizNameUpdateRequest(user.token, quiz.quizId, 'NewName');
    const quizInfo2 = quizInfoRequest(user.token, quiz.quizId);
    expect(quizInfo2.body).toStrictEqual({
        quizId: quiz.quizId,
        name: 'NewName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'A quiz about cats',
    });
    expect(quizInfo2.statusCode).toStrictEqual(200);
  });

//   test('description update', () => {
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
//       quizId: quiz.quizId,
//       name: 'Cats',
//       timeCreated: expect.any(Number),
//       timeLastEdited: expect.any(Number),
//       description: 'A quiz about cats',
//     });

//     adminQuizDescriptionUpdate(user.authUserId, quiz.quizId, 'New description');
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual({
//       quizId: quiz.quizId,
//       name: 'Cats',
//       timeCreated: expect.any(Number),
//       timeLastEdited: expect.any(Number),
//       description: 'New description',
//     });
//   });
});
