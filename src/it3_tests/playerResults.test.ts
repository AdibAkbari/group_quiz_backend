import {
  playerResultsRequest,
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  playerCurrentQuestionInfoRequest,
  playerStatusRequest,
  playerSubmitAnswerRequest,
  updateSessionStateRequest,
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
let playerId: number;
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
  playerId = playerJoinRequest(sessionId, 'Player').playerId;
});

describe('Error cases', () => {
  test('player ID does not exist', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(() => playerResultsRequest(playerId + 1)).toThrow(HTTPError[400]);
  });

  test('Session is not in FINAL_RESULTS state', () => {
    expect(() => playerResultsRequest(playerId)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('valid output one player, no answer submitted', () => {
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

    expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  });

  test('valid output two players', () => {
    const player2Id = playerJoinRequest(sessionId, 'Player2').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const correctAnswerId = playerCurrentQuestionInfoRequest(playerId, 1).answers[0].answerId;

    sleepSync(finishCountdown);
    // both players correct - player 1 should have higher score since answered first
    playerSubmitAnswerRequest([correctAnswerId], playerId, 1);
    playerSubmitAnswerRequest([correctAnswerId], player2Id, 1);

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
          score: questionPoints / 2
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
                'Player2'
              ],
            }
          ],
          averageAnswerTime: expect.any(Number),
          percentCorrect: 100
        }
      ]
    };
    expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  });
});
