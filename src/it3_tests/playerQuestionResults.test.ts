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
const finishCountdown = 150;
const questionPosition = 0;
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
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId + 1, questionPosition)).toThrow(HTTPError[400]);
  });

  test('Invalid question position for session player is in', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId, questionPosition + 1)).toThrow(HTTPError[400]);
  });

  test('Session is not in ANSWER_SHOW state', () => {
    expect(() => playerQuestionResultsRequest(playerId, questionPosition)).toThrow(HTTPError[400]);
  });

  test('Session is not yet up to this question', () => {
    createQuizQuestionRequest(quizId, token, 'Question 2', 1, 6, validAnswers);
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    sleepSync(duration * 1000);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => playerQuestionResultsRequest(playerId, questionPosition + 1)).toThrow(HTTPError[400]);
  });
});

describe('Success cases', () => {
  test('valid output one player, no answer submitted', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    const questionInfo = playerCurrentQuestionInfoRequest(playerId, questionPosition);
    const correctAnswerId = questionInfo.answers[0].answerId;

    sleepSync(finishCountdown);
    sleepSync(questionInfo.duration * 1000);
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
    const answerTime = 1;
    sleepSync(answerTime * 1000);
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);

    sleepSync(questionInfo.duration * 1000 - answerTime);

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
      averageAnswerTime: answerTime,
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
    // Player answers current question with correct answer immediately
    playerSubmitAnswerRequest([correctAnswerId], playerId, questionPosition);
    const answerTime = 1;
    sleepSync(answerTime * 1000);
    // Player2 answer current question with incorrect answer after 1 second
    playerSubmitAnswerRequest([correctAnswerId, incorrectAnswerId], player2Id, questionPosition);

    sleepSync(questionInfo.duration * 1000 - answerTime);

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
      averageAnswerTime: answerTime / 2,
      percentCorrect: 50
    };

    expect(playerQuestionResultsRequest(playerId, questionPosition)).toStrictEqual(expected);
  });
});
