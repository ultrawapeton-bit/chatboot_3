// app.js
const { createBot, createProvider, createFlow, addKeyword, EVENTS } = require('@bot-whatsapp/bot');
const QRPortalWeb = require('@bot-whatsapp/portal');
const BaileysProvider = require('@bot-whatsapp/provider/baileys');
const MongoAdapter = require('@bot-whatsapp/database/mongo');
const { delay } = require('@whiskeysockets/baileys');
const path = require('path');
const fs = require('fs');
const chat = require('./chatGPT');
const { handlerAI } = require('./whisper');

// Rutas de archivos de mensajes
const menuPath = path.join(__dirname, "mensajes", "menu.txt");
const menu = fs.readFileSync(menuPath, "utf-8");

const pathConsultas = path.join(__dirname, "mensajes", "promptConsultas.txt");
const promptConsultas = fs.readFileSync(pathConsultas, "utf-8");

// Flujos del bot
const flowVoice = addKeyword(EVENTS.VOICE_NOTE).addAnswer(
  "Esta es una nota de voz",
  null,
  async (ctx, ctxFn) => {
    const text = await handlerAI(ctx);
    const answer = await chat(promptConsultas, text);
    await ctxFn.flowDynamic(answer.content);
  }
);

const flowMenuRest = addKeyword(EVENTS.ACTION).addAnswer(
  '🙌 este es el menu',
  { media: "https://i.pinimg.com/736x/db/42/28/db422822805bc78cf0e4c11bb16ef269.jpg" }
);

const flowReservar = addKeyword(EVENTS.ACTION).addAnswer(
  '🙌 este es el de reservar: www.hacetureservas'
);

const flowConsultas = addKeyword(EVENTS.ACTION)
  .addAnswer('🙌 este es el de consultas')
  .addAnswer("hace tus consultas", { capture: true }, async (ctx, ctxFn) => {
    const answer = await chat(promptConsultas, ctx.body);
    await ctxFn.flowDynamic(answer.content);
  });

const flowWelcome = addKeyword(EVENTS.WELCOME).addAnswer(
  "🙌 esto es el flujo welcome",
  { delay: 100 },
  async (ctx, ctxFn) => {
    if (ctx.body.includes("Casa")) {
      await ctxFn.flowDynamic("Escribiste casa");
    } else {
      await ctxFn.flowDynamic("Escribiste otra cosa");
    }
  }
);

const menuFlow = addKeyword("Menu").addAnswer(
  menu,
  { capture: true },
  async (ctx, { gotoFlow, fallBack, flowDynamic }) => {
    if (!["1", "2", "3", "0"].includes(ctx.body)) {
      return fallBack("Respuesta no válida, por favor selecciona una de las opciones.");
    }
    switch (ctx.body) {
      case "1": return gotoFlow(flowMenuRest);
      case "2": return gotoFlow(flowReservar);
      case "3": return gotoFlow(flowConsultas);
      case "0": return await flowDynamic("Saliendo... Puedes volver a acceder a este menú escribiendo '*Menu'");
    }
  }
);

// MAIN
const main = async () => {
  try {
    // MongoDB Adapter para Railway
    if (!process.env.MONGO_DB_URI) {
      throw new Error("❌ La variable MONGO_DB_URI no está definida en Railway");
    }

    const adapterDB = new MongoAdapter({
      dbUri: process.env.MONGO_DB_URI,
      dbName: "youtubetest"
    });

    const adapterFlow = createFlow([flowWelcome, menuFlow, flowMenuRest, flowReservar, flowConsultas, flowVoice]);
    const adapterProvider = createProvider(BaileysProvider);

    createBot({
      flow: adapterFlow,
      provider: adapterProvider,
      database: adapterDB,
    });

    QRPortalWeb({ port: 3001 });
    console.log("✅ Bot iniciado correctamente en Railway!");
  } catch (error) {
    console.error("Error en main():", error);
  }
};

// Captura errores de promesas no manejadas globalmente
process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

main();
