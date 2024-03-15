import * as readline from "readline";
import { readFileSync } from "fs";
import { MyTCPClient } from './client'
import { Socket } from "net"

export function loading(){
    let userName: string
    let password: string
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    rl.prompt()
    rl.question('账号:\n', function(input){
        userName = input
        rl.question('密码:\n', function(input){
            password = input
            rl.close()
        })
    })
    rl.on('close', () => {
        // 读取 './users.json' 文件 并格式化为JSON对象
        let newUsers = JSON.parse(readFileSync('./users.json', 'utf-8'))
        // 判断用户名是否存在
        let isUserName = false
        // 密码是否正确
        let isSamePassword = false
        // 用户是否已经登录
        let roomName: string = ''
        for (const u of newUsers['users']) {
            if (u.userName === userName) {
                isUserName = true
                if (u.password === password)
                    isSamePassword = true
                if (u.online)
                    roomName = u.roomName
                break
            }
        }
        if (isUserName) {
            if (isSamePassword) {
                /*
                    连接服务器
                */
                // 在线 挤掉 短连接
                if (roomName !== '') {
                    let s = new Socket()
                    s.connect(8080)
                    s.write('kill ' + userName + ' ' + roomName)
                    // console.log('kill')
                    s.end()
                }
                setTimeout(()=>{
                    console.log('成功登录')
                    const client = new MyTCPClient(userName, '大厅')
                    client.connectPort()
                }, 1000)
            } else {
                console.log('---密码错误，重新输入---')
                loading()
            }
        } else {
            console.log('---不存在该用户名，重新输入---')
            loading()
        }
        // console.log('name', user.userName, 'password', user.password)
    })
}