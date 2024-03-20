import { MyTCPClient } from './client'
import { commonCode } from "./commonCode";
import {User} from './user'
import { readFileSync, writeFileSync } from "fs";

export function register(client: MyTCPClient){
    return new Promise(async (resolve)=>{
        let userName = await client.getInput('账号:') as string
        let password = await client.getInput('密码:') as string
        let secondPassword = await client.getInput('确认密码:') as string

        // 判断前后密码是否一致
        if (password === secondPassword) {
            // 读取 './users.json' 文件 并格式化为JSON对象
            let newUsers = JSON.parse(readFileSync('./users.json', 'utf-8'))
            // 判断是否有重名
            let isNotSameName = true
            for (const u of newUsers['users']) {
                if (u.userName === userName) {
                    isNotSameName = false
                    break
                }
            }
            if (isNotSameName) {
                // 保存为 ./users.json 文件
                let user: User = {
                    userName: userName,
                    password: password,
                    online: false,
                    roomName: '',
                    root: false
                }
                newUsers['users'][newUsers.users.length] = user
                writeFileSync('./users.json' , JSON.stringify(newUsers, null, 2), 'utf-8')
                console.log('\n注册成功')
            } else {
                console.log('\n---重名---')
            }
        } else {
            console.log('\n---前后密码不一致---')
        }
        // 返回登录/注册/退出界面
        resolve(commonCode.Start)
    })
}
