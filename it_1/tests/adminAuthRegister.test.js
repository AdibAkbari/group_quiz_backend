// tests for adminAuthRegister function
import { adminAuthRegister } from './auth.js'

describe ('test for adminAuthRegister', () => {
    test.each([
        {name: 'adminAuthRegister valid input', input: ('email@gmail.com', 'password','firstName', 'lastName'), output: 1 }
    ])

})
