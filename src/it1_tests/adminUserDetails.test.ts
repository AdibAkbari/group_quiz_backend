
import {
  adminUserDetailsRequest,
  authRegisterRequest,
  authLoginRequest,
  clearRequest
} from './testRoutes';


const ERROR = { error: expect.any(String) };

interface Token {
  token: string
}


beforeEach(() => {
  clearRequest();
});

describe('Token invalid', () => {
  
  test('Token just letters', () => {
    const details = adminUserDetailsRequest('hello');
    expect(details.body).toStrictEqual(ERROR);
    expect(details.statusCode).toStrictEqual(401);
  });

  test('Token includes letters', () => {
    const details = adminUserDetailsRequest('38eha');
    expect(details.body).toStrictEqual(ERROR);
    expect(details.statusCode).toStrictEqual(401);
  });

  test('Nobody logged in', () => {
    const userDetails = adminUserDetailsRequest("7");
    expect(userDetails.body).toStrictEqual(ERROR);
    expect(userDetails.statusCode).toStrictEqual(403);
  });

  test('TokenId not logged in', () => {
    const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast');
    const userDetails = adminUserDetailsRequest(user.token + 1)
    expect(userDetails.body).toStrictEqual(ERROR);
    expect(userDetails.statusCode).toStrictEqual(403);
  });

});

describe('Only one user registered', () => {
  let user: Token;
  beforeEach(() => {
    user = authRegisterRequest('email@gmail.com', 'password1', 'Firstname', 'Lastname');
  });

  test('Just registered', () => {
    const userDetails = adminUserDetailsRequest(user.token);
    expect(adminUserDetailsRequest(userDetails.body)).toStrictEqual({
      user: {
        userId: user.token,
        name: 'Firstname Lastname',
        email: 'email@gmail.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(userDetails.statusCode).toStrictEqual(200);
  });

  test('Registered and logged in', () => {
    authLoginRequest('email@gmail.com', 'password1');
    const userDetails = adminUserDetailsRequest(user.token);
    expect(adminUserDetailsRequest(userDetails.body)).toStrictEqual({
      user: {
        userId: user.token,
        name: 'Firstname Lastname',
        email: 'email@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(userDetails.statusCode).toStrictEqual(200);
  });

  test('Failed password attempt', () => {
    authLoginRequest('email@gmail.com', 'password2');
    const userDetails = adminUserDetailsRequest(user.token);
    expect(adminUserDetailsRequest(userDetails.body)).toStrictEqual({
      user: {
        userId: user.token,
        name: 'Firstname Lastname',
        email: 'email@gmail.com',
        numSuccessfulLogins: 2,
        numFailedPasswordsSinceLastLogin: 0
      }
    });
    expect(userDetails.statusCode).toStrictEqual(200);
  });
});

describe('multiple users registered', () => {
  let user1: Token;
  let user2: Token;
  let user3: Token;
  beforeEach(() => {
    user1 = authRegisterRequest('email1@gmail.com', 'password1', 'FirstnameA', 'LastnameA');
    user2 = authRegisterRequest('email2@gmail.com', 'password2', 'FirstnameB', 'LastnameB');
    user3 = authRegisterRequest('email3@gmail.com', 'password3', 'FirstnameC', 'LastnameC');
  });

  test('Finding user 1', () => {
    const userDetails1 = adminUserDetailsRequest(user1.token);
    expect(userDetails1.body).toStrictEqual({
      user: {
        userId: user1.token,
        name: 'FirstnameA LastnameA',
        email: 'email1@gmail.com',
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number)
      }
    });
    expect(userDetails1.statusCode).toStrictEqual(200);
  });

  test('Finding user 2', () => {
    const userDetails2 = adminUserDetailsRequest(user2.token)
    expect(userDetails2.body).toStrictEqual({
      user: {
        userId: user2.token,
        name: 'FirstnameB LastnameB',
        email: 'email2@gmail.com',
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number)
      }
    });
    expect(userDetails2.statusCode).toStrictEqual(200);
  });

  test('Finding user 3', () => {
    expect(adminUserDetailsRequest(user3.token).body).toStrictEqual({
      user: {
        userId: user3.token,
        name: 'FirstnameC LastnameC',
        email: 'email3@gmail.com',
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number)
      }
    });
  });
});
