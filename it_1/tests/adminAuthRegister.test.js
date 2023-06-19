// tests for adminAuthRegister function
import { adminAuthRegister } from '../../src/auth.js'

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
            first: 'name-First\'s',
            last: 'name-Last\'s'
        },
    ])('valid input', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ authUserId: expect.any(Number) });
    });

});

describe ('test for errors for adminAuthRegister', () => {
    test.each([
        {
            name: 'empty email',
            email: '',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'invalid email',
            email: 'email',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'invalid email 2',
            email: 'email@gmail.com.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast'
        },
    ])('invalid email test', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty nameLast',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: ''
        },
        {
            name: 'invalid nameLast',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast$'
        },
        {
            name: 'invalid nameLast 2',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast1'
        },
        {
            name: 'nameLast too short',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'n'
        },
        {
            name: 'nameLast too long',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLastIsMoreThanTwenty'
        },
    ])('invalid nameLast tests', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty nameFirst',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: '',
            last: 'nameLast'
        },
        {
            name: 'invalid nameFirst',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst$',
            last: 'nameLast'
        },
        {
            name: 'invalid nameFirst 2',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirst$()',
            last: 'nameLast'
        },
        {
            name: 'nameFirst too short',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'n',
            last: 'nameLast'
        },
        {
            name: 'nameFirst too long',
            email: 'email2@gmail.com',
            pass: 'password1',
            first: 'nameFirstIsMoreThanTwenty',
            last: 'nameLast'
        },
    ])('invalid nameFirst tests', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ error: expect.any(String) });
    });

    test.each([
        {
            name: 'empty password',
            email: 'email2@gmail.com',
            pass: '',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'password too short',
            email: 'email2@gmail.com',
            pass: 'pass1',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'password must contain number',
            email: 'email2@gmail.com',
            pass: 'password',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            name: 'password must contain letter',
            email: 'email2@gmail.com',
            pass: '12345678',
            first: 'nameFirst',
            last: 'nameLast'
        },
    ])('invalid password tests', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ error: expect.any(String) });
    });

    test('email already used', () => {
        const user = adminAuthRegister('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
        expect(adminAuthRegister('email@gmail.com', 'password12', 'nameFirsts', 'nameLasts'));
    });
});




