"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const readline = require("readline");
const fs_1 = require("fs");
function register() {
    let user = {
        userName: '',
        password: '',
        online: false,
        roomName: '',
        root: false
    };
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let secondPassword = '';
    rl.prompt();
    rl.question('账号:\n', function (input) {
        user.userName = input;
        rl.question('密码:\n', function (input) {
            user.password = input;
            rl.question('确认密码:\n', function (input) {
                secondPassword = input;
                rl.close();
            });
        });
    });
    rl.on('close', () => {
        // console.log('name', user.userName, 'password', user.password)
        // 判断前后密码是否一致
        if (user.password === secondPassword) {
            // 读取 './users.json' 文件 并格式化为JSON对象
            let newUsers = JSON.parse((0, fs_1.readFileSync)('./users.json', 'utf-8'));
            // 判断是否有重名
            let isNotSameName = true;
            for (const u of newUsers['users']) {
                if (u.userName === user.userName) {
                    isNotSameName = false;
                    break;
                }
            }
            if (isNotSameName) {
                // 保存为 ./users.json 文件
                newUsers['users'][newUsers.users.length] = user;
                (0, fs_1.writeFileSync)('./users.json', JSON.stringify(newUsers, null, 2), 'utf-8');
                console.log('注册成功');
                // console.log(newUsers)
            }
            else {
                console.log('---重名，重新输入---');
                register();
            }
        }
        else {
            console.log('---前后密码不一致，重新输入---');
            register();
        }
    });
}
exports.register = register;
//# sourceMappingURL=register.js.map