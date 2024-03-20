import { MyTCPClient } from './client'
import { roomStateCommon } from './roomStateCommon';
import { hallStateCommon } from './hallStateCommon';

export function inputState(client: MyTCPClient) {
    return new Promise(async (resolve)=>{
        let input = await client.getInput() as string

        // 用户处于大厅状态才会处理命令
        if (client.isHallState()) {
            resolve(hallStateCommon(client, input))
        }
        // 用户处于房间状态才会处理命令
        else if (client.isRoomState()) {
            resolve(roomStateCommon(client, input))
        }
    })
}