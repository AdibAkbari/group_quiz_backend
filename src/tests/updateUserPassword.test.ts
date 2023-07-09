// tests for updateUserPasswordRequest function
import {
    authRegisterRequest,
    authLoginRequest,
    clearRequest,
    updateUserPasswordRequest,
  } from './testRoutes';
  
  const ERROR = { error: expect.any(String) };
  
  beforeEach(() => {
    clearRequest();
  });
  
  describe('Error Cases: updateUserDetails', () => {
    test('Old Password Incorrect', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      const update = updateUserPasswordRequest(user.token, 'password2', 'password3');
      expect(update.body).toStrictEqual(ERROR);
      expect(update.statusCode).toStrictEqual(400);
    });
  
    test('New Password Used Previously', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'NameFirst', 'NameLast').body;
      const update = updateUserPasswordRequest(user.token, 'password1', 'password2');
      const update2 = updateUserPasswordRequest(user.token, 'password2', 'password1');
      expect(update2.body).toStrictEqual(ERROR);
      expect(update2.statusCode).toStrictEqual(400);
    });
  
    test.each([
      {testName: 'empty new password', pass: ''},
      {testName: 'new password too short', pass: 'pass1'},
      {testName: 'new password must contain number', pass: 'password'},
      {testName: 'new password must contain letter', pass: '12345678'},
      ])('$testName: $pass', ({ pass }) => {
        const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
        const update = updateUserPasswordRequest(user.token, 'password1', pass);
        expect(update.statusCode).toBe(400);
        expect(update.body).toStrictEqual(ERROR);
      });

    test.each([
      {testName: 'token just letters', token: 'hello'},
      {testName: 'token starts with letters', token: 'a54364'},
      {testName: 'token ends with letters', token: '54356s'},
      {testName: 'token includes letter', token: '5436h86'},
      {testName: 'token has space', token: '4324 757'},
      {testName: 'token only whitespace', token: '  '},
      {testName: 'token has other characters', token: '6365,53'},
      {testName: 'empty string', token: ''},
      {testName: 'token has decimal point', token: '53.74'},
      {testName: 'token has negative sign', token: '-37294'},
      {testName: 'token has positive sign', token: '+38594'},
    ])('invalid token: $testName', ({token}) => {
			const update = updateUserPasswordRequest(token, 'password1', 'password2');
			expect(update.statusCode).toBe(401);
			expect(update.body).toStrictEqual(ERROR);
    });
  
    test('tokenId not logged in', () => {
      const update = updateUserPasswordRequest('12345', 'password1', 'password2');
      expect(update.statusCode).toBe(403);
      expect(update.body).toStrictEqual(ERROR);
    })
  });
  
  describe('Valid Inputs', () => {
    test('update password once', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const update = updateUserPasswordRequest(user.token, 'password1', 'password2');
      expect(update.statusCode).toBe(200);
      expect(update.body).toStrictEqual({ });
			const login = authLoginRequest('email@gmail.com', 'password1');
			expect(login.statusCode).toBe(400);
			expect(login.body).toStrictEqual(ERROR);
    });

		test('update password twice', () => {
      const user = authRegisterRequest('email@gmail.com', 'password1', 'nameFirst', 'nameLast').body;
      const update = updateUserPasswordRequest(user.token, 'password1', 'password2');
      expect(update.statusCode).toBe(200);
      expect(update.body).toStrictEqual({ });
			const update2 = updateUserPasswordRequest(user.token, 'password2', 'password3');
      expect(update2.statusCode).toBe(200);
      expect(update2.body).toStrictEqual({ });
			const login = authLoginRequest('email@gmail.com', 'password2');
			expect(login.statusCode).toBe(400);
			expect(login.body).toStrictEqual(ERROR);
    });
  });

