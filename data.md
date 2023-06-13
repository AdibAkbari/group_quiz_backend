```javascript
let data = {
    // TODO: insert your data structure that contains 
    // users + quizzes here
    users: [
        {
            uId: 1,
            nameFirst: 'Rani',
            nameLast: 'Jiang',
            email: 'ranivorous@gmail.com',
            password: 'chicken',
            numSuccessfulLogins: 3,
            numFailedPasswordsSinceLastLogin: 1,
        }
    ],
    quizzes: [
        {
            quizId: 1,
            questions: [
                {
                    question: 'What is 1 + 1?',
                    answer: '2',
                }
            ],
            creator: 'Rani',
            players: [
                {
                    uId: 9,
                    score: 2,
                }
            ],
            name: 'My Quiz',
            timeCreated: 1683125870,
            timeLastEdited: 1683125871,
            description: 'This is my quiz',
        }
    ],
}
```

[Optional] short description: 
