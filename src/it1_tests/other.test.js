import { clear } from '../other.js';

describe('clear test', () => {
    test('returns empty data', () => {
        expect(clear()).toStrictEqual({});
    });
})
