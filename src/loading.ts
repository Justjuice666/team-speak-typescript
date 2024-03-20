import { readFileSync } from "fs";
import { MyTCPClient } from './client'
import { commonCode } from "./commonCode";

export function loading(client: MyTCPClient){
    return new Promise(async (resolve)=>{
        let userName = await client.getInput('账号:') as string
        let password = await client.getInput('密码:') as string
        

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
                    MyTCPClient.twiceLoading(userName, roomName)
                }
                setTimeout(()=>{
                    console.log('\n成功登录')
                    client.userInit(userName, '大厅')
                    client.connectPort()
                    console.log('\nhelp (show commons)')
                    resolve(commonCode.HallState)
                }, 1000)
            } else {
                console.log('\n---密码错误---')
                // 返回登录/注册/退出界面
                // start()
                resolve(commonCode.Start)
            }
        } else {
            console.log('\n---不存在该用户名---')
            // 返回登录/注册/退出界面
            // start()
            resolve(commonCode.Start)
        }
        // console.log('name', user.userName, 'password', user.password)
    })
}