"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyTCPClient = void 0;
const net = require("net");
const readline = require("readline");
const fs_1 = require("fs");
const commonCode_1 = require("./commonCode");
class MyTCPClient {
    // 用户信息 {名字，所在房间名}
    user;
    // 用户的Socket
    client;
    // 用户的界面状态
    state = commonCode_1.commonCode.HallState;
    // 聊天记录
    textLines = [];
    // 读取流
    rl;
    constructor() {
        this.user = {
            userName: '',
            roomName: ''
        };
        this.client = new net.Socket();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    userInit(userName, roomName) {
        this.user = {
            userName: userName,
            roomName: roomName
        };
    }
    // 连接端口
    connectPort(port = 8080, roonName = '大厅') {
        // 如果已经连接端口，那么断开
        if (this.client.connecting === false) {
            this.client.end();
            this.client = new net.Socket();
        }
        this.client.connect(port);
        this.user.roomName = roonName;
        // 更改用户显示界面
        if (port === 8080) {
            this.state = commonCode_1.commonCode.HallState;
        }
        else {
            this.state = commonCode_1.commonCode.RoomState;
        }
        this.changeUserInfo(true);
        this.clientOnData(port);
        // 发送指令，告诉该端口自己的信息
        this.writeCommonCode(commonCode_1.commonCode.JoinInfo, this.user.userName);
    }
    isRoomState() {
        return this.state === commonCode_1.commonCode.RoomState;
    }
    isHallState() {
        return this.state === commonCode_1.commonCode.HallState;
    }
    getState() {
        return this.state;
    }
    getInput(question = '') {
        return new Promise((resolve) => {
            if (question !== '')
                console.log(question);
            this.rl.once('line', this.rlLineEvent.bind(this, resolve));
        });
    }
    rlLineEvent(resolve, input) {
        resolve(input);
    }
    // 写入处理
    writeText(text) {
        let code = text.split(' ')[0];
        let param = text.substring(code.length + 1);
        switch (code) {
            // 新建房间
            case (commonCode_1.commonCode.NewRoom): {
                this.writeCommonCode(code, param);
                this.user.roomName = param;
                break;
            }
            // 关闭服务器
            case (commonCode_1.commonCode.ShutDown): {
                this.writeCommonCode(code);
                break;
            }
            // 发言 say text
            case (commonCode_1.commonCode.Say): {
                this.writeCommonCode(code, this.user.userName + ' ' + param);
                break;
            }
            // 回复 reply line text
            case (commonCode_1.commonCode.Reply): {
                let lineString = param.split(' ')[0];
                let line = Number(lineString);
                if (!isNaN(line) && line >= 1 && line <= this.textLines.length) {
                    let text = param.substring(lineString.length + 1);
                    this.writeCommonCode(commonCode_1.commonCode.Say, this.user.userName + ' @' +
                        this.textLines[line - 1] + ' | ' + text);
                }
                break;
            }
            // roll点游戏 roll
            case (commonCode_1.commonCode.Roll): {
                this.writeCommonCode(code, this.user.userName);
                break;
            }
            // 显示房间内的所有用户 list
            case (commonCode_1.commonCode.List): {
                this.writeCommonCode(code, this.user.userName);
                break;
            }
            case (commonCode_1.commonCode.Kick): {
                this.writeCommonCode(code, param + ' ' + this.user.userName);
                break;
            }
        }
    }
    closeRl() {
        this.rl.close();
    }
    // 断开连接
    close() {
        this.client.end();
        this.changeUserInfo(false);
    }
    clientHallStateDataEvent(chunk) {
        let content = chunk.toString();
        let code = content.split(' ')[0];
        switch (code) {
            case (commonCode_1.commonCode.TwiceLoad): {
                console.log('\n---您在另一个地方登录---');
                this.close();
                process.exit(0);
                break;
            }
            default: {
                console.log('\n系统消息:' + content);
            }
        }
    }
    clientRoomStateDataEvent(chunk) {
        let content = chunk.toString();
        let code = content.split(' ')[0];
        switch (code) {
            // @消息
            case (commonCode_1.commonCode.At): {
                console.log('---' + content.substring(2));
                break;
            }
            // 被踢
            case (commonCode_1.commonCode.Kick): {
                console.log('\n---你被踢出房间---');
                this.connectPort();
                break;
            }
            // 被二次登录
            case (commonCode_1.commonCode.TwiceLoad): {
                console.log('\n---您在另一个地方登录---');
                this.close();
                process.exit(0);
                break;
            }
            default: {
                this.textLines.push(content);
                console.log(this.textLines.length + ' ' + this.textLines[this.textLines.length - 1]);
            }
        }
    }
    // 注册监听消息事件
    clientOnData(port) {
        if (port === 8080) {
            // 大厅命令处理
            this.client.on('data', this.clientHallStateDataEvent.bind(this));
        }
        else {
            // 房间命令处理
            this.textLines = [];
            this.client.on('data', this.clientRoomStateDataEvent.bind(this));
        }
    }
    writeCommonCode(code, content) {
        this.client.write(code + ' ' + content);
    }
    // 更改用户信息 在线、房间
    changeUserInfo(online) {
        let users = JSON.parse((0, fs_1.readFileSync)('./users.json', 'utf-8'));
        for (let i = 0; i < users['users'].length; i++) {
            if (users['users'][i].userName === this.user.userName) {
                if (online) {
                    users['users'][i].online = true;
                    users['users'][i].roomName = this.user.roomName;
                }
                else {
                    users['users'][i].online = false;
                    users['users'][i].roomName = '';
                }
                break;
            }
        }
        (0, fs_1.writeFileSync)('./users.json', JSON.stringify(users, null, 2), 'utf-8');
    }
    // 挤下线
    static twiceLoading(userName, roomName) {
        let s = new net.Socket();
        s.connect(8080);
        s.write(commonCode_1.commonCode.TwiceLoad + ' ' + userName + ' ' + roomName);
        s.end();
    }
}
exports.MyTCPClient = MyTCPClient;
//# sourceMappingURL=client.js.map