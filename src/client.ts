import * as net from 'net'
import { readFileSync, writeFileSync } from "fs";
import { hallState } from './hallState';
import { roomState } from './roomState';
import * as readline from "readline";

export class MyTCPClient {
    // 用户信息 {名字，所在房间名}
    private user: {
        userName: string
        roomName: string
    }
    // 用户的Socket
    private client: net.Socket
    // 用户的界面状态
    private state: string = 'hallState'
    // 聊天记录
    private textLines: string[] = []
    // 读取流
    rl: readline.Interface
    constructor(userName: string, roomName: string) {
        this.user = {
            userName: userName,
            roomName: roomName
        }
        this.client = new net.Socket();
        // rl初始化 不知道怎么置空值，只能new了然后close
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.rl.close()
    }

    // 连接端口
    connectPort(port: number = 8080, roonName: string = '大厅') {
        this.user.roomName = roonName

        this.client.end()
        this.client = new net.Socket();
        this.client.connect(port);

        // 更改用户显示界面
        if (port === 8080) {
            this.state = 'hallState'
        } else {
            this.state = 'roomState'
        }
        switch(this.state) {
            case('hallState'): {
                hallState(this)
                break
            }
            case('roomState'): {
                roomState(this)
                break
            }
        }

        // 更改用户信息
        let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
        for (let i=0; i<users['users'].length; i++) {
            if (users['users'][i].userName === this.user.userName) {
                users['users'][i].online = true
                users['users'][i].roomName = this.user.roomName
            }
        }
        writeFileSync('./users.json' , JSON.stringify(users, null, 2), 'utf-8')

        if (port === 8080) {
            // 大厅命令处理
            this.client.on('data', (chunk) => {
                let content = chunk.toString();
                if (content.split(' ')[0] === 'kill') {
                    console.log('---您在另一个地方登录---')
                    this.close()
                    process.exit(0)
                } else {
                    console.log(content)
                }
            });
        } else {
            this.textLines = [];
            // 房间命令处理
            this.client.on('data', (chunk) => {
                let content = chunk.toString();
                if (content.split(' ')[0] === '@') {
                    console.log('---' + content.substring(2))
                } else if (content.split(' ')[0] == '-'){
                    console.log('---你被踢出房间---')
                    this.state = 'hallState'
                    this.rl.close()
                    this.connectPort();
                } else if (content.split(' ')[0] == 'kill') {
                    console.log('---您在另一个地方登录---')
                    this.close()
                    process.exit(0)
                } else {
                    this.textLines.push(content)
                    console.log(this.textLines.length + ' ' + this.textLines[this.textLines.length-1])
                }
            });
        }
        // 发送指令，告诉该端口自己的信息
        this.client.write('5 ' + this.user.userName)
    }


    getState(){return this.state}

    // 写入处理
    writeText(text: string) {
        let code = text.split(' ')[0]
        let param = text.substring(code.length + 1)
        switch(code) {
            // 新建房间
            case('1'): {
                this.client.write(code + ' ' + param)
                this.user.roomName = param
                break
            }
            // 关闭服务器
            case('4'): {
                this.client.write(code)
                break
            }
            // 发言 say text
            case('say'): {
                this.client.write(code + ' ' + this.user.userName + ' ' + param)
                break
            }
            // 回复 reply line text
            case('reply'): {
                let lineString = param.split(' ')[0]
                let line = Number(lineString)
                if (!isNaN(line) && line >= 1 && line <= this.textLines.length) {
                    let text = param.substring(lineString.length + 1)
                    this.client.write('say ' + this.user.userName + ' @' + 
                        this.textLines[line-1] + ' | ' + text)
                }
                break
            }
            // roll点游戏 roll
            case('roll'): {
                this.client.write(code + ' ' + this.user.userName)
                break
            }
            // 显示房间内的所有用户 list
            case('list'): {
                this.client.write(code + ' ' + this.user.userName)
                break
            }
            case('kick'): {
                this.client.write(code + ' ' + param + ' ' + this.user.userName)
                break
            }
        }
    }

    // 断开连接
    close() {
        this.client.end()
        // 更改用户信息
        let users = JSON.parse(readFileSync('./users.json', 'utf-8'))
        for (let i=0; i<users['users'].length; i++) {
            if (users['users'][i].userName == this.user.userName) {
                users['users'][i].online = false
                users['users'][i].roomName = ''
            }
        }
        writeFileSync('./users.json' , JSON.stringify(users, null, 2), 'utf-8')
    }
}
