import request from 'sync-request';

import { port, url } from '../config.json';
const SERVER_URL = `${url}:${port}`;

interface Answer {
  answer: string,
  correct: boolean
}

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

export function quizCreateRequest(token: string, name: string, description: string) {
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

export function adminQuizInfoRequest(token: string, quizId: number) {
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

export function createQuizQuestionRequest(quizId: number, token: string, question: string, duration: number, points: number, answers: Answer[]) {
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

export function quizRemoveRequest(token: string, quizid: number) {
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

export function adminQuizListRequest(token: string) {
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

export function moveQuizQuestionRequest(token: string, quizId: number, questionId: number, newPosition: number) {
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

export function clearRequest() {
  const res = request(
    'DELETE',
    SERVER_URL + '/v1/clear'
  );
  return JSON.parse(res.body.toString());
}
