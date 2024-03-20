"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.roomStateCommon = void 0;
const commonCode_1 = require("./commonCode");
function roomStateCommon(client, input) {
    let code = input.split(' ')[0];
    let param = input.substring(code.length + 1);
    // 处理命令
    switch (code) {
        case ('say'): {
            client.writeText(commonCode_1.commonCode.Say + ' ' + param);
            return client.getState();
        }
        case ('reply'): {
            client.writeText(commonCode_1.commonCode.Reply + ' ' + param);
            return client.getState();
        }
        case ('roll'): {
            client.writeText(commonCode_1.commonCode.Roll);
            return client.getState();
        }
        case ('leave'): {
            client.connectPort();
            return client.getState();
        }
        case ('logout'): {
            client.close();
            return commonCode_1.commonCode.Start;
        }
        case ('list'): {
            client.writeText(commonCode_1.commonCode.List);
            return client.getState();
        }
        case ('kick'): {
            client.writeText(commonCode_1.commonCode.Kick + ' ' + param);
            return client.getState();
        }
        case ('help'): {
            console.log('\nsay text\n' +
                'reply line text\n' +
                'roll\n' +
                'leave\n' +
                'logout\n');
            return client.getState();
        }
        default: {
            console.log('错误的命令');
            // console.clear()
            return client.getState();
        }
    }
}
exports.roomStateCommon = roomStateCommon;
//# sourceMappingURL=roomStateCommon.js.map