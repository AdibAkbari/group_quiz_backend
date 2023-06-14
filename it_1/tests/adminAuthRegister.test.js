// tests for adminAuthRegister function
import { adminAuthRegister } from '../../src/auth.js'

describe ('test for adminAuthRegister', () => {
    test.each([
        {
            name: 'adminAuthRegister: valid input',
            input: ('email@gmail.com', 'password1','nameFirst', 'nameLast'),
            output: 1 
        },
        {
            name: 'adminAuthRegister: email already used',
            input: ('email@gmail.com', 'password1', 'nameFirst', 'nameLast'),
            output: {error: 'Email address is used by another user'}
        },
        {
            name: 'adminAuthRegister: invalid email',
            input: ('email', 'password1', 'nameFirst', 'nameLast'),
            output: {error: 'Email is invalid'}
        },
        {
            name: 'adminAuthRegister: invalid nameFirst',
            input: ('email2@gmail.com', 'password1', 'nameFirst$', 'nameLast'),
            output: {error: 'Invalid first name'}
        },
        {
            name: 'adminAuthRegister: nameFirst too short',
            input: ('email2@gmail.com', 'password1', 'n', 'nameLast'),
            output: {error: 'First name must be between 2 and 20 characters'}
        },
        {
            name: 'adminAuthRegister: nameFirst too long',
            input: ('email2@gmail.com', 'password1', 'nameFirstIsMoreThanTwenty', 'nameLast'),
            output: {error: 'First name must be between 2 and 20 characters'}
        },
        {
            name: 'adminAuthRegister: invalid nameLast',
            input: ('email2@gmail.com', 'password1', 'nameFirst', 'nameLast$'),
            output: {error: 'Invalid last name'}
        },
        {
            name: 'adminAuthRegister: nameLast too short',
            input: ('email2@gmail.com', 'password1', 'nameLast', 'n'),
            output: {error: 'Last name must be between 2 and 20 characters'}
        },
        {
            name: 'adminAuthRegister: nameLast too long',
            input: ('email2@gmail.com', 'password1', 'nameFirst', 'nameLastIsMoreThanTwenty'),
            output: {error: 'Last name must be between 2 and 20 characters'}
        },
        {
            name: 'adminAuthRegister: password too short',
            input: ('email2@gmail.com', 'pass1', 'nameFirst', 'nameLast'),
            output: {error: 'Password must be at least 8 characters'}
        },
        {
            name: 'adminAuthRegister: password must contain number and letter',
            input: ('email2@gmail.com', 'password', 'nameFirst', 'nameLast'),
            output: {error: 'Password must contain at least one number and one letter'}
        },
    ])('adminAuthRegister edge case testing', ({input,output}) => {
        expect(adminAuthRegister(input)).toBe(output);
    });

});
