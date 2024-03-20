import { randomInt } from 'crypto';
import * as net from 'net'
import { readFileSync, writeFileSync } from "fs";
import { commonCode  } from '../commonCode';

type Room = {
    roomName: string
    port: number
    users: [string, net.Socket][]
}

type RollGame = {
    exist: boolean
    isStarting: boolean
    userNames: string[]
    timeoutID1: Object
    timeoutID2: Object
}

export class MyTCPServer {

    private server: net.Server

    private room: Room
    
    private serverList: MyTCPServer[] = []

    private rollGame: RollGame = {
        exist: false,
        isStarting: false,
        userNames: [],
        timeoutID1: -1,
        timeoutID2: -1
    }

    private roomCloseTimeoutID: Object = -1

    constructor(port: number = 8080, roomName: string = '大厅') {
        this.room= {
            roomName: roomName,
            port: port,
            users: []
        }
        this.server = net.createServer(this.serverConnectEvent.bind(this))
        this.initServer()
    }

    private initServer() {
        // 绑定监听端口
        this.server.listen(this.room.port, this.serverListenPortEvent.bind(this))
        // 监听服务器关闭
        this.server.on('close', this.serverCloseEvent.bind(this))
    }

    // 服务器监听断后事件
    private serverListenPortEvent() {
        // 房间信息写入
        let rooms = JSON.parse(readFileSync('./rooms.json', 'utf-8'))
        rooms['rooms'][rooms.rooms.length] = this.room
        writeFileSync('./rooms.json' , JSON.stringify(rooms, null, 2), 'utf-8')
        console.log(this.room)
    }

    private serverCloseEvent() {
        deleteRoom(this.room.roomName)
        for (const s of this.serverList) {
            s.server.close()
            // if (s.roomCloseTimeoutID !== -1) {
            //     clearTimeout(s.roomCloseTimeoutID as NodeJS.Timeout)
            // }
        }
    }

    // 服务器连接事件
    private serverConnectEvent(client: net.Socket) {
        console.log(this.room.port + ' ' + this.room.roomName + ': ' + '客户端建立连接:', client.remoteAddress + ':' + client.remotePort);
        // 监听客户端发来的消息
        if (this.room.port === 8080) 
            // 大厅命令处理
            this.serverHallStateCommon(client)
        else
            // 房间命令处理
            this.serverRoomStateCommon(client)

        // 监听客户端end
        client.on('end', this.clientEndEvent.bind(this, client))

        // 监听客户端报错
        client.on('error', this.clientErrorEvent.bind(this, client))
    }

    //  监听客户端end
    private clientEndEvent(client: net.Socket) {
        console.log(this.room.roomName + ' 收到客户端end');
        // 房间人数减少
        this.changeRoomInfo(client, false)
        // 如果房间内有人数减少 就10秒后检查是否为空房间 为空就关闭
        if (this.room.port !== 8080) {
            // 如果离上一个退出不到10秒，删除上一个10秒检测
            if (this.roomCloseTimeoutID !== -1) {
                clearTimeout(this.roomCloseTimeoutID as NodeJS.Timeout)
            }
            this.roomCloseTimeoutID = setTimeout(()=>{
                if (this.room.users.length === 0) 
                    this.server.close()
                this.roomCloseTimeoutID = -1
            }, 10000)
        }
    }

    // 监听客户端报错
    private clientErrorEvent(client: net.Socket) {
        // 房间人数减少
        console.log(this.room.roomName + ' 收到客户端error')
        this.changeRoomInfo(client, false)
        // 如果房间内有人数减少 就10秒后检查是否为空房间 为空就关闭
        if (this.room.port !== 8080) {
            // 如果离上一个退出不到10秒，删除上一个10秒检测
            if (this.roomCloseTimeoutID !== -1) {
                clearTimeout(this.roomCloseTimeoutID as NodeJS.Timeout)
            }
            this.roomCloseTimeoutID = setTimeout(()=>{
                if (this.room.users.length === 0) 
                    this.server.close()
                this.roomCloseTimeoutID = -1
            }, 10000)
        }
    }

