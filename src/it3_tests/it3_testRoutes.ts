import { port, url } from '../config.json';
import request, { HttpVerb } from 'sync-request';
const SERVER_URL = `${url}:${port}`;
import { IncomingHttpHeaders } from 'http';
import HTTPError from 'http-errors';

interface Answer {
  answer: string,
  correct: boolean
}

interface Payload {
    [key: string]: any;
  }

// ========================================================================= //

const requestHelper = (
  method: HttpVerb,
  path: string,
  payload: Payload,
  headers: IncomingHttpHeaders = {}
): any => {
  let qs = {};
  let json = {};
  if (['GET', 'DELETE'].includes(method.toUpperCase())) {
    qs = payload;
  } else {
    // PUT/POST
    json = payload;
  }

  const url = SERVER_URL + path;
  const res = request(method, url, { qs, json, headers });

  let responseBody: any;
  try {
    responseBody = JSON.parse(res.body.toString());
  } catch (err: any) {
    if (res.statusCode === 200) {
      throw HTTPError(500,
          `Non-jsonifiable body despite code 200: '${res.body}'.\nCheck that you are not doing res.json(undefined) instead of res.json({}), e.g. in '/clear'`
      );
    }
    responseBody = { error: `Failed to parse JSON: '${err.message}'` };
  }

  const errorMessage = `[${res.statusCode}] ` + responseBody?.error || responseBody || 'No message specified!';

  switch (res.statusCode) {
    case 400: // BAD_REQUEST
    case 401: // UNAUTHORIZED
      throw HTTPError(res.statusCode, errorMessage);
    case 404: // NOT_FOUND
      throw HTTPError(res.statusCode, `Cannot find '${url}' [${method}]\nReason: ${errorMessage}\n\nHint: Check that your server.ts have the correct path AND method`);
    case 500: // INTERNAL_SERVER_ERROR
      throw HTTPError(res.statusCode, errorMessage + '\n\nHint: Your server crashed. Check the server log!\n');
    default:
      if (res.statusCode !== 200) {
        throw HTTPError(res.statusCode, errorMessage + `\n\nSorry, no idea! Look up the status code ${res.statusCode} online!\n`);
      }
  }
  return responseBody;
};

// ========================================================================= //

export function clearRequest() {
  return requestHelper('DELETE', '/v1/clear', {});
}

// AUTH/USER ROUTES // 
export function authLoginRequest(email: string, password: string) {
  return requestHelper('POST', '/v1/admin/auth/login', { email, password }, {});
}

export function authRegisterRequest(email: string, password: string, nameFirst: string, nameLast: string) {
  return requestHelper('POST', '/v1/admin/auth/register', { email, password, nameFirst, nameLast }, {});
}

export function updateUserPasswordRequest(token: string, oldPassword: string, newPassword: string) {
  return requestHelper('PUT', '/v2/admin/user/password', { oldPassword, newPassword }, { token });
}  

export function adminUserDetailsRequest(token: string) {
  return requestHelper('GET', '/v2/admin/user/details', {}, { token });
}

export function updateUserDetailsRequest(token: string, email: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/v2/admin/user/details', {email, nameFirst, nameLast}, { token });
}    

export function authLogoutRequest(tokenId: string) {
  return requestHelper('POST', '/v2/admin/auth/logout', {}, { tokenId });
}

// QUIZ ROUTES // 
export function quizCreateRequest(token: string, name: string, description: string) {
  return requestHelper('POST', '/v2/admin/quiz', { name, description }, { token });
}

export function adminQuizInfoRequest(token: string, quizId: number) {
  return requestHelper('GET', `/v2/admin/quiz/${quizId}`, {}, { token });
}

export function quizRemoveRequest(token: string, quizid: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizid}`, {}, { token })
}

export function quizNameUpdateRequest(token: string, quizid: number, name: string) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/name`, { name }, { token })
}

export function quizDescriptionUpdateRequest(quizid: number, token: string, description: string) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/description`, { description }, { token })
}

export function adminQuizListRequest(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/list', {}, { token })
}

export function quizTransferRequest (token: string, quizid: number, userEmail: string) {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/transfer`, { userEmail }, { token })
}

export function quizTrashRequest(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, { token })
}

export function quizRestoreRequest(token: string, quizId: number) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/restore`, {}, { token })
}

export function quizTrashEmptyRequest(token: string, quizIds: number[]) {
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token })
}

// QUESTION ROUTES // 

export function createQuizQuestionRequest(quizId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/question`, { questionBody: {
                                                                                        question,
                                                                                        duration,
                                                                                        points,
                                                                                        answers
                                                                                    } }, { token })
}

export function moveQuizQuestionRequest(token: string, quizId: number, questionId: number, newPosition: number) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { newPosition: newPosition }, { token })
}

export function deleteQuizQuestionRequest(token: string, quizId: number, questionId: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, { token })
}

export function quizQuestionDuplicateRequest(quizid: number, questionid: number, token: string) {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question/${questionid}/duplicate`, {}, { token })
}

export function updateQuizQuestionRequest(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}`, { questionBody: {
                                                                                                    question,
                                                                                                    duration,
                                                                                                    points,
                                                                                                    answers
                                                                                                 }}, { token })
}
