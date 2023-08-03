import {
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  playerJoinRequest,
  playerQuestionResultsRequest,
  updateSessionStateRequest,
  playerCurrentQuestionInfoRequest,
  playerSubmitAnswerRequest,
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
const questionPosition = 1;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  questionId = createQuizQuestionRequest(quizId, token, 'Question 1', duration, 6, validAnswers, 
  'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg').questionId;
  sessionId = startSessionRequest(quizId, token, 1).sessionId;
  playerId = playerJoinRequest(sessionId, 'Player').playerId;
});

describe('Error cases', () => {
  test('player ID does not exist', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId + 1, questionPosition)).toThrow(HTTPError[400]);
  });

  test('Invalid question position for session player is in', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId, questionPosition + 1)).toThrow(HTTPError[400]);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    expect(() => playerQuestionResultsRequest(playerId, questionPosition)).toThrow(HTTPError[400]);
  });

  test('Session is not yet up to this question', () => {
    createQuizQuestionRequest(quizId, token, 'Question 2', 1, 6, validAnswers,
    'https://i.pinimg.com/564x/04/d5/02/04d502ec84e7188c0bc150a9fb4a0a37.jpg');
    const sessionId2 = startSessionRequest(quizId, token, 1).sessionId;
    const playerId2 = playerJoinRequest(sessionId2, 'Player2').playerId;

    updateSessionStateRequest(quizId, sessionId2, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId2, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId2, questionPosition + 1)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('valid output one player, no answer submitted', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    const playersCorrect: string[] = [];

    const expected = {
      questionId: questionId,
      questionCorrectBreakdown: [
        {
          answerId: correctAnswerId,
          playersCorrect: playersCorrect,
        }
      ],
      averageAnswerTime: 0,
      percentCorrect: 0
    };

    expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
  });

  test('valid output one player, one correct answer', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');

    const expected = {
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
    };

    expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
  });

  test('valid output two players', () => {
    const player2Id = playerJoinRequest(sessionId, 'Player2').playerId;
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;
    const incorrectAnswerId = questionInfo.answers[1].answerId;

    sleepSync(finishCountdown);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    playerSubmitAnswerRequest([correctAnswerId, incorrectAnswerId], player2Id, questionPosition);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');

    const expected = {
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
      percentCorrect: 50
    };

    expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
  });
});
