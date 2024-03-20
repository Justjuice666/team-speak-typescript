import { start } from "./start";
import { loading } from "./loading";
import { register } from "./register";
import { inputState } from "./inputState";
import { MyTCPClient } from "./client";
import { commonCode } from "./commonCode";

async function teamSpeak(){
    let state: commonCode = commonCode.Start
    let client: MyTCPClient = new MyTCPClient()
    while (state !== commonCode.Empty) {
        switch (state) {
            case(commonCode.Start): {
                state = await start(client) as commonCode
                break
            }
            case(commonCode.Loading): {
                state = await loading(client) as commonCode
                break
            }
            case(commonCode.Register): {
                state = await register(client) as commonCode
                break
            }
            case(commonCode.HallState):
            case(commonCode.RoomState): {
                state = await inputState(client) as commonCode
                break
            }
        }
    }
    client.closeRl()
}

teamSpeak()
