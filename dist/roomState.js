"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomState = void 0;
const readline = require("readline");
const start_1 = require("./start");
function roomState(client) {
    client.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let code = '';
    let param = '';
    client.rl.prompt();
    client.rl.question('', function (input) {
        code = input.split(' ')[0];
        param = input.substring(code.length + 1);
        client.rl.close();
    });
    client.rl.on('close', () => {
        // 用户处于房间状态才会处理命令
        if (client.getState() === 'roomState')
            switch (code) {
                case ('say'): {
                    client.writeText(code + ' ' + param);
                    roomState(client);
                    break;
                }
                case ('reply'): {
                    client.writeText(code + ' ' + param);
                    roomState(client);
                    break;
                }
                case ('roll'): {
                    client.writeText(code);
                    roomState(client);
                    break;
                }
                case ('leave'): {
                    client.connectPort();
                    break;
                }
                case ('logout'): {
                    client.close();
                    (0, start_1.start)();
                    break;
                }
                case ('list'): {
                    client.writeText(code);
                    roomState(client);
                    break;
                }
                case ('kick'): {
                    client.writeText(code + ' ' + param);
                    roomState(client);
                    break;
                }
                default: {
                    // console.log('错误的命令')
                    // console.clear()
                    roomState(client);
                }
            }
    });
}
exports.roomState = roomState;
//# sourceMappingURL=roomState.js.map