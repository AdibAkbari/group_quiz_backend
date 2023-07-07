import request from 'sync-request';

import { port, url } from '../config.json';
const SERVER_URL = `${url}:${port}`;

export function clearRequest() {
    const res = request(
        'DELETE',
        SERVER_URL + '/v1/clear'
    );
    return JSON.parse(res.body.toString())
}