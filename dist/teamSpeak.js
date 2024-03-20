"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const start_1 = require("./start");
const loading_1 = require("./loading");
const register_1 = require("./register");
const inputState_1 = require("./inputState");
const client_1 = require("./client");
const commonCode_1 = require("./commonCode");
async function teamSpeak() {
    let state = commonCode_1.commonCode.Start;
    let client = new client_1.MyTCPClient();
    while (state !== commonCode_1.commonCode.Empty) {
        switch (state) {
            case (commonCode_1.commonCode.Start): {
                state = await (0, start_1.start)(client);
                break;
            }
            case (commonCode_1.commonCode.Loading): {
                state = await (0, loading_1.loading)(client);
                break;
            }
            case (commonCode_1.commonCode.Register): {
                state = await (0, register_1.register)(client);
                break;
            }
            case (commonCode_1.commonCode.HallState):
            case (commonCode_1.commonCode.RoomState): {
                state = await (0, inputState_1.inputState)(client);
                break;
            }
        }
    }
    client.closeRl();
}
teamSpeak();
//# sourceMappingURL=teamSpeak.js.map