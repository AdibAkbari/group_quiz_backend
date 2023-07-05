import request from 'sync-request';

import { port, url } from '../config.json';
const SERVER_URL = `${url}:${port}`;

export function authLoginRequest(email: string, password: string) {
    const res = request(
        'POST',
        SERVER_URL + '/v1/admin/auth/login',
        {
            json: { email: email, password: password },
        }
    );
    return JSON.parse(res.body.toString())
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

export function quizNameUpdateRequest(tokenId: string, quizId: number, name: string) {
    const res = request(
        'PUT',
        SERVER_URL + `/v1/admin/quiz/${quizid}/name`,
        {
          json: { token, name },
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
    // return JSON.parse(res.body.toString())

    try {
        JSON.parse(res.body.toString())
    }
    catch (error) {
        console.log('Error', error, res.body.toString())
    }
}