"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const readline = require("readline");
const loading_1 = require("./loading");
const register_1 = require("./register");
async function start() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let code = '';
    console.log("1.登录\n2.注册\n3.退出\n");
    rl.prompt();
    rl.question('>', function (input) {
        code = input;
        rl.close();
    });
    rl.on('close', () => {
        switch (code) {
            case ('1'): {
                (0, loading_1.loading)();
                break;
            }
            case ('2'): {
                (0, register_1.register)();
                break;
            }
            case ('3'): {
                console.log('退出成功');
                break;
            }
            default: {
                console.log('错误的序号');
                start();
            }
        }
    });
}
exports.start = start;
//# sourceMappingURL=start.js.map