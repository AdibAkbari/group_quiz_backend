import {
    startSessionRequest,
    clearRequest,
    authRegisterRequest,
    quizCreateRequest,
    createQuizQuestionRequest,
    sessionStatusRequest
  } from './it3_testRoutes';
  import { } from '../interfaces';
  import HTTPError from 'http-errors';
import { updateSessionState } from '../session';
  
  let token: string;
  let quizId: number;
  let sessionId: number;
  const validAnswers = [{ answer: 'answer1', correct: true }, { answer: 'answer2', correct: false }];
  
  const finishCountdown = 100;
  const questionDuration = 5;

  beforeEach(() => {
    clearRequest();
    token = authRegisterRequest('email@gmail.com', 'password1', 'first', 'last').body.token;
    quizId = quizCreateRequest(token, 'quiz1', '').quizId;
    createQuizQuestionRequest(quizId, token, 'Question 1', questionDuration, 6, validAnswers).questionId;
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
      expect(() => updateSessionState(quizId, sessionId, tokens, "NEXT_QUESTION")).toThrow(HTTPError[401]);
    });
  
    test('TokenId not logged in', () => {
      expect(() => updateSessionState(quizId, sessionId,  token + 1, "NEXT_QUESTION")).toThrow(HTTPError[403]);
    });
  });

  describe('invalid input', () => {
    test('quizId not a valid quiz', () => {
      expect(() => updateSessionState(quizId + 1, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
    });
  
    test('user does not own quiz', () => {
      const token2 = authRegisterRequest('email2@gmail.com', 'password1', 'firstname', 'lastname').body.token;
      expect(() => updateSessionState(quizId, sessionId, token2, "NEXT_QUESTION")).toThrow(HTTPError[400]);
    });

    test('sessionId invalid', () => {
      expect(() => updateSessionState(quizId, sessionId + 1, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
    });

    test('session not the same as quiz', () => {
      const quizId2 = quizCreateRequest(token, 'quiz2', '').quizId;
      expect(() => updateSessionState(quizId2, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
    })

    test('action is not a valid action enum', () => {
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT")).toThrow(HTTPError[400]);
    });

    test.each([
      { action: "ISDJFSI" },
      { action: "NEXT" },
      { action: "ANSWER" },
      { action: "NEXT_QUESITON" },
      { action: "next_question" }
    ])('action is not a valid action enum', ({ action }) => {
      expect(() => updateSessionState(quizId, sessionId, token, action)).toThrow(HTTPError[401]);
    });

  });

  describe('action enum cannot be applied in current state', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    })

    test('invalid action in lobby state', () => {
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toThrow(HTTPError[400]);
    })

    test('invalid action in question_countdown state', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toThrow(HTTPError[400]);
    });

    test('invalid action in question_open', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      //skip forward just over 0.1ms to get to state question_open
      jest.advanceTimersByTime(finishCountdown + 1);
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toThrow(HTTPError[400]);
    })
    test('invalid action in answer_show', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + 1);
      updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER");
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toThrow(HTTPError[400]);
    })
    test('invalid action in final_results', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + 1);
      updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER");
      updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toThrow(HTTPError[400]);

    })

    test('invalid action in end', () => {
      updateSessionState(quizId, sessionId, token, "END");
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toThrow(HTTPError[400]);
      expect(() => updateSessionState(quizId, sessionId, token, "END")).toThrow(HTTPError[400]);
    })  

    // assumption: will produce error if next_question command when no questions left
    test('Next_Question when no questions left', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + 1);
      updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER");
      expect(() => updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toThrow(HTTPError[400]);
    })
  });

  describe('valid input sequences', () => {
    beforeEach(() => {
      jest.useFakeTimers()
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    })
    
    test('each state during a game with one question', () => {
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("LOBBY");

      // lobby -> question_countdown
      expect(updateSessionState(quizId, sessionId, token, "NEXT_QUESTION")).toStrictEqual({});
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_COUNTDOWN");

      // question_countdown -> question_open
      jest.advanceTimersByTime(finishCountdown + 1);
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_OPEN");

      // question_open -> question_close
      jest.advanceTimersByTime(questionDuration);
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_CLOSE");

      // question_close -> answer_show
      expect(updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER")).toStrictEqual({});
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("ANSWER_SHOW");

      // answer_show -> final_results
      expect(updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS")).toStrictEqual({});
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("FINAL_RESULTS");

      // final_results -> end
      expect(updateSessionState(quizId, sessionId, token, "END")).toStrictEqual({});
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    test('two questions in the game', () => {
      createQuizQuestionRequest(quizId, token, 'Question 2', questionDuration, 6, validAnswers).questionId;
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("LOBBY");

      // lobby -> question_countdown
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");      
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_COUNTDOWN");

      // question_countdown -> question_open
      jest.advanceTimersByTime(finishCountdown + 1);

      // question_open -> answer_show
      updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("ANSWER_SHOW");

      // answer_show -> question_countdown
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_COUNTDOWN");

      // question_countdown -> question_open
      jest.advanceTimersByTime(finishCountdown + 1);
      const sessionInfo = sessionStatusRequest(token, quizId, sessionId);
      expect(sessionInfo.state).toStrictEqual("QUESTION_OPEN");
      expect(sessionInfo.atQuestion).toStrictEqual(2);

      // question_open -> question_close
      jest.advanceTimersByTime(questionDuration);
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("QUESTION_CLOSE");

      // question_close -> final_results
      updateSessionState(quizId, sessionId, token, "GO_TO_FINAL_RESULTS");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("FINAL_RESULTS");

      // final_results -> end
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })
  })

  describe('end action from each state', () => {
    test('lobby', () => {
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    test('question_countdown', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    test('question_open', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + 1);
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    test('question_close', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + questionDuration + 1);
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    test('answer_show', () => {
      updateSessionState(quizId, sessionId, token, "NEXT_QUESTION");
      jest.advanceTimersByTime(finishCountdown + 1);
      updateSessionState(quizId, sessionId, token, "GO_TO_ANSWER");
      updateSessionState(quizId, sessionId, token, "END");
      expect(sessionStatusRequest(token, quizId, sessionId).state).toStrictEqual("END");
    })

    // final_result has already been tested
  })





