import {
  sessionResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  updateSessionStateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
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
const finishCountdown = 100;
const questionPoints = 6;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', duration, questionPoints, validAnswers,
    'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
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

  test('invalid quiz or session', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    // invalid quizId
    expect(() => sessionResultsRequest(quizId + 1, sessionId, token)).toThrow(HTTPError[400]);

    // user does not own quiz
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => sessionResultsRequest(quizId, sessionId, token2)).toThrow(HTTPError[400]);

    // Session Id does not refer to a valid session within this quiz
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
    const correctAnswerId = playerCurrentQuestionInfoRequest(playerId, 1).answers[0].answerId;

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
    const correctAnswerId = playerCurrentQuestionInfoRequest(playerId, 1).answers[0].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, 1);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: questionPoints
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
    const answers = playerCurrentQuestionInfoRequest(playerId, 1).answers;
    const correctAnswerId = answers[0].answerId;
    const incorrectAnswerId = answers[1].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, 1);
    playerSubmitAnswerRequest([incorrectAnswerId], player2Id, 1);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: questionPoints
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
  test('2 questions, multiple correct answers in question', () => {
    const validAnswers2 = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }, { answer: 'answer3', correct: true }];
    const question2Id = createQuizQuestionRequest(quizId, token, 'Question 2', duration, questionPoints, validAnswers2,
      'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;

    const session2Id = startSessionRequest(quizId, token, 1).sessionId;

    const playerId = playerJoinRequest(session2Id, 'Player').playerId;
    const player2Id = playerJoinRequest(session2Id, 'Player2').playerId;

    updateSessionStateRequest(quizId, session2Id, token, 'NEXT_QUESTION');
    const answers = playerCurrentQuestionInfoRequest(playerId, 1).answers;
    const correctAnswerId = answers[0].answerId;
    const incorrectAnswerId = answers[1].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, 1);
    playerSubmitAnswerRequest([incorrectAnswerId], player2Id, 1);

    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, session2Id, token, 'NEXT_QUESTION');
    const answers2 = playerCurrentQuestionInfoRequest(playerId, 2).answers;

    sleepSync(finishCountdown);
    // player 1 submits all three answers - incorrect overall
    playerSubmitAnswerRequest([answers2[0].answerId, answers[1].answerId, answers2[2].answerId], playerId, 2);
    // player 2 submits only the 2 correct answers
    playerSubmitAnswerRequest([answers2[0].answerId, answers2[2].answerId], player2Id, 2);

    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, session2Id, token, 'GO_TO_FINAL_RESULTS');

    const expected = {
      usersRankedByScore: [
        {
          name: 'Player',
          score: questionPoints
        },
        {
          name: 'Player2',
          score: questionPoints
        }
      ],
      questionResults: [
        {
          questionId: questionId,
          questionCorrectBreakdown: [
            {
              answerId: correctAnswerId,
              playersCorrect: [
                'Player',
              ],
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50
        },
        {
          questionId: question2Id,
          questionCorrectBreakdown: [
            {
              answerId: answers2[0].answerId,
              playersCorrect: [
                'Player',
                'Player2'
              ],
            },
            {
              answerId: answers2[2].answerId,
              playersCorrect: [
                'Player',
                'Player2'
              ],
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 50
        }
      ]
    };
    expect(sessionResultsRequest(quizId, session2Id, token)).toStrictEqual(expected);
  });
});
