"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loading = void 0;
const fs_1 = require("fs");
const client_1 = require("./client");
const commonCode_1 = require("./commonCode");
function loading(client) {
    return new Promise(async (resolve) => {
        let userName = await client.getInput('账号:');
        let password = await client.getInput('密码:');
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
                    client_1.MyTCPClient.twiceLoading(userName, roomName);
                }
                setTimeout(() => {
                    console.log('\n成功登录');
                    client.userInit(userName, '大厅');
                    client.connectPort();
                    console.log('\nhelp (show commons)');
                    resolve(commonCode_1.commonCode.HallState);
                }, 1000);
            }
            else {
                console.log('\n---密码错误---');
                // 返回登录/注册/退出界面
                // start()
                resolve(commonCode_1.commonCode.Start);
            }
        }
        else {
            console.log('\n---不存在该用户名---');
            // 返回登录/注册/退出界面
            // start()
            resolve(commonCode_1.commonCode.Start);
        }
        // console.log('name', user.userName, 'password', user.password)
    });
}
exports.loading = loading;
//# sourceMappingURL=loading.js.map