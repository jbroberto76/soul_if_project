// webhook do projeto Soul_IF

const token = process.env.WHATSAPP_TOKEN

const express = require("express")
const body_parser = require("body-parser")
const axios = require("axios")
const app = express()

app.listen(process.env.PORT || 8000, () => {
   console.log("Soul_IF webhook listening")
});

//
app.post('/webhook', (req, res) => {

});

//
app.get('/webhook', (req, res) => {
    // token de verificação idêntico ao "Verificar token" cadastrado
    // no Painel de Aplicativos da Meta
    const verify_token = process.env.VERIFY_TOKEN

    let mode = req.query["hub.mode"]
    let token = req.query["hub.verify_token"]
    let challenge = req.query["hub.challenge"]
    // Verifica se um token e mode foram enviados
    if (mode && token) {
        // Verifica se mode e token enviados conferem com os
        // que estão cadastrados
        if (mode === "subscribe" && token === verify_token) {
            // Envia resposta 200 OK e desafia challenge token from da requisição
            console.log("Webhook Soul_IF VERIFIED");
            res.status(200).send(challenge);
        } else {
            // Caso contrário '403 Forbidden' caso não confira
            res.sendStatus(403);
            console.log("ERRO ao verificar Webhook Soul_IF")
        }
    }

});
