import {
  sessionResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  // updateQuizQuestionRequest
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

// function sleepSync(ms: number) {
//   const startTime = new Date().getTime();
//   while (new Date().getTime() - startTime < ms) {
//     // zzzZZ - comment needed so eslint doesn't complain
//   }
// }

let token: string;
let quizId: number;
let sessionId: number;
// let questionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  // questionId = createQuizQuestionRequest(quizId, token, 'Question 1', 1, 6, validAnswers).questionId;
  createQuizQuestionRequest(quizId, token, 'Question 1', 1, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 1);
});

describe('Error cases', () => {
  test.each([
    { testName: 'token has letters', token: '5436h8j6' },
    { testName: 'token only whitespace', token: '  ' },
    { testName: 'token has other characters', token: '6365,53' },
    { testName: 'empty string', token: '' },
    { testName: 'token has decimal point', token: '53.74' },
    { testName: 'token has negative sign', token: '-37294' },
  ])('token is not a valid structure: $testName', ({ token }) => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    expect(() => sessionResultsRequest(quizId, sessionId, token)).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    expect(() => sessionResultsRequest(quizId, sessionId, token + 1)).toThrow(HTTPError[403]);
  });

  test('quizId not a valid quiz', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    expect(() => sessionResultsRequest(quizId + 1, sessionId, token)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => sessionResultsRequest(quizId, sessionId, token2)).toThrow(HTTPError[400]);
  });

  test('Session Id does not refer to a valid session within this quiz', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    expect(() => sessionResultsRequest(quizId, sessionId + 1, token)).toThrow(HTTPError[400]);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    expect(() => sessionResultsRequest(quizId, sessionId, token)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  // test('valid output no player, no answers', () => {
  //   updateSessionRequest(quizId, sessionId, token, "NEXT_QUESTION");
  //   sleepSync(questionInfo.duration * 1000);
  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     usersRankedByScore: [],
  //     questionResults: [
  //       {
  //         questionId: questionId,
  //         questionCorrectBreakdown: [],
  //         averageAnswerTime: expect.any(Number),
  //         percentCorrect: 0
  //       }
  //     ]
  //   };
  //   expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  // });

  // test('valid output one player, one question', () => {
  //   const playerId = playerJoinRequest(sessionId, 'Test Player');
  //   updateSessionRequest(quizId, sessionId, token, "NEXT_QUESTION");
  //   // player answers current question with first answer (correct)
  //   const questionPosition = playerStatusRequest(playerId).atQuestion;
  //   const questionInfo = playerQuestionInfo(playerId, questionPosition);
  //   const correctAnswerId = questionInfo.answers[0].answerId;
  //   submitAnswerRequest({answerIds: [correctAnswerId]}, playerId, questionPosition);
  //   sleepSync(questionInfo.duration * 1000);

  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     usersRankedByScore: [
  //       {
  //         name: "Test Player",
  //         score: questionInfo.points
  //       }
  //     ],
  //     questionResults: [
  //       {
  //         questionId: questionId,
  //         questionCorrectBreakdown: [
  //           {
  //             answerId: answerId,
  //             playersCorrect: [
  //               "Test Player"
  //             ]
  //           }
  //         ],
  //         averageAnswerTime: expect.any(Number),
  //         percentCorrect: 100
  //       }
  //     ]
  //   };
  //   expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  // });

  // test('valid output two players - testing correct ordering', () => {
  //   const playerId = playerJoinRequest(sessionId, 'Test Player');
  //   const player2Id = playerJoinRequest(sessionId, 'Test Player2');
  //   updateSessionRequest(quizId, sessionId, token, "NEXT_QUESTION");

  //   const questionPosition = playerStatusRequest(playerId).atQuestion;
  //   const questionInfo = playerQuestionInfo(playerId, questionPosition);
  //   const correctAnswerId = questionInfo.answers[0].answerId;
  //   const incorrectAnswerId = questionInfo.answers[1].answerId;
  //   // Test Player answers current question with correct answer
  //   submitAnswerRequest({answerIds: [correctAnswerId]}, playerId, questionPosition);
  //   // Test Player2 answer current question with incorrect answer
  //   submitAnswerRequest({answerIds: [incorrectAnswerId]}, player2Id, questionPosition);

  //   sleepSync(questionInfo.duration * 1000);
  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     usersRankedByScore: [
  //       {
  //         name: "Test Player",
  //         score: questionInfo.points
  //       }
  //       {
  //         name: "Test Player2",
  //         score: 0
  //       }
  //     ],
  //     questionResults: [
  //       {
  //         questionId: questionId,
  //         questionCorrectBreakdown: [
  //           {
  //             answerId: correctAnswerId,
  //             playersCorrect: [
  //               "Test Player"
  //             ]
  //           }
  //         ],
  //         averageAnswerTime: expect.any(Number),
  //         percentCorrect: 50
  //       }
  //     ]
  //   };
  //   expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  // });
});
