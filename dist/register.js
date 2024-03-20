"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = void 0;
const commonCode_1 = require("./commonCode");
const fs_1 = require("fs");
function register(client) {
    return new Promise(async (resolve) => {
        let userName = await client.getInput('账号:');
        let password = await client.getInput('密码:');
        let secondPassword = await client.getInput('确认密码:');
        // 判断前后密码是否一致
        if (password === secondPassword) {
            // 读取 './users.json' 文件 并格式化为JSON对象
            let newUsers = JSON.parse((0, fs_1.readFileSync)('./users.json', 'utf-8'));
            // 判断是否有重名
            let isNotSameName = true;
            for (const u of newUsers['users']) {
                if (u.userName === userName) {
                    isNotSameName = false;
                    break;
                }
            }
            if (isNotSameName) {
                // 保存为 ./users.json 文件
                let user = {
                    userName: userName,
                    password: password,
                    online: false,
                    roomName: '',
                    root: false
                };
                newUsers['users'][newUsers.users.length] = user;
                (0, fs_1.writeFileSync)('./users.json', JSON.stringify(newUsers, null, 2), 'utf-8');
                console.log('\n注册成功');
            }
            else {
                console.log('\n---重名---');
            }
        }
        else {
            console.log('\n---前后密码不一致---');
        }
        // 返回登录/注册/退出界面
        resolve(commonCode_1.commonCode.Start);
    });
}
exports.register = register;
//# sourceMappingURL=register.js.map