// tests for adminAuthRegister function
import { adminAuthRegister } from '../auth.js'
import { clear } from '../other.js'

beforeEach(() => {
    clear();
  });

describe ('test for valid input for adminAuthRegister', () => {
    test.each([
        {
            name: 'valid input',
            email: 'email@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'valid input 2',
            email: 'email3@hotmail.com',
            pass: 'passw123',
            first: 'na',
            last: 'na'
        },
        {
            name: 'valid input 3',
            email: 'email4@yahoo.com',
            pass: 'longPassword12345',
            first: 'nameIsExactlyTwentyy',
            last: 'lastIsExactlyTwentyy'
        },
        {
            name: 'valid input 4',
            email: 'email5@gmail.com',
            pass: 'password1',
            first: 'name- First\'s',
            last: 'name- Last\'s'
        },
    ])('valid input', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ authUserId: expect.any(Number) });
    });

});

describe ('test for errors for adminAuthRegister', () => {
    test.each([
        {
            name: 'empty email',
            email: ''
        },
        {
            name: 'invalid email',
            email: 'email'
        },
    ])('invalid email test', ({email}) => {
        expect(adminAuthRegister(email, 'password1', 'nameFirst', 'nameLast')).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty nameLast',
            last: ''
        },
        {
            name: 'invalid nameLast',
            last: 'nameLast$'
        },
        {
            name: 'invalid nameLast 2',
            last: 'nameLast1'
        },
        {
            name: 'nameLast too short',
            last: 'n'
        },
        {
            name: 'nameLast too long',
            last: 'nameLastIsMoreThanTwenty'
        },
    ])('invalid nameLast tests', ({last}) => {
        expect(adminAuthRegister('email2@gmail.com', 'password1', 'nameFirst', last)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty nameFirst',
            first: ''
        },
        {
            name: 'invalid nameFirst',
            first: 'nameFirst$'
        },
        {
            name: 'invalid nameFirst 2',
            first: 'nameFirst$()1'
        },
        {
            name: 'nameFirst too short',
            first: 'n'
        },
        {
            name: 'nameFirst too long',
            first: 'nameFirstIsMoreThanTwenty'
        },
    ])('invalid nameFirst tests', ({first}) => {
        expect(adminAuthRegister('email2@gmail.com', 'password1', first, 'nameLast')).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty password',
            pass: ''
        },
        {
            name: 'password too short',
            pass: 'pass1'
        },
        {
            name: 'password must contain number',
            pass: 'password'
        },
        {
            name: 'password must contain letter',
            pass: '12345678'
        },
    ])('invalid password tests', ({pass}) => {
        expect(adminAuthRegister('email2@gmail.com', pass, 'nameFirst', 'nameLast')).toStrictEqual({ error: expect.any(String) });
    });

    test('email already used', () => {
        const user = adminAuthRegister('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
        expect(adminAuthRegister('email@gmail.com', 'password12', 'nameFirsts', 'nameLasts')).toStrictEqual({ error: expect.any(String) });
    });
});




