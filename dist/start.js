"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const commonCode_1 = require("./commonCode");
function start(client) {
    return new Promise(async (resolve) => {
        console.log("\n1.登录\n2.注册\n3.退出\n");
        let code = await client.getInput();
        switch (code) {
            case ('1'): {
                // loading()
                resolve(commonCode_1.commonCode.Loading);
                break;
            }
            case ('2'): {
                // register()
                resolve(commonCode_1.commonCode.Register);
                break;
            }
            case ('3'): {
                console.log('退出成功');
                resolve('');
                break;
            }
            default: {
                console.log('错误的序号');
                // start()
                resolve(commonCode_1.commonCode.Start);
            }
        }
    });
}
exports.start = start;
//# sourceMappingURL=start.js.map