    private serverHallStateCommon(client: net.Socket) {
        client.on('data', this.serverHallStateDataEvent.bind(this, client))
    }

    // 监听大厅内的命令事件
    private serverHallStateDataEvent(client: net.Socket, chunk: Buffer) {
        let code:string = ''
        let param:string = ''
        let content = chunk.toString();
        code = content.split(' ')[0]
        param = content.substring(code.length + 1)
        switch(code) {
            // 新建房间
            case(commonCode.NewRoom): {
                if (this.serverListPush(param)) {
                    client.write('房间 ' + param + ' 创建成功')
                    
                } else {
                    client.write('房间名字重复，创建失败')
                }
                break
            }
            // 关闭服务器
            case(commonCode.ShutDown): {
                this.server.close()
                break
            }
            // 用户进入房间
            case(commonCode.JoinInfo): {
                this.changeRoomInfo(client, true, param)
                break
            }
            case(commonCode.TwiceLoad): {
                let userName = param.split(' ')[0]
                let roomName = param.substring(userName.length + 1)
                if (roomName === this.room.roomName) {
                    for (let i=0; i<this.room.users.length; i++) {
                        if (this.room.users[i][0] == userName) {
                            this.room.users[i][1].write(commonCode.TwiceLoad)
                            break
                        }
                    }
                } else {
                    for (let i=0; i<this.serverList.length; i++) {
                        if (this.serverList[i].room.roomName == roomName) {
                            for (let j=0; j<this.serverList[i].room.users.length; j++) {
                                if (this.serverList[i].room.users[i][0] == userName) {
                                    this.serverList[i].room.users[i][1].write(commonCode.TwiceLoad)
                                    break
                                }
                            }
                            break
                        }
                    }

                }
                break
            }
        }
        // console.log(content)
    
    }

    private serverRoomStateCommon(client: net.Socket) {
        client.on('data', this.serverRoomStateDataEvent.bind(this, client))
    }

    // 监听房间内的命令事件
    private serverRoomStateDataEvent(client: net.Socket, chunk: Buffer) {
        let code:string = ''
        let param:string = ''
        let content = chunk.toString();
        code = content.split(' ')[0]
        param = content.substring(code.length + 1)
        switch(code) {
            // 用户发言处理
            case(commonCode.Say): {
                // console.log(param)
                let param1:string = param.split(' ')[0] // 用户名
                let param2:string = param.substring(param1.length + 1)  // 内容
                this.broadcast(param1 + ':' + param2)
                // param2 有@人时
                if (param2.indexOf('@') !== -1) {
                    // @某人 从给的字符串励寻找是否有人名
                    let s = param2.substring(param2.indexOf('@') + 1)
                    for (let i=0; i<this.room.users.length; i++) {
                        if (s.indexOf(this.room.users[i][0]) == 0) {
                            // this.cast(commonCode.At + ' 该消息提到了你', this.room.users[i][0])
                            this.room.users[i][1].write(commonCode.At + ' 该消息提到了你')
                            break
                        }
                    }
                }
                break
            }
            // roll点游戏
            case(commonCode.Roll): {
                if (this.rollGame.isStarting) {
                    this.cast('游戏已经开始', param)
                    break
                }
                // 如果游戏存在
                if (this.rollGame.exist) {
                    if (this.rollGame.userNames.indexOf(param) !== -1) {
                        this.cast('你已经参加了该场游戏', param)
                    } else {
                        this.broadcast(commonCode.At + ' ' + param + '加入了游戏')
                        clearTimeout(this.rollGame.timeoutID1 as NodeJS.Timeout)
                        clearTimeout(this.rollGame.timeoutID2 as NodeJS.Timeout)
                    }
                }  else {
                    this.broadcast(commonCode.At + ' ' + param + '开启了游戏')
                }
                this.rollGame.exist = true;
                this.rollGame.userNames.push(param)
                this.rollGame.timeoutID1 = setTimeout(() => {
                    this.broadcast(commonCode.At + ' 游戏还有5秒开始')
                }, 5000)
                this.rollGame.timeoutID2 = setTimeout(() => {
                    this.startRollGame(1)
                }, 10000)
                break
            }
            // 显示房间内的所有用户 list
            case(commonCode.List): {
                let content: string = ''
                for (let i=0; i < this.room.users.length; i++) {
                    content += this.room.users[i][0] + ' '
                }
                this.cast(content, param)
                break
            }
            // 用户进入房间
            case(commonCode.JoinInfo): {
                // console.log(param)
                this.changeRoomInfo(client, true, param)
                // 通知该用户进入房间
                this.broadcast('用户 ' + param + ' 进入房间 ' + this.room.roomName)
                break
            }
            case(commonCode.Kick): {
                let kickName = param.split(' ')[0]
                let rootName = param.substring(kickName.length+1)
                // 判断是否是管理员
                if (isRoot(rootName)) {
                    let kicClient = this.getClient(kickName)
                    // 判断房间内是否有该用户
                    if (kicClient === null) {
                        this.cast('房间内没有此人', rootName)
                    } else {
                        kicClient.write(commonCode.Kick)
                        // 房间人数减少
                        this.changeRoomInfo(kicClient, false)
                        // kicClient.connect(8080)
                    }
                }
                break
            }
        }
    }

