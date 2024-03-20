"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hallStateCommon = void 0;
const commonCode_1 = require("./commonCode");
const server_1 = require("./server/server");
function hallStateCommon(client, input) {
    let code = input.split(' ')[0];
    let param = input.substring(code.length + 1);
    // 处理命令
    switch (code) {
        // 新建房间
        case ('1'): {
            client.writeText(commonCode_1.commonCode.NewRoom + ' ' + param);
            // 等待房间建立
            setTimeout(() => {
                const port = (0, server_1.getPort)(param);
                client.connectPort(port, param);
            }, 1000);
            return client.getState();
        }
        // 进入房间
        case ('2'): {
            const port = (0, server_1.getPort)(param);
            if (port === 8080) {
                console.log('房间不存在');
            }
            else {
                client.connectPort(port, param);
            }
            return client.getState();
        }
        // 刷新房间列表
        case ('3'): {
            (0, server_1.showRooms)();
            return client.getState();
        }
        // 关闭服务器
        case ('4'): {
            client.writeText(commonCode_1.commonCode.ShutDown);
            client.close();
            return commonCode_1.commonCode.Empty;
        }
        case ('logout'): {
            client.close();
            return commonCode_1.commonCode.Start;
        }
        case ('help'): {
            console.log('\n1.新建房间：(1 房间名称)\n' +
                '2.进入房间：(2 房间名称)\n' +
                '3.刷新房间列表：(3)\n');
            return client.getState();
        }
        default: {
            console.log('错误的序号');
            // client.write(code)
            return client.getState();
        }
    }
}
exports.hallStateCommon = hallStateCommon;
//# sourceMappingURL=hallStateCommon.js.map