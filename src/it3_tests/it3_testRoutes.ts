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
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/clear'
  );
  return JSON.parse(res.body.toString());
}

// AUTH/USER ROUTES //
export function authLoginRequest(email: string, password: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/login',
    {
      json: { email: email, password: password },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function authRegisterRequest(email: string, password: string, nameFirst: string, nameLast: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/register',
    {
      json: { email: email, password: password, nameFirst: nameFirst, nameLast: nameLast },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function updateUserPasswordRequest(token: string, oldPassword: string, newPassword: string) {
  return requestHelper('PUT', '/v2/admin/user/password', { oldPassword, newPassword }, { token });
}

export function adminUserDetailsRequest(token: string) {
  return requestHelper('GET', '/v2/admin/user/details', {}, { token });
}

export function updateUserDetailsRequest(token: string, email: string, nameFirst: string, nameLast: string) {
  return requestHelper('PUT', '/v2/admin/user/details', { email, nameFirst, nameLast }, { token });
}

export function authLogoutRequest(token: string) {
  return requestHelper('POST', '/v2/admin/auth/logout', {}, { token });
}

// QUIZ ROUTES //
export function quizCreateRequest(token: string, name: string, description: string) {
  return requestHelper('POST', '/v2/admin/quiz', { name, description }, { token });
}

export function adminQuizInfoRequest(token: string, quizId: number) {
  return requestHelper('GET', `/v2/admin/quiz/${quizId}`, {}, { token });
}

export function quizRemoveRequest(token: string, quizid: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizid}`, {}, { token });
}

export function quizNameUpdateRequest(token: string, quizid: number, name: string) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/name`, { name }, { token });
}

export function quizDescriptionUpdateRequest(quizid: number, token: string, description: string) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizid}/description`, { description }, { token });
}

export function adminQuizListRequest(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/list', {}, { token });
}

export function quizTransferRequest (token: string, quizid: number, userEmail: string) {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/transfer`, { userEmail }, { token });
}

export function quizTrashRequest(token: string) {
  return requestHelper('GET', '/v2/admin/quiz/trash', {}, { token });
}

export function quizRestoreRequest(token: string, quizId: number) {
  return requestHelper('POST', `/v2/admin/quiz/${quizId}/restore`, {}, { token });
}

export function quizTrashEmptyRequest(token: string, quizIds: number[]) {
  return requestHelper('DELETE', '/v2/admin/quiz/trash/empty', { quizIds: JSON.stringify(quizIds) }, { token });
}

// QUESTION ROUTES //

export function createQuizQuestionRequest(quizId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  return requestHelper(
    'POST',
    `/v2/admin/quiz/${quizId}/question`,
    {
      questionBody: {
        question,
        duration,
        points,
        answers
      }
    },
    { token }
  );
}

export function moveQuizQuestionRequest(token: string, quizId: number, questionId: number, newPosition: number) {
  return requestHelper('PUT', `/v2/admin/quiz/${quizId}/question/${questionId}/move`, { newPosition: newPosition }, { token });
}

export function deleteQuizQuestionRequest(token: string, quizId: number, questionId: number) {
  return requestHelper('DELETE', `/v2/admin/quiz/${quizId}/question/${questionId}`, {}, { token });
}

export function quizQuestionDuplicateRequest(quizid: number, questionid: number, token: string) {
  return requestHelper('POST', `/v2/admin/quiz/${quizid}/question/${questionid}/duplicate`, {}, { token });
}

