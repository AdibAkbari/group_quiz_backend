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
const finishCountdown = 150;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers).questionId;
  sessionId = startSessionRequest(quizId, token, 1).sessionId;
  playerId = playerJoinRequest(sessionId, 'Player').playerId;
});

describe('Error cases', () => {
  test('player ID does not exist', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
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
    const questionPosition = playerStatusRequest(playerId).atQuestion - 1;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    sleepSync(questionInfo.duration * 1000);
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

  test('valid output one player, one correct answer', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion - 1;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    const answerTime = 1;
    sleepSync(answerTime * 1000);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);

    sleepSync(questionInfo.duration * 1000 - answerTime);

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
          averageAnswerTime: answerTime,
          percentCorrect: 100
        }
      ]
    };
    expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  });

  test('valid output two players', () => {
    const player2Id = playerJoinRequest(sessionId, 'Player2').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionPosition = playerStatusRequest(playerId).atQuestion - 1;
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;
    const incorrectAnswerId = questionInfo.answers[1].answerId;

    sleepSync(finishCountdown);
    // Player answers current question with correct answer immediately
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    const answerTime = 1;
    sleepSync(answerTime * 1000);
    // Player2 answer current question with incorrect answer after 1 second
    playerSubmitAnswerRequest([correctAnswerId, incorrectAnswerId], player2Id, questionPosition);

    sleepSync(questionInfo.duration * 1000 - answerTime);

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
                'Player',
                'Player2'
              ],
            }
          ],
          averageAnswerTime: answerTime,
          percentCorrect: 50
        }
      ]
    };
    expect(playerResultsRequest(playerId)).toStrictEqual(expected);
  });
});