    // 根据用户名获取该用户的Client
    private getClient(userName: string) {
        for(let i=0; i<this.room.users.length; i++) {
            if (this.room.users[i][0] === userName) {
                return this.room.users[i][1]
            }
        }
        return null
    }

    private startRollGame(currentTime: number) {
        // 游戏正在进行
        this.rollGame.isStarting = true

        let nums: number[] = []
        let maxNum = 0;
        let res = 0;
        let count = 0;
        for (let i=0; i<this.rollGame.userNames.length; i++) {
            nums.push(randomInt(1, 7))
            this.broadcast(commonCode.At + ' ' + this.rollGame.userNames[i] + ' ' + nums[i])
            if (nums[i] > maxNum) {
                maxNum = nums[i]
                count = 1
                res = i
            } else if (nums[i] === maxNum) {
                count++;
            }
        }
        // 唯一最高分出现 | 游戏已经进行了5轮还没出现胜利者
        if (count === 1 || currentTime === 5) {
            if (currentTime === 5) {
                this.broadcast(commonCode.At + ' 没有最高分，游戏结束')
            } else {
                this.broadcast(commonCode.At + ' 获胜者是' + this.rollGame.userNames[res])
            }
            this.rollGame.exist = false
            this.rollGame.isStarting = false
            this.rollGame.userNames = []
            this.rollGame.timeoutID1 = -1
            this.rollGame.timeoutID2 = -1
        } else {
            setTimeout(()=>{this.startRollGame(currentTime + 1)}, 5000)
        }
    }

    // 更改房间信息 
    private changeRoomInfo(client: net.Socket, isEnter: boolean, userName?: string) {
        if (isEnter) {
            this.room.users.push([userName!, client])
        }
        else {
            for (let i=0; i<this.room.users.length; i++) {
                if (this.room.users[i][1] == client) {
                    this.room.users.splice(i, 1)
                    break
                }
            }
        }
        
        let currentRooms = JSON.parse(readFileSync('./rooms.json', 'utf-8'))
        for (let i=0; i<currentRooms['rooms'].length; i++) {
            if (currentRooms['rooms'][i].roomName === this.room.roomName) {
                currentRooms['rooms'][i].users = this.room.users
                break
            }
        }
        writeFileSync('./rooms.json' , JSON.stringify(currentRooms, null, 2), 'utf-8')
    }

    // 新建房间
    private serverListPush(roomName: string) {
        // 检查是否有失效的房间
        let cleanup = []
        for (let i=0; i<this.serverList.length; i++) {
        console.log('1')
        if (this.serverList[i].server.listening === false) {
                cleanup.push(this.serverList[i])
            }
        }
        for (let i=0; i<cleanup.length; i++) {
                console.log('删除无效的服务端:', cleanup[i].room.roomName, cleanup[i].room.port);
                this.serverList.splice(this.serverList.indexOf(cleanup[i]), 1);
            }
        // console.log(roomName)
        for (const s of this.serverList) {
            if (s.room.roomName === roomName) {
                return false
            }
        }
        const newPort = this.randomPort()
        this.serverList.push(new MyTCPServer(newPort, roomName))
        return true
    }

    // 随机端口号
    private randomPort(): number {
        const res = randomInt(0, 65536)
        for (const s of this.serverList) {
            if (s.room.port === res) {
                return this.randomPort()
            }
        }
        if (res === 8080)
            return this.randomPort()
        return res
    }

    // 单独发消息
    private cast(content:string, userName: string) {
        for (let i=0; i<this.room.users.length; i++) {
            if (this.room.users[i][0] == userName) {
                this.room.users[i][1].write(commonCode.At + ' ' + content)
                break
            }
        }
    }

    // 广播 信息
    private broadcast(content: string) {
        console.log(this.room.roomName + ' 广播消息 ' + this.room.users.length + ' ' + content);
        let cleanup: [string, net.Socket][] = []
        for (let i=0;i<this.room.users.length;i+=1) {
            if (this.room.users[i][1].writable) { // 先检查 sockets 是否可写
                this.room.users[i][1].write(content);
            } else {
                console.log('一个无效的客户端');
                cleanup.push(this.room.users[i]); // 如果不可写，收集起来销毁
                this.room.users[i][1].destroy();
            }
        }
        for (let i=0; i<cleanup.length; i+=1) {
            console.log('删除无效的客户端:', cleanup[i][1].remoteAddress + ':' + cleanup[i][1].remotePort);
            this.room.users.splice(this.room.users.indexOf(cleanup[i]), 1);
        }
    }
}

// 是否是管理员
function isRoot(name: string): boolean { 
    let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
    for (let i=0; i<users['users'].length; i++) {
        if (users['users'][i].userName === name) {
            return users['users'][i].root
        }
    }
    return false
}

// 删除房间
function deleteRoom(roomName: string) {
    let currentRooms = JSON.parse(readFileSync('./rooms.json', 'utf-8'))
    let cleanup = []
    for (let i=0; i<currentRooms['rooms'].length; i++) {
        if (currentRooms['rooms'][i].roomName === roomName) {
            cleanup.push(currentRooms['rooms'][i])
        }
    }
    for (let i=0; i<cleanup.length; i+=1) {
        console.log(cleanup[i].roomName + ' 关闭');
        currentRooms['rooms'].splice(currentRooms['rooms'].indexOf(cleanup[i]), 1);
    }
    console.log(currentRooms)
    writeFileSync('./rooms.json' , JSON.stringify(currentRooms, null, 2), 'utf-8')
}

// 根据 房间名 获取 端口号
export function getPort(roomName: string): number {
    let currentRooms = JSON.parse(readFileSync('./rooms.json', 'utf-8'))
    for (let i=0; i<currentRooms['rooms'].length; i++) {
        if (currentRooms['rooms'][i].roomName === roomName) {
            return currentRooms['rooms'][i].port
        }
    }
    return 8080
}

// 显示所有房间 及 人数
export function showRooms() {
    let rooms = JSON.parse(readFileSync('./rooms.json', 'utf-8'))
    // let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
    for (let i=0; i<rooms['rooms'].length; i++) {
        console.log(rooms['rooms'][i].roomName, rooms['rooms'][i].users.length)
    }
}
