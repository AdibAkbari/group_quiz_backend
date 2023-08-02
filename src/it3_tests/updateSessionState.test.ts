import {
  startSessionRequest,
  clearRequest,
  authRegisterRequest,
  quizCreateRequest,
  createQuizQuestionRequest,
  sessionStatusRequest,
  updateSessionStateRequest
} from './it3_testRoutes';
import { } from '../interfaces';
import HTTPError from 'http-errors';

let token: string;
let quizId: number;
let sessionId: number;
const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];

const finishCountdown = 100;
const questionDuration = 1;

function sleepSync(ms: number) {
  const startTime = new Date().getTime();
  while (new Date().getTime() - startTime < ms) {
    // zzzZZ - comment needed so eslint doesn't complain
  }
}

beforeEach(() => {
  clearRequest();
  token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
  quizId = quizCreateRequest(token, 'quiz1', '').quizId;
  createQuizQuestionRequest(quizId, token, 'Question 1', questionDuration, 6, validAnswers);
  sessionId = startSessionRequest(quizId, token, 3).sessionId;
});

describe('invalid token', () => {
  test.each([
    { testName: 'token has letters', tokens: '5436h8j6' },
    { testName: 'token only whitespace', tokens: '  ' },
    { testName: 'token has other characters', tokens: '6365,53' },
    { testName: 'empty string', tokens: '' },
    { testName: 'token has decimal point', tokens: '53.74' },
    { testName: 'token has negative sign', tokens: '-37294' },
  ])('token is not a valid structure: $testName', ({ tokens }) => {
    expect(() => updateSessionStateRequest(quizId, sessionId, tokens, 'NEXT_QUESTION')).toThrow(HTTPError[401]);
  });

  test('TokenId not logged in', () => {
    expect(() => updateSessionStateRequest(quizId, sessionId, token + 1, 'NEXT_QUESTION')).toThrow(HTTPError[403]);
  });
});

describe('invalid input', () => {
  test('quizId not a valid quiz', () => {
    expect(() => updateSessionStateRequest(quizId + 1, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
  });

  test('user does not own quiz', () => {
    const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
    expect(() => updateSessionStateRequest(quizId, sessionId, token2, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
  });

  test('sessionId invalid', () => {
    expect(() => updateSessionStateRequest(quizId, sessionId + 1, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
  });

  test('session not the same as quiz', () => {
    const quizId2 = quizCreateRequest(token, 'quiz2', '').quizId;
    expect(() => updateSessionStateRequest(quizId2, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
  });

  test.each([
    { action: 'ISDJFSI' },
    { action: 'NEXT' },
    { action: 'ANSWER' },
    { action: 'NEXT_QUESITON' },
    { action: 'next_question' }
  ])('action is not a valid action enum', ({ action }) => {
    expect(() => updateSessionStateRequest(quizId, sessionId, token, action)).toThrow(HTTPError[400]);
  });
});

describe('action enum cannot be applied in current state', () => {
  test('invalid action in lobby state', () => {
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toThrow(HTTPError[400]);
  });

  test.each([
    { action: 'NEXT_QUESTION' },
    { action: 'GO_TO_ANSWER' },
    { action: 'GO_TO_FINAL_RESULTS' },
  ])('invalid action in question_countdown state', ({ action }) => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    expect(() => updateSessionStateRequest(quizId, sessionId, token, action)).toThrow(HTTPError[400]);
  });

  test('invalid action in question_open', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toThrow(HTTPError[400]);
  });

  test('invalid action in answer_show', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('ANSWER_SHOW');

    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toThrow(HTTPError[400]);
  });
  test('invalid action in final_results', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('FINAL_RESULTS');

    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toThrow(HTTPError[400]);
  });

  test('invalid action in end', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toThrow(HTTPError[400]);
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'END')).toThrow(HTTPError[400]);
  });

  // assumption: will produce error if next_question command when no questions left
  test('Next_Question when no questions left', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(() => updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toThrow(HTTPError[400]);
  });
});

describe('valid input sequences', () => {
  test('each state during a game with one question', () => {
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('LOBBY');

    // lobby -> question_countdown
    expect(updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION')).toStrictEqual({});
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_COUNTDOWN');

    // question_countdown -> question_open
    sleepSync(finishCountdown);
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_OPEN');

    // question_open -> question_close
    sleepSync(questionDuration * 1000);
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_CLOSE');

    // question_close -> answer_show
    expect(updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER')).toStrictEqual({});
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('ANSWER_SHOW');

    // answer_show -> final_results
    expect(updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_FINAL_RESULTS')).toStrictEqual({});
    const sessionInfo = sessionStatusRequest(token, quizId, sessionId);
    expect(sessionInfo.state).toStrictEqual('FINAL_RESULTS');
    expect(sessionInfo.atQuestion).toStrictEqual(0);

    // final_results -> end
    expect(updateSessionStateRequest(quizId, sessionId, token, 'END')).toStrictEqual({});
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  test('two questions in the game', () => {
    createQuizQuestionRequest(quizId, token, 'Question 2', questionDuration, 6, validAnswers);
    const sessionId2 = startSessionRequest(quizId, token, 3).sessionId;
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('LOBBY');

    // lobby -> question_countdown
    updateSessionStateRequest(quizId, sessionId2, token, 'NEXT_QUESTION');
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('QUESTION_COUNTDOWN');

    // question_countdown -> question_open
    sleepSync(finishCountdown);

    // question_open -> answer_show
    updateSessionStateRequest(quizId, sessionId2, token, 'GO_TO_ANSWER');
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('ANSWER_SHOW');

    // answer_show -> question_countdown
    updateSessionStateRequest(quizId, sessionId2, token, 'NEXT_QUESTION');
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('QUESTION_COUNTDOWN');

    // question_countdown -> question_open
    sleepSync(finishCountdown);
    const sessionInfo = sessionStatusRequest(token, quizId, sessionId2);
    expect(sessionInfo.state).toStrictEqual('QUESTION_OPEN');
    expect(sessionInfo.atQuestion).toStrictEqual(2);

    // question_open -> question_close
    sleepSync(questionDuration * 1000);
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('QUESTION_CLOSE');

    // question_close -> final_results
    updateSessionStateRequest(quizId, sessionId2, token, 'GO_TO_FINAL_RESULTS');
    expect(sessionStatusRequest(token, quizId, sessionId2).state).toStrictEqual('FINAL_RESULTS');

    // final_results -> end
    updateSessionStateRequest(quizId, sessionId2, token, 'END');
    const sessionInfo2 = sessionStatusRequest(token, quizId, sessionId2);
    expect(sessionInfo2.state).toStrictEqual('END');
    expect(sessionInfo2.atQuestion).toStrictEqual(0);
  });
});

describe('end action from each state', () => {
  test('lobby', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  test('question_countdown', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_COUNTDOWN');
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  test('question_open', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_OPEN');
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  test('question_close', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown + questionDuration * 1000);
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_CLOSE');
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  test('answer_show', () => {
    updateSessionStateRequest(quizId, sessionId, token, 'NEXT_QUESTION');
    sleepSync(finishCountdown);
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('QUESTION_OPEN');
    updateSessionStateRequest(quizId, sessionId, token, 'GO_TO_ANSWER');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('ANSWER_SHOW');
    updateSessionStateRequest(quizId, sessionId, token, 'END');
    expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual('END');
  });

  // final_result has already been tested
});
