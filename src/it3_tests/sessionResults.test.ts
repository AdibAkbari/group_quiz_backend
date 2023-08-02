import {
  sessionResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  updateSessionStateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  playerStatusRequest,
  playerCurrentQuestionInfoRequest,
  playerSubmitAnswerRequest
} from './it3_testRoutes';
import HTTPError from 'http-errors';

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

let token: string;
let quizId: number;
let sessionId: number;
let questionId: number;
const duration = 2;
const finishCountdown = 150;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers).questionId;
  sessionId = startSessionRequest(quizId, token, 1).sessionId;
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
    expect(() => sessionResultsRequest(quizId, sessionId, token)).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => sessionResultsRequest(quizId, sessionId, token + 1)).toThrow(HTTPError[403]);
  });

  test('quizId not a valid quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(() => sessionResultsRequest(quizId + 1, sessionId, token)).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => sessionResultsRequest(quizId, sessionId, token2)).toThrow(HTTPError[400]);
  });

  test('Session Id does not refer to a valid session within this quiz', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(() => sessionResultsRequest(quizId, sessionId + 1, token)).toThrow(HTTPError[400]);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    expect(() => sessionResultsRequest(quizId, sessionId, token)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('valid output one player, no answer submitted', () => {
    const playerId = playerJoinRequest(sessionId, 'Player').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const playersCorrect: string[] = [];

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: 0
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: correctAnswerId,
              playersCorrect: playersCorrect,
            }
          ],
          averageAnswerTime: 0,
          percentCorrect: 0
        }
      ]
    };

    expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  });

  test('valid output one player, one correct answer', () => {
    const playerId = playerJoinRequest(sessionId, 'Player').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: questionInfo.points
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: correctAnswerId,
              playersCorrect: [
                'Player'
              ],
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        }
      ]
    };
    expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  });

  test('valid output two players', () => {
    const playerId = playerJoinRequest(sessionId, 'Player').playerId;
    const player2Id = playerJoinRequest(sessionId, 'Player2').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;
    const incorrectAnswerId = questionInfo.answers[1].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    playerSubmitAnswerRequest([incorrectAnswerId], player2Id, questionPosition);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: questionInfo.points
        },
        {
          name: 'Player2',
          score: 0
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: correctAnswerId,
              playersCorrect: [
                'Player'
              ],
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50
        }
      ]
    };
    expect(sessionResultsRequest(quizId, sessionId, token)).toStrictEqual(expected);
  });
});
