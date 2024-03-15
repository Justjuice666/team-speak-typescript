"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loading = void 0;
const readline = require("readline");
const fs_1 = require("fs");
const client_1 = require("./client");
const net_1 = require("net");
function loading() {
    let userName;
    let password;
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.prompt();
    rl.question('账号:\n', function (input) {
        userName = input;
        rl.question('密码:\n', function (input) {
            password = input;
            rl.close();
        });
    });
    rl.on('close', () => {
        // 读取 './users.json' 文件 并格式化为JSON对象
        let newUsers = JSON.parse((0, fs_1.readFileSync)('./users.json', 'utf-8'));
        // 判断用户名是否存在
        let isUserName = false;
        // 密码是否正确
        let isSamePassword = false;
        // 用户是否已经登录
        let roomName = '';
        for (const u of newUsers['users']) {
            if (u.userName === userName) {
                isUserName = true;
                if (u.password === password)
                    isSamePassword = true;
                if (u.online)
                    roomName = u.roomName;
                break;
            }
        }
        if (isUserName) {
            if (isSamePassword) {
                /*
                    连接服务器
                */
                // 在线 挤掉 短连接
                if (roomName !== '') {
                    let s = new net_1.Socket();
                    s.connect(8080);
                    s.write('kill ' + userName + ' ' + roomName);
                    // console.log('kill')
                    s.end();
                }
                setTimeout(() => {
                    console.log('成功登录');
                    const client = new client_1.MyTCPClient(userName, '大厅');
                    client.connectPort();
                }, 1000);
            }
            else {
                console.log('---密码错误，重新输入---');
                loading();
            }
        }
        else {
            console.log('---不存在该用户名，重新输入---');
            loading();
        }
        // console.log('name', user.userName, 'password', user.password)
    });
}
exports.loading = loading;
//# sourceMappingURL=loading.js.map