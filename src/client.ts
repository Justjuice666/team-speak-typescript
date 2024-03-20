import * as net from 'net'
import * as readline from "readline";
import { readFileSync, writeFileSync } from "fs";
import { commonCode  } from './commonCode';

export class MyTCPClient {
    // 用户信息 {名字，所在房间名}
    private user: {
        userName: string
        roomName: string
    }
    // 用户的Socket
    private client: net.Socket
    // 用户的界面状态
    private state: commonCode.HallState | commonCode.RoomState = commonCode.HallState
    // 聊天记录
    private textLines: string[] = []
     // 读取流
    private rl: readline.Interface
    constructor() {
        this.user = {
            userName: '',
            roomName: ''
        }
        this.client = new net.Socket();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    userInit(userName: string, roomName: string) {
        this.user = {
            userName: userName,
            roomName: roomName
        }
    }

    // 连接端口
    connectPort(port: number = 8080, roonName: string = '大厅') {
        // 如果已经连接端口，那么断开
        if (this.client.connecting === false) {
            this.client.end()
            this.client = new net.Socket();
        }
        this.client.connect(port);
        this.user.roomName = roonName

        // 更改用户显示界面
        if (port === 8080) {
            this.state = commonCode.HallState
        } else {
            this.state = commonCode.RoomState
        }

        this.changeUserInfo(true)
        
        this.clientOnData(port)
        
        // 发送指令，告诉该端口自己的信息
        this.writeCommonCode(commonCode.JoinInfo, this.user.userName)
    }

    isRoomState() {
        return this.state === commonCode.RoomState
    }

    isHallState() {
        return this.state === commonCode.HallState
    }

    getState() {
        return this.state
    }

    getInput(question: string = '') {
        return new Promise((resolve) => {
            if (question !== '')
                console.log(question)
            this.rl.once('line', this.rlLineEvent.bind(this, resolve))
        }) 
    }

    private rlLineEvent(resolve: (value: unknown) => void, input: string) {
        resolve(input)
    }

    // 写入处理
    writeText(text: string) {
        let code = text.split(' ')[0]
        let param = text.substring(code.length + 1)
        switch(code) {
            // 新建房间
            case(commonCode.NewRoom): {
                this.writeCommonCode(code, param)
                this.user.roomName = param
                break
            }
            // 关闭服务器
            case(commonCode.ShutDown): {
                this.writeCommonCode(code)
                break
            }
            // 发言 say text
            case(commonCode.Say): {
                this.writeCommonCode(code, this.user.userName + ' ' + param)
                break
            }
            // 回复 reply line text
            case(commonCode.Reply): {
                let lineString = param.split(' ')[0]
                let line = Number(lineString)
                if (!isNaN(line) && line >= 1 && line <= this.textLines.length) {
                    let text = param.substring(lineString.length + 1)
                    this.writeCommonCode(commonCode.Say, this.user.userName + ' @' + 
                    this.textLines[line-1] + ' | ' + text)
                }
                break
            }
            // roll点游戏 roll
            case(commonCode.Roll): {
                this.writeCommonCode(code, this.user.userName)
                break
            }
            // 显示房间内的所有用户 list
            case(commonCode.List): {
                this.writeCommonCode(code, this.user.userName)
                break
            }
            case(commonCode.Kick): {
                this.writeCommonCode(code, param + ' ' + this.user.userName)
                break
            }
        }
    }

    closeRl() {
        this.rl.close()
    }

    // 断开连接
    close() {
        this.client.end()
        this.changeUserInfo(false)
    }

    private clientHallStateDataEvent(chunk: string) {
        let content = chunk.toString()
        let code = content.split(' ')[0]
        switch(code) {
            case(commonCode.TwiceLoad): {
                console.log('\n---您在另一个地方登录---')
                this.close()
                process.exit(0)
                break
            }
            default: {
                console.log('\n系统消息:' + content)
            }
        }
    }

    private clientRoomStateDataEvent(chunk: string) {
        let content = chunk.toString()
        let code = content.split(' ')[0]
        switch(code) {
            // @消息
            case(commonCode.At): {
                console.log('---' + content.substring(2))
                break
            }
            // 被踢
            case(commonCode.Kick): {
                console.log('\n---你被踢出房间---')
                this.connectPort();
                break
            }
            // 被二次登录
            case(commonCode.TwiceLoad): {
                console.log('\n---您在另一个地方登录---')
                this.close()
                process.exit(0)
                break
            }
            default: {
                this.textLines.push(content)
                console.log(this.textLines.length + ' ' + this.textLines[this.textLines.length-1])
            }
        }
    }

    // 注册监听消息事件
    private clientOnData(port: number) {
        if (port === 8080) {
            // 大厅命令处理
            this.client.on('data', this.clientHallStateDataEvent.bind(this));
        } else {
            // 房间命令处理
            this.textLines = [];
            this.client.on('data', this.clientRoomStateDataEvent.bind(this));
        }
    }

    private writeCommonCode(code: commonCode, content?: string) {
        this.client.write(code + ' ' + content)
    }

    // 更改用户信息 在线、房间
    private changeUserInfo(online: boolean): void {
        let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
        for (let i=0; i<users['users'].length; i++) {
            if (users['users'][i].userName === this.user.userName) {
                if (online) {
                    users['users'][i].online = true
                    users['users'][i].roomName = this.user.roomName
                } else {
                    users['users'][i].online = false
                    users['users'][i].roomName = ''
                }
                break
            }
        }
        writeFileSync('./users.json' , JSON.stringify(users, null, 2), 'utf-8')
    }

    // 挤下线
    static twiceLoading(userName:string, roomName: string) {
        let s = new net.Socket()
        s.connect(8080)
        s.write(commonCode.TwiceLoad + ' ' + userName + ' ' + roomName)
        s.end()
    }
}
