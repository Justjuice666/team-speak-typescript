"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inputState = void 0;
const roomStateCommon_1 = require("./roomStateCommon");
const hallStateCommon_1 = require("./hallStateCommon");
function inputState(client) {
    return new Promise(async (resolve) => {
        let input = await client.getInput();
        // 用户处于大厅状态才会处理命令
        if (client.isHallState()) {
            resolve((0, hallStateCommon_1.hallStateCommon)(client, input));
        }
        // 用户处于房间状态才会处理命令
        else if (client.isRoomState()) {
            resolve((0, roomStateCommon_1.roomStateCommon)(client, input));
        }
    });
}
exports.inputState = inputState;
//# sourceMappingURL=inputState.js.map