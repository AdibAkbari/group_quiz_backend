import {
  authRegisterRequest,
  updateQuizThumbnailRequest,
  clearRequest,
  quizCreateRequest,
  adminQuizInfoRequest,
} from './it3_testRoutes';
import { TokenId, QuizId } from '../interfaces';
import HTTPError from 'http-errors';

// Before each test, clear data and then create a new user and new quiz
let user: TokenId;
let quiz: QuizId;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body;
  quiz = quizCreateRequest(user.token, 'quiz1', '');
});

describe('Token invalid', () => {
  test.each([
    { testName: 'token just letters', token: 'hello' },
    { testName: 'token includes letter', token: '5436h86' },
    { testName: 'token has space', token: '4324 757' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    expect(() => updateQuizThumbnailRequest(quiz.quizId, token, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => updateQuizThumbnailRequest(quiz.quizId, '712345', 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[403]);
  });
});

describe('error cases', () => {
  test('QuizId does not refer to valid quiz', () => {
    expect(() => updateQuizThumbnailRequest(quiz.quizId + 1, user.token, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('QuidId does not refer to a quiz that the user owns', () => {
    const user2: TokenId = authRegisterRequest('email123@gmail.com', 'password1', 'first', 'last').body;
    expect(() => updateQuizThumbnailRequest(quiz.quizId, user2.token, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg')).toThrow(HTTPError[400]);
  });

  test('imgUrl does not return valid file', () => {
    expect(() => updateQuizThumbnailRequest(quiz.quizId, user.token, 'https://www.dcnewsnow.com/wp-content/uploads/sites/14/2022/07123/Cat.jpg')).toThrow(HTTPError[400]);
  });

  test('imgUrl is not a jpg or png image', () => {
    expect(() => updateQuizThumbnailRequest(quiz.quizId, user.token, 'https://i0.wp.com/www.printmag.com/wp-content/uploads/2021/02/4cbe8d_f1ed2800a49649848102c68fc5a66e53mv2.gif')).toThrow(HTTPError[400]);
  });
});

describe('valid cases', () => {
  test.each([
    { testName: 'cat jpg', imgUrl: 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg' },
    { testName: 'png', imgUrl: 'https://i.pinimg.com/originals/27/0b/0f/270b0f1048a84d149674ca5b803aebe0.png' },
  ])('imgUrl is valid: $testName', ({ imgUrl }) => {
    expect(updateQuizThumbnailRequest(quiz.quizId, user.token, imgUrl)).toStrictEqual({});
  });

  test('correct response with quizinfo', () => {
    updateQuizThumbnailRequest(quiz.quizId, user.token, 'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    expect(adminQuizInfoRequest(user.token, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'quiz1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: '',
      numQuestions: 0,
      questions: [],
      duration: 0,
      thumbnailUrl: expect.any(String),
    });
  });
});