export function updateQuizQuestionRequest(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  return requestHelper(
    'PUT',
    `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      questionBody: {
        question,
        duration,
        points,
        answers
      }
    },
    { token }
  );
}

// ====================================================================
//  ================= IT 2 TEST ROUTES (OLD) ==========================
// ====================================================================

export function quizCreateRequestV1(token: string, name: string, description: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/quiz',
    {
      json: { token: token, name: name, description: description },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function updateUserPasswordRequestV1(token: string, oldPassword: string, newPassword: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/password',
    {
      json: { token: token, oldPassword: oldPassword, newPassword: newPassword },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function adminUserDetailsRequestV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/user/details',
    {
      qs: {
        token: token,
      }
    });
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function adminQuizInfoRequestV1(token: string, quizId: number) {
  const res = request(
    'GET',
    SERVER_URL + `/v1/admin/quiz/${quizId}`,
    {
      qs: {
        token: token,
      }
    });
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function updateUserDetailsRequestV1(token: string, email: string, nameFirst: string, nameLast: string) {
  const res = request(
    'PUT',
    SERVER_URL + '/v1/admin/user/details',
    {
      json: { token: token, email: email, nameFirst: nameFirst, nameLast: nameLast },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function createQuizQuestionRequestV1(quizId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question`,
    {
      json: {
        token: token,
        questionBody: {
          question,
          duration,
          points,
          answers
        }
      }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function moveQuizQuestionRequestV1(token: string, quizId: number, questionId: number, newPosition: number) {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/move`,
    {
      json: {
        token: token,
        newPosition: newPosition,
      }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function deleteQuizQuestionRequestV1(token: string, quizId: number, questionId: number) {
  const res = request(
    'DELETE',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      qs: {
        token: token,
      }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizRemoveRequestV1(token: string, quizid: number) {
  const res = request(
    'DELETE',
    SERVER_URL + `/v1/admin/quiz/${quizid}`,
    {
      qs: { token: token },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizNameUpdateRequestV1(token: string, quizid: number, name: string) {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizid}/name`,
    {
      json: { token: token, name: name },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function adminQuizListRequestV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/quiz/list',
    {
      qs: {
        token: token,
      }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizTransferRequestV1(token: string, quizid: number, userEmail: string) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizid}/transfer`,
    {
      json: { token: token, userEmail: userEmail },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizTrashRequestV1(token: string) {
  const res = request(
    'GET',
    SERVER_URL + '/v1/admin/quiz/trash',
    {
      qs: { token: token }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizRestoreRequestV1(token: string, quizId: number) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizId}/restore`,
    {
      json: { token: token }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function updateQuizQuestionRequestV1(quizId: number, questionId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      json: {
        token: token,
        questionBody: {
          question,
          duration,
          points,
          answers
        }
      }
    });
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizTrashEmptyRequestV1(token: string, quizIds: number[]) {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/admin/quiz/trash/empty',
    {
      qs: { token: token, quizIds: JSON.stringify(quizIds) }
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizQuestionDuplicateRequestV1(quizid: number, questionid: number, token: string) {
  const res = request(
    'POST',
    SERVER_URL + `/v1/admin/quiz/${quizid}/question/${questionid}/duplicate`,
    {
      json: { token: token },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function quizDescriptionUpdateRequestV1(quizid: number, token: string, description: string) {
  const res = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizid}/description`,
    {
      json: { token: token, description: description },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

export function authLogoutRequestV1(tokenId: string) {
  const res = request(
    'POST',
    SERVER_URL + '/v1/admin/auth/logout',
    {
      json: { token: tokenId },
    }
  );
  return {
    body: JSON.parse(res.body.toString()),
    statusCode: JSON.parse(res.statusCode.toString())
  };
}

// ====================================================================
//  ================= IT 3 TEST ROUTES (NEW) ==========================
// ====================================================================

// Session routes
export function startSessionRequest(quizId: number, token: string, autoStartNum: number) {
  return requestHelper('POST', `/v1/admin/quiz/${quizId}/session/start`, { autoStartNum }, { token });
}

export function sessionResultsRequest(quizId: number, sessionId: number, token: string) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}/results`, { }, { token });
}

export function sessionStatusRequest(token: string, quizId: number, sessionId: number) {
  return requestHelper('GET', `/v1/admin/quiz/${quizId}/session/${sessionId}`, {}, { token });
}

// PLAYER ROUTES //
export function playerJoinRequest(sessionId: number, name: string) {
  return requestHelper('POST', '/v1/player/join', { sessionId, name });
}

export function playerStatusRequest(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}`, {});
}

export function playerCurrentQuestionInfoRequest(playerId: number, questionPosition: number) {
  return requestHelper('GET', `/v1/player/${playerId}/question/${questionPosition}`, {});
}

export function playerResultsRequest(playerId: number) {
  return requestHelper('GET', `/v1/player/${playerId}/results`, { }, { });
}

export function playerQuestionResultsRequest(playerId: number, questionPosition: number) {
  return requestHelper(
    'GET', 
    `/v1/player/${playerId}/question/${questionPosition}/results`, 
    { }, 
    { }
  );
}