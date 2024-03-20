import { MyTCPClient } from './client'
import { commonCode  } from './commonCode';
import { getPort, showRooms } from './server/server';

export function hallStateCommon(client: MyTCPClient, input: string) {
    let code = input.split(' ')[0]
    let param = input.substring(code.length + 1)

    // 处理命令
    switch(code) {
        // 新建房间
        case('1'): {
            client.writeText(commonCode.NewRoom + ' ' + param)
            // 等待房间建立
            setTimeout(() => {
                const port = getPort(param)
                client.connectPort(port, param);
            }, 1000)
            return client.getState()
        }
        // 进入房间
        case('2'): {
            const port = getPort(param)
            if (port === 8080) {
                console.log('房间不存在')
            } else {
                client.connectPort(port, param);
            }
            return client.getState()
        }
        // 刷新房间列表
        case('3'): {
            showRooms()
            return client.getState()
        }
        // 关闭服务器
        case('4'): {
            client.writeText(commonCode.ShutDown)
            client.close()
            return commonCode.Empty
        }
        case('logout'): {
            client.close()
            return commonCode.Start
        }
        case('help'): {
            console.log(
                '\n1.新建房间：(1 房间名称)\n' + 
                '2.进入房间：(2 房间名称)\n' + 
                '3.刷新房间列表：(3)\n'
            )  
            return client.getState()
        }
        default: {
            console.log('错误的序号')
            // client.write(code)
            return client.getState()
        }
    }
}