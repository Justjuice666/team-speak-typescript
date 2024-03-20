import { MyTCPClient } from './client'
import { commonCode } from "./commonCode";

export function start(client: MyTCPClient) {
    return new Promise(async (resolve) => {
        console.log("\n1.登录\n2.注册\n3.退出\n")
        let code: string = await client.getInput() as string

        switch(code) {
            case('1'): {
                // loading()
                resolve(commonCode.Loading)
                break
            }
            case('2'): {
                // register()
                resolve(commonCode.Register)
                break
            }
            case('3'): {
                console.log('退出成功')
                resolve('')
                break
            }
            default: {
                console.log('错误的序号')
                // start()
                resolve(commonCode.Start)
            }
        }
    })
}
