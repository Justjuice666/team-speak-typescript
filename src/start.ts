import * as readline from "readline";
import { loading } from "./loading";
import { register } from "./register";


export async function start(){
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    let code = ''
    console.log("1.登录\n2.注册\n3.退出\n")
    rl.prompt()
    rl.question('>', function(input){
        code = input
        rl.close()
    })
    rl.on('close', () => {
        switch(code) {
            case('1'): {
                loading()
                break
            }
            case('2'): {
                register()
                break
            }
            case('3'): {
                console.log('退出成功')
                break
            }
            default: {
                console.log('错误的序号')
                start()
            }
        }
    })
}

