import {
  playerResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  // playerStatusRequest,
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
let questionId: number;
let playerId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', 1, 6, validAnswers).questionId;
  // createQuizQuestionRequest(quizId, token, 'Question 1', 1, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 1).sessionId;
  playerId = playerJoinRequest(sessionId, 'Player').playerId;
});

describe('Error cases', () => {
  test('player ID does not exist', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
    expect(() => playerResultsRequest(playerId + 1)).toThrow(HTTPError[400]);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    expect(() => playerResultsRequest(playerId)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  // test('valid output no player, no answers', () => {
  //   updateSessionRequest(quizId, sessionId, token, "NEXT_QUESTION");
  //   const questionPosition = playerStatusRequest(playerId).atQuestion
  //   const questionInfo = playerQuestionInfo(playerId, questionPosition);
  //   sleepSync(questionInfo.duration * 1000);
  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     usersRankedByScore: [
  //       {
  //         name: "Player",
  //         score: 0
  //       }
  //     ],
  //     questionResults: [
  //       {
  //         questionId: questionId,
  //         questionCorrectBreakdown: [
  //           {
  //             answerId: ,
  //             playersCorrect: [
  //               "Player"
  //             ]
  //           }
  //         ],
  //         averageAnswerTime: expect.any(Number), // calculate this??
  //         percentCorrect: 0
  //       }
  //     ]
  //   };
  //   expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  // });

  // test('valid output one player, one question', () => {
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
  //         name: "Player",
  //         score: questionInfo.points
  //       }
  //     ],
  //     questionResults: [
  //       {
  //         questionId: questionId,
  //         questionCorrectBreakdown: [
  //           {
  //             answerId: correctAnswerId,
  //             playersCorrect: [
  //               "Player"
  //             ]
  //           }
  //         ],
  //         averageAnswerTime: expect.any(Number), // calculate this??
  //         percentCorrect: 100
  //       }
  //     ]
  //   };
  //   expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  // });

  // test('valid output two players - testing correct ordering', () => {
  //   const player2Id = playerJoinRequest(sessionId, 'Player2');
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
  //         name: "Player",
  //         score: questionInfo.points
  //       }
  //       {
  //         name: "Player2",
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
  //               "Player"
  //             ]
  //           }
  //         ],
  //         averageAnswerTime: expect.any(Number),
  //         percentCorrect: 50
  //       }
  //     ]
  //   };
  //   expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  // });
});
