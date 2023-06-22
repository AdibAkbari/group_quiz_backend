// tests for adminAuthRegister function
import { adminAuthRegister } from '../auth.js'
import { clear } from '../other.js'

beforeEach(() => {
    clear();
  });

const ERROR = { error: expect.any(String) };

describe ('test for valid input for adminAuthRegister', () => {
    test.each([
        {
            testName: 'valid input',
            email: 'email@gmail.com',
            pass: 'password1',
            first: 'nameFirst',
            last: 'nameLast'
        },
        {
            testName: 'valid input 2',
            email: 'email3@hotmail.com',
            pass: 'passw123',
            first: 'na',
            last: 'na'
        },
        {
            testName: 'valid input 3',
            email: 'email4@yahoo.com',
            pass: 'longPassword12345',
            first: 'nameIsExactlyTwentyy',
            last: 'lastIsExactlyTwentyy'
        },
        {
            testName: 'valid input 4',
            email: 'email5@gmail.com',
            pass: 'password1',
            first: 'name- First\'s',
            last: 'name- Last\'s'
        },
    ])('$testName', ({email, pass, first, last}) => {
        expect(adminAuthRegister(email, pass, first, last)).toStrictEqual({ authUserId: expect.any(Number) });
    });

});

describe ('test for errors for adminAuthRegister', () => {
    test.each([
        {
            testName: 'empty email',
            email: ''
        },
        {
            testName: 'invalid email',
            email: 'email'
        },
    ])('$testName: $email', ({email}) => {
        expect(adminAuthRegister(email, 'password1', 'nameFirst', 'nameLast')).toStrictEqual(ERROR);
    });

    test.each([
        {
            testName: 'empty nameLast',
            last: ''
        },
        {
            testName: 'invalid nameLast',
            last: 'nameLast$'
        },
        {
            testName: 'invalid nameLast 2',
            last: 'nameLast1'
        },
        {
            testName: 'nameLast too short',
            last: 'n'
        },
        {
            testName: 'nameLast too long',
            last: 'nameLastIsMoreThanTwenty'
        },
        {
            testName: 'nameLast whitespace',
            last: '    '
        },
    ])('$testName: $last', ({last}) => {
        expect(adminAuthRegister('email2@gmail.com', 'password1', 'nameFirst', last)).toStrictEqual(ERROR);
    });

    test.each([
        {
            testName: 'empty nameFirst',
            first: ''
        },
        {
            testName: 'invalid nameFirst',
            first: 'nameFirst$'
        },
        {
            testName: 'invalid nameFirst 2',
            first: 'nameFirst$()1'
        },
        {
            testName: 'nameFirst too short',
            first: 'n'
        },
        {
            testName: 'nameFirst too long',
            first: 'nameFirstIsMoreThanTwenty'
        },
        {
            testName: 'nameFirst whitespace',
            first: '    '
        },
    ])('$testName: $first', ({first}) => {
        expect(adminAuthRegister('email2@gmail.com', 'password1', first, 'nameLast')).toStrictEqual(ERROR);
    });

    test.each([
        {
            testName: 'empty password',
            pass: ''
        },
        {
            testName: 'password too short',
            pass: 'pass1'
        },
        {
            testName: 'password must contain number',
            pass: 'password'
        },
        {
            testName: 'password must contain letter',
            pass: '12345678'
        },
    ])('$testName: $pass', ({pass}) => {
        expect(adminAuthRegister('email2@gmail.com', pass, 'nameFirst', 'nameLast')).toStrictEqual(ERROR);
    });

    test('email already used', () => {
        const user = adminAuthRegister('email@gmail.com', 'password1', 'nameFirst', 'nameLast');
        expect(adminAuthRegister('email@gmail.com', 'password12', 'nameFirsts', 'nameLasts')).toStrictEqual(ERROR);
    });
});




