import {
  playerResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  playerQuestionResultsRequest,
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
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_ANSWER");
    expect(() => playerQuestionResultsRequest(playerId + 1, 0)).toThrow(HTTPError[400]);
  });

  test('Invalid question position for session player is in', () => {
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_ANSWER");
    expect(() => playerQuestionResultsRequest(playerId, 1)).toThrow(HTTPError[400]);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    expect(() => playerQuestionResultsRequest(playerId, 0)).toThrow(HTTPError[400]);
  });

  test('Session is not yet up to this question', () => {
    createQuizQuestionRequest(quizId, token, 'Question 2', 1, 6, validAnswers);
    // updateSessionRequest(quizId, sessionId, token, "GO_TO_ANSWER");
    expect(() => playerQuestionResultsRequest(playerId, 0)).toThrow(HTTPError[400]);
  });
  
});

describe('Success cases', () => {
  // test('valid output no player, no answers', () => {
  //   updateSessionRequest(quizId, sessionId, token, "NEXT_QUESTION");
  //   const questionPosition = playerStatusRequest(playerId).atQuestion;
  //   const questionInfo = playerQuestionInfo(playerId, questionPosition);
  //   sleepSync(questionInfo.duration * 1000);
  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     questionId: questionId,
  //     questionCorrectBreakdown: [
  //       {
  //         answerId: 1,
  //         playersCorrect: [
  //           "Player"
  //         ]
  //       }
  //     ],
  //     averageAnswerTime: expect.any(Number), // calculate this??
  //     percentCorrect: 0
  //   };

  //   expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
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
  //     questionId: questionId,
  //     questionCorrectBreakdown: [
  //       {
  //         answerId: correctAnswerId,
  //         playersCorrect: [
  //           "Player"
  //         ]
  //       }
  //     ],
  //     averageAnswerTime: expect.any(Number), // calculate this??
  //     percentCorrect: 100
  //   };
      
  //   expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
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
  //   submitAnswerRequest({answerIds: [incorrectAnswerId, correctAnswerId]}, player2Id, questionPosition);

  //   sleepSync(questionInfo.duration * 1000);
  //   updateSessionRequest(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");

  //   const expected = {
  //     questionId: questionId,
  //     questionCorrectBreakdown: [
  //       {
  //         answerId: correctAnswerId,
  //         playersCorrect: [
  //           "Player",
  //           "Player2"
  //         ]
  //       }
  //     ],
  //     averageAnswerTime: expect.any(Number),
  //     percentCorrect: 50
  //   };

  //   expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
  // });
});
