"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hallState = void 0;
const readline = require("readline");
const server_1 = require("./server");
function hallState(client) {
    client.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let code = '';
    let param = '';
    console.log('\n1.新建房间：(1 房间名称)\n' +
        '2.进入房间：(2 房间名称)\n' +
        '3.刷新房间列表：(3)\n');
    client.rl.prompt();
    client.rl.question('>', function (input) {
        code = input.split(' ')[0];
        param = input.substring(code.length + 1);
        client.rl.close();
    });
    client.rl.on('close', () => {
        // 用户处于大厅状态才会处理命令
        if (client.getState() === 'hallState')
            switch (code) {
                // 新建房间
                case ('1'): {
                    client.writeText(code + ' ' + param);
                    // 等待房间建立
                    setTimeout(() => {
                        const port = (0, server_1.getPort)(param);
                        // console.log(param)
                        // 房间阶段
                        client.connectPort(port, param);
                        console.log('\nsay text\n' +
                            'reply line text\n' +
                            'roll\n' +
                            'leave\n' +
                            'logout\n');
                    }, 1000);
                    break;
                }
                // 进入房间
                case ('2'): {
                    const port = (0, server_1.getPort)(param);
                    if (port === 8080) {
                        console.log('房间不存在');
                        hallState(client);
                    }
                    else {
                        client.connectPort(port, param);
                        console.log('\nsay text\n' +
                            'reply line text\n' +
                            'roll\n' +
                            'leave\n' +
                            'logout\n');
                    }
                    break;
                }
                // 刷新房间列表
                case ('3'): {
                    (0, server_1.showRooms)();
                    hallState(client);
                    break;
                }
                // 关闭服务器
                case ('4'): {
                    client.writeText('4');
                    client.close();
                    break;
                }
                default: {
                    console.log('错误的序号');
                    // client.write(code)
                    hallState(client);
                }
            }
    });
}
exports.hallState = hallState;
//# sourceMappingURL=hallState.js.map