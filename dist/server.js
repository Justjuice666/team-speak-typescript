"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showRooms = exports.getPort = exports.deleteRoom = exports.isRoot = exports.MyTCPServer = void 0;
const crypto_1 = require("crypto");
const net = require("net");
const fs_1 = require("fs");
class MyTCPServer {
    server;
    serverList;
    room;
    rollGame;
    constructor(port = 8080, roomName = '大厅') {
        this.serverList = [];
        this.room = {
            roomName: roomName,
            port: port,
            users: []
        };
        this.rollGame = {
            exist: false,
            isStarting: false,
            userNames: [],
            timeoutID1: -1,
            timeoutID2: -1
        };
        this.server = net.createServer((client) => {
            console.log(this.room.port + ' ' + this.room.roomName + ': ' + '客户端建立连接:', client.remoteAddress + ':' + client.remotePort);
            if (this.room.port === 8080) {
                // 大厅命令处理
                client.on('data', (chunk) => {
                    let code = '';
                    let param = '';
                    let content = chunk.toString();
                    code = content.split(' ')[0];
                    param = content.substring(code.length + 1);
                    switch (code) {
                        // 新建房间
                        case ('1'): {
                            if (this.serverListPush(param)) {
                                client.write('房间 ' + param + ' 创建成功');
                            }
                            else {
                                client.write('房间名字重复，创建失败');
                            }
                            break;
                        }
                        // 关闭服务器
                        case ('4'): {
                            this.server.close();
                            break;
                        }
                        // 用户进入房间
                        case ('5'): {
                            this.changeRoomInfo(client, true, param);
                            break;
                        }
                        case ('kill'): {
                            let userName = param.split(' ')[0];
                            let roomName = param.substring(userName.length + 1);
                            if (roomName === this.room.roomName) {
                                for (let i = 0; i < this.room.users.length; i++) {
                                    if (this.room.users[i][0] == userName) {
                                        this.room.users[i][1].write('kill');
                                        break;
                                    }
                                }
                            }
                            else {
                                for (let i = 0; i < this.serverList.length; i++) {
                                    if (this.serverList[i].room.roomName == roomName) {
                                        for (let j = 0; j < this.serverList[i].room.users.length; j++) {
                                            if (this.serverList[i].room.users[i][0] == userName) {
                                                this.serverList[i].room.users[i][1].write('kill');
                                                break;
                                            }
                                        }
                                        break;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    // console.log(content)
                });
            }
            else {
                // 房间命令处理
                client.on('data', (chunk) => {
                    let code = '';
                    let param = '';
                    let content = chunk.toString();
                    code = content.split(' ')[0];
                    param = content.substring(code.length + 1);
                    switch (code) {
                        // 用户发言处理
                        case ('say'): {
                            // console.log(param)
                            let param1 = param.split(' ')[0]; // 用户名
                            let param2 = param.substring(param1.length + 1); // 内容
                            this.broadcast(param1 + ':' + param2);
                            // param2 有@人时
                            if (param2.indexOf('@') !== -1) {
                                this.atSomeone(param2.substring(param2.indexOf('@') + 1));
                            }
                            break;
                        }
                        // roll点游戏
                        case ('roll'): {
                            if (this.rollGame.isStarting) {
                                this.cast('游戏已经开始', param);
                                break;
                            }
                            // 如果游戏存在
                            if (this.rollGame.exist) {
                                if (this.rollGame.userNames.indexOf(param) !== -1) {
                                    this.cast('你已经参加了该场游戏', param);
                                }
                                this.broadcast('@ ' + param + '加入了游戏');
                                clearTimeout(this.rollGame.timeoutID1);
                                clearTimeout(this.rollGame.timeoutID2);
                            }
                            else {
                                this.broadcast('@ ' + param + '开启了游戏');
                            }
                            this.rollGame.exist = true;
                            this.rollGame.userNames.push(param);
                            this.rollGame.timeoutID1 = setTimeout(() => {
                                this.broadcast('@ 游戏还有5秒开始');
                            }, 5000);
                            this.rollGame.timeoutID2 = setTimeout(() => {
                                this.startRollGame(1);
                            }, 10000);
                            break;
                        }
                        // 显示房间内的所有用户 list
                        case ('list'): {
                            let content = '';
                            for (let i = 0; i < this.room.users.length; i++) {
                                content += this.room.users[i][0] + ' ';
                            }
                            this.cast(content, param);
                            break;
                        }
                        // 用户进入房间
                        case ('5'): {
                            // console.log(param)
                            this.changeRoomInfo(client, true, param);
                            // 通知该用户进入房间
                            this.broadcast('用户 ' + param + ' 进入房间 ' + this.room.roomName);
                            break;
                        }
                        case ('kick'): {
                            let kickName = param.split(' ')[0];
                            let rootName = param.substring(kickName.length + 1);
                            // 判断是否是管理员
                            if (isRoot(rootName)) {
                                let kicClient = this.getClient(kickName);
                                // 判断房间内是否有该用户
                                if (kicClient === null) {
                                    this.cast('房间内没有此人', rootName);
                                }
                                else {
                                    kicClient.write('-');
                                    // 房间人数减少
                                    this.changeRoomInfo(kicClient, false);
                                    // kicClient.connect(8080)
                                }
                            }
                            break;
                        }
                    }
                });
            }
            client.on('end', () => {
                console.log(this.room.roomName + ' 收到客户端end');
                // 房间人数减少
                this.changeRoomInfo(client, false);
                if (this.room.port !== 8080)
                    setTimeout(() => {
                        if (this.room.users.length === 0)
                            this.server.close();
                    }, 10000);
            });
            client.on('error', () => {
                this.changeRoomInfo(client, false);
            });
        });
        // 绑定监听端口
        this.server.listen(this.room.port, () => {
            // 房间信息写入
            let rooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
            rooms['rooms'][rooms.rooms.length] = this.room;
            (0, fs_1.writeFileSync)('./rooms.json', JSON.stringify(rooms, null, 2), 'utf-8');
            console.log(this.room);
        });
        this.server.on('close', () => {
            console.log(this.room.roomName + ' 关闭');
            deleteRoom(this.room.roomName);
            for (const s of this.serverList)
                s.server.close();
        });
    }
    // 根据用户名获取该用户的Client
    getClient(userName) {
        for (let i = 0; i < this.room.users.length; i++) {
            if (this.room.users[i][0] === userName) {
                return this.room.users[i][1];
            }
        }
        return null;
    }
    startRollGame(currentTime) {
        // 游戏正在进行
        this.rollGame.isStarting = true;
        let nums = [];
        let maxNum = 0;
        let res = 0;
        let count = 0;
        for (let i = 0; i < this.rollGame.userNames.length; i++) {
            nums.push((0, crypto_1.randomInt)(1, 7));
            this.broadcast('@ ' + this.rollGame.userNames[i] + ' ' + nums[i]);
            if (nums[i] > maxNum) {
                maxNum = nums[i];
                count = 1;
                res = i;
            }
            else if (nums[i] === maxNum) {
                count++;
            }
        }
        // 唯一最高分出现 | 游戏已经进行了5轮还没出现胜利者
        if (count === 1 || currentTime === 5) {
            if (currentTime === 5) {
                this.broadcast('@ 没有最高分，游戏结束');
            }
            else {
                this.broadcast('@ 获胜者是' + this.rollGame.userNames[res]);
            }
            this.rollGame.exist = false;
            this.rollGame.isStarting = false;
            this.rollGame.userNames = [];
            this.rollGame.timeoutID1 = -1;
            this.rollGame.timeoutID2 = -1;
        }
        else {
            setTimeout(() => { this.startRollGame(currentTime + 1); }, 5000);
        }
    }
    // @某人 从给的字符串励寻找是否有人名
    atSomeone(s) {
        for (let i = 0; i < this.room.users.length; i++) {
            if (s.indexOf(this.room.users[i][0]) == 0) {
                this.room.users[i][1].write('@ 该消息提到了你');
                break;
            }
        }
    }
    // 更改房间信息 
    changeRoomInfo(client, isEnter, userName) {
        if (isEnter) {
            this.room.users.push([userName, client]);
        }
        else {
            for (let i = 0; i < this.room.users.length; i++) {
                if (this.room.users[i][1] == client) {
                    this.room.users.splice(i, 1);
                    break;
                }
            }
        }
        let currentRooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
        for (let i = 0; i < currentRooms['rooms'].length; i++) {
            if (currentRooms['rooms'][i].roomName === this.room.roomName) {
                currentRooms['rooms'][i].users = this.room.users;
                break;
            }
        }
        (0, fs_1.writeFileSync)('./rooms.json', JSON.stringify(currentRooms, null, 2), 'utf-8');
    }
    // 新建房间
    serverListPush(roomName) {
        // console.log(roomName)
        for (const s of this.serverList) {
            if (s.room.roomName === roomName) {
                return false;
            }
        }
        const newPort = this.randomPort();
        this.serverList.push(new MyTCPServer(newPort, roomName));
        return true;
    }
    // 随机端口号
    randomPort() {
        const res = (0, crypto_1.randomInt)(0, 65536);
        for (const s of this.serverList) {
            if (s.room.port === res) {
                return this.randomPort();
            }
        }
        if (res === 8080)
            return this.randomPort();
        return res;
    }
    // 单独发消息
    cast(content, userName) {
        for (let i = 0; i < this.room.users.length; i++) {
            if (this.room.users[i][0] == userName) {
                this.room.users[i][1].write('@ ' + content);
                break;
            }
        }
    }
    // 广播 信息
    broadcast(content) {
        console.log(this.room.roomName + ' 广播消息 ' + this.room.users.length + ' ' + content);
        let cleanup = [];
        for (let i = 0; i < this.room.users.length; i += 1) {
            if (this.room.users[i][1].writable) { // 先检查 sockets 是否可写
                this.room.users[i][1].write(content);
            }
            else {
                console.log('一个无效的客户端');
                cleanup.push(this.room.users[i]); // 如果不可写，收集起来销毁
                this.room.users[i][1].destroy();
            }
        }
        for (let i = 0; i < cleanup.length; i += 1) {
            console.log('删除无效的客户端:', cleanup[i][1].remoteAddress + ':' + cleanup[i][1].remotePort);
            this.room.users.splice(this.room.users.indexOf(cleanup[i]), 1);
        }
    }
    showUsers() {
        let rooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
        // let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
        for (let i = 0; i < rooms['rooms'].length; i++) {
            console.log(rooms['rooms'][i].roomName, rooms['rooms'][i].users.length);
        }
    }
}
exports.MyTCPServer = MyTCPServer;
// 是否是管理员
function isRoot(name) {
    let users = JSON.parse((0, fs_1.readFileSync)('./users.json', 'utf-8'));
    for (let i = 0; i < users['users'].length; i++) {
        if (users['users'][i].userName === name) {
            return users['users'][i].root;
        }
    }
    return false;
}
exports.isRoot = isRoot;
// 删除房间
function deleteRoom(roomName) {
    let currentRooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
    for (let i = 0; i < currentRooms['rooms'].length; i++) {
        if (currentRooms['rooms'][i].roomName === roomName) {
            currentRooms['rooms'].splice(currentRooms['rooms'].indexOf(currentRooms['rooms'][i]), 1);
        }
    }
    console.log(currentRooms);
    (0, fs_1.writeFileSync)('./rooms.json', JSON.stringify(currentRooms, null, 2), 'utf-8');
}
exports.deleteRoom = deleteRoom;
// 根据 房间名 获取 端口号
function getPort(roomName) {
    let currentRooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
    for (let i = 0; i < currentRooms['rooms'].length; i++) {
        if (currentRooms['rooms'][i].roomName === roomName) {
            return currentRooms['rooms'][i].port;
        }
    }
    return 8080;
}
exports.getPort = getPort;
// 显示所有房间 及 人数
function showRooms() {
    let rooms = JSON.parse((0, fs_1.readFileSync)('./rooms.json', 'utf-8'));
    // let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
    for (let i = 0; i < rooms['rooms'].length; i++) {
        console.log(rooms['rooms'][i].roomName, rooms['rooms'][i].users.length);
    }
}
exports.showRooms = showRooms;
//# sourceMappingURL=server.js.map