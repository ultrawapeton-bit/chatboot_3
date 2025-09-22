const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot')
require("dotenv").config()

const QRPortalWeb = require('@bot-whatsapp/portal')
const BaileysProvider = require('@bot-whatsapp/provider/baileys')
//const MockAdapter = require('@bot-whatsapp/database/mock')
//const MockAdapter = require('@bot-whatsapp/database/mock')
const MongoAdapter = require('@bot-whatsapp/database/mongo')
const { delay } = require('@whiskeysockets/baileys')
const path = require("path")
const fs = require("fs")
const chat = require("./chatGPT")
const  {handlerAI} = require("./whisper")



const menuPath = path.join(__dirname, "mensajes", "menu.txt")
const menu = fs.readFileSync(menuPath,"utf-8")



const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt")
const promptConsultas = fs.readFileSync(pathConsultas,"utf-8")



const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer("Esta es una nota de voz", null, async(ctx,ctxFn)=> {
    const text = await  handlerAI(ctx)
    const prompt = promptConsultas
    const consulta = text
    const answer = await chat(prompt, consulta)
        //console.log(answer.content)
    await ctxFn.flowDynamic(answer.content)
    //console.log(text)
})


const flowMenuRest = addKeyword(EVENTS.ACTION)
    //.addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer('🙌 este es el menu',{
        media:"https://i.pinimg.com/736x/db/42/28/db422822805bc78cf0e4c11bb16ef269.jpg"
    })
    //.addAnswer('Bienvenido a este curso')
  

const flowReservar = addKeyword(EVENTS.ACTION)
    //.addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer('🙌 este es el de reservar: www.hacetureservas')
    //.addAnswer('Bienvenido a este curso')
  

const flowConsultas = addKeyword(EVENTS.ACTION)
    //.addAnswer('🙌 Hola bienvenido a este *Chatbot*')
    .addAnswer('🙌 este es el de consultas')
    .addAnswer("hace tus consultas", {capture:true},async(ctx, ctxFn) => {
        const prompt = promptConsultas
        const consulta = ctx.body
        const answer = await chat(prompt, consulta)
        //console.log(answer.content)
        await ctxFn.flowDynamic(answer.content)
    })
    //.addAnswer('Bienvenido a este curso')
  


const flowWelcome = addKeyword(EVENTS.WELCOME)
    .addAnswer("🙌 esto es el flujo welcome", {
         delay: 100,

    },
    async (ctx, ctxFn) => {
        if (ctx.body.includes("Casa")) {
            await ctxFn.flowDynamic("Escribiste casa")
            
        }else{
            await ctxFn.flowDynamic("Escribiste otra huevada")

        }
        //console.log(ctx.body)
        //await ctxFn.flowDynamic("hola este es el flowdynamic")
    })
    //.addAnswer("Aquí tienes una imagen de bienvenida:")
    /* .addAnswer({
        media: "https://unamglobal.unam.mx/wp-content/uploads/2023/09/destacada-cachorros-y-perros-1024x605.jpg"
    }); */
    /* .addAnswer("🐶 Tu imagen de bienvenida", {
    delay: 1000,
    media: "https://unamglobal.unam.mx/wp-content/uploads/2023/09/destacada-cachorros-y-perros-1024x605.jpg"
  }); */


const menuFlow = addKeyword("Menu").addAnswer( 
 menu, 
 /* "Este es el menu elegir una opcion 1,2,3,4", */ 
 { capture: true }, 
 async (ctx, { gotoFlow, fallBack, flowDynamic }) => { 
    if (!["1", "2", "3", "0"].includes(ctx.body)){        return fallBack( 
                "Respuesta no válida, por favor selecciona una de las opciones."  ); 
    } 
    switch (ctx.body) { 
        case "1": 
            return  gotoFlow(flowMenuRest); 
           
        case "2": 
            return  gotoFlow(flowReservar); 
        case "3": 
            return gotoFlow(flowConsultas);
            /* 
        case "4": 
            return await flowDynamic("Esta es la opcion 4"); 
        case "5":  */
            return  gotoFlow(flowConsultas) 
        case "0": 
            return await flowDynamic( 
            "Saliendo... Puedes volver a acceder a este menú escribiendo '*Menu"  
        );

    } 
 } 
); 


const main = async () => {
    try {
        //const adapterDB = new MockAdapter()
        const adapterDB = new MongoAdapter({
            dbUri: process.env.MONGO_DB_URI,
            dbName: "youtubetest"

        })
        const adapterFlow = createFlow([flowWelcome, menuFlow, flowMenuRest, flowReservar, flowConsultas, flowVoice])
        const adapterProvider = createProvider(BaileysProvider)

        createBot({
            flow: adapterFlow,
            provider: adapterProvider,
            database: adapterDB,
        })

        QRPortalWeb({ port: 3001 })
    } catch (error) {
        console.error("Error en main():", error)
    }
}

// Captura errores de promesas no manejadas globalmente
process.on('unhandledRejection', (reason, promise) => {
    console.error("Unhandled Rejection at:", promise, "reason:", reason)
})

main()

/* const main = async () => {
    const adapterDB = new MockAdapter()
    const adapterFlow = createFlow([flowPrincipal,flowWelcome])
    const adapterProvider = createProvider(BaileysProvider)

    createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    })
    //{ port: 3001 }
    QRPortalWeb({ port: 3001 })
}

main() */
