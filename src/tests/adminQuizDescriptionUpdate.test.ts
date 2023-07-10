import { adminQuizCreate, adminQuizInfo, quizDescriptionUpdateRequest } from '../quiz';

import { 
  clearRequest, 
  authRegisterRequest,
  quizDescriptionUpdateRequest, 
} from './testRoutes';

const ERROR = { error: expect.any(String) };
let user;
let quiz;
beforeEach(() => {
  clearRequest();
  user = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last');
  quiz = adminQuizCreate(user.authUserId, 'My Quiz', 'First Description');
});

describe('invalid edge cases', () => {
  test('authUserId not valid user', () => {
    expect(quizDescriptionUpdateRequest(user.authUserId + 1, quiz.quizId, 'New Description')).toStrictEqual(ERROR);
  });

  test('quizId not valid', () => {
    expect(quizDescriptionUpdateRequest(user.authUserId, quiz.quizId + 1, 'New Description')).toStrictEqual(ERROR);
  });

  test('user does not own quiz', () => {
    const user2 = authRegister('email2@gmail.com', 'password1', 'first', 'last');
    const quiz2 = adminQuizCreate(user2.authUserId, 'user2 quiz', '');
    expect(quizDescriptionUpdateRequest(user.authUserId, quiz2.quizId, 'New Description')).toStrictEqual(ERROR);
  });

  test('description too long', () => {
    expect(quizDescriptionUpdateRequest(user.authUserId, quiz.quizId,
      '01234567890123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'
    )).toStrictEqual(ERROR);
    expect(quizDescriptionUpdateRequest(user.authUserId, quiz.quizId,
      '                                                                                                       '
    )).toStrictEqual(ERROR);
  });
});

// describe('valid input', () => {
//   test('valid input', () => {
//     expect(quizDescriptionUpdateRequest(user.authUserId, quiz.quizId, 'New Description')).toStrictEqual({ });
//   });

//   test('testing correct quiz description change', () => {
//     quizDescriptionUpdateRequest(user.authUserId, quiz.quizId, 'New Description');
//     expect(adminQuizInfo(user.authUserId, quiz.quizId)).toStrictEqual(
//       {
//         quizId: quiz.quizId,
//         name: 'My Quiz',
//         timeCreated: expect.any(Number),
//         timeLastEdited: expect.any(Number),
//         description: 'New Description',
//       }
//     );
//   });
// });
