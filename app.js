// webhook do projeto Soul_IF

const egressosDAO = require("./dao/egressosDAO");
// Cloud API token
const token = process.env.WHATSAPP_TOKEN;
// Cloud API version
const version = process.env.VERSION;

const express = require("express");
const body_parser = require("body-parser");
const axios = require("axios").default;
const app = express().use(body_parser.json());
const { MongoClient } = require("mongodb");
// user on MongoDB Atlas
const user = process.env.USER;
// password on MongoDB Atlas
const pass = process.env.PASS;
// DB on MongoDB Atlas
const db = process.env.DB;
// colletcion name on MongoDB Atlas
const collection = process.env.COLLECTION;
// MongoDB Atlas  connection string
const uri =
  "mongodb+srv://soul_if_user:" +
  pass +
  "@cluster0.o7l3fbq.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);
// test phone number
const phone_number_id = "103594915867313";

app.listen(process.env.PORT || 8000, () => {
  console.log("Soul_IF webhook listening ...");
});

// start a poll with active users
app.post("/poll/:id", async (req, res) => {
  // poll id
  let id_ = req.params.id;
  //
  let pesquisa = await egressosDAO.getPollbyId(client, id_);
  // get list of active users (egressos)
  let activeUsers = await egressosDAO.getActiveUsers(client);
  console.log(JSON.stringify(activeUsers, null, 2));

  // send accept poll message to users
  activeUsers.forEach((egresso) => {
    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url:
        "https://graph.facebook.com/" +
        version +
        "/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: {
        messaging_product: "whatsapp",
        to: egresso.wa_id,
        type: "template",
        template: {
          name: "poll_acceptance",
          language: { code: "pt_br" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: egresso.nome },
                { type: "text", text: pesquisa[0].titulo },
                { type: "text", text: pesquisa[0].campus },
              ],
            },
            {
              type: "button",
              sub_type: "quick_reply",
              index: 0,
              parameters: [{ type: "payload", payload: id_ }],
            },
          ],
        },
      },
      headers: { "Content-Type": "application/json" },
    }).catch(function (error) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    });
  });
  res.sendStatus(200);
});

// start converstions
app.post("/start", async (req, res) => {
  // get list of users to start the conversations
  let newUsers = await egressosDAO.getNewUsers(client);

  //console.log(newUsers);

  // send presentation message templates
  newUsers.forEach((egresso) => {
    axios({
      method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      url:
        "https://graph.facebook.com/" +
        version +
        "/" +
        phone_number_id +
        "/messages?access_token=" +
        token,
      data: {
        messaging_product: "whatsapp",
        to: egresso.telefone,
        type: "template",
        template: {
          name: "acceptancee",
          language: { code: "pt_br" },
          components: [
            {
              type: "body",
              parameters: [
                    { type: "text", text: egresso.nome },
                    { type: "text", text: egresso.curso },
                    { type: "text", text: egresso.campus } ] 
            },
            { 
              type: "button",
              sub_type: "quick_reply",
              index: "0",
              parameters: [{ type: "payload", payload: "PAYLOAD_ZERO" }],
            },
            {
              type: "button",
              sub_type: "quick_reply",
              index: "1",
              parameters: [{ type: "payload", payload: "PAYLOAD_ONE" }],
            }
          ],
        },
      },
      headers: { "Content-Type": "application/json" },
    }).catch(function (error) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.log(error.response.data);
      console.log(error.response.status);
      console.log(error.response.headers);
    });
  });
  res.sendStatus(200);
});

// 
app.post("/webhook", async (req, res) => {
  let body = req.body;

  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  if (req.body.object) {
    if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      let phone_number_id =
        body.entry[0].changes[0].value.metadata.phone_number_id;
      // extract the phone number from the webhook payload
      let from = body.entry[0].changes[0].value.messages[0].from;
      // extract the message text from the webhook payload
      let msg_body = null;
      if ("text" in body.entry[0].changes[0].value.messages[0]) {
        msg_body = req.body.entry[0].changes[0].value.messages[0].text.body;
      }
      // extract the button text from the payload
      let button_payload = null;
      if ("button" in body.entry[0].changes[0].value.messages[0]) {
        button_payload =
          req.body.entry[0].changes[0].value.messages[0].button.payload;
      }

      // check acceptance YES
      if (button_payload === "PAYLOAD_ZERO") {
        // send instructions template
        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
            "https://graph.facebook.com/" +
            version +
            "/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
          data: {
            messaging_product: "whatsapp",
            to: from,
            type: "template",
            template: { name: "instructions", language: { code: "pt_br" } },
          },
          headers: { "Content-Type": "application/json" },
        }).catch(function (error) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        });
        // set acceptance on DB
        await egressosDAO.setUserAcceptance(client, from, 1);
      }

      // check acceptance NO
      if (button_payload === "PAYLOAD_ONE") {
        // send thankno template
        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
            "https://graph.facebook.com/" +
            version +
            "/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
          data: {
            messaging_product: "whatsapp",
            to: from,
            type: "template",
            template: { 
              name: "thankno", 
              language: { code: "pt_br" } },
          },
          headers: { "Content-Type": "application/json" },
        }).catch(function (error) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        });
        //
        await egressosDAO.setUserAcceptance(client, from, 0);
      }

      // check acceptance to reply a poll
      if (/[0-9]+/.test(button_payload)) {
        // poll id
        let id_ = button_payload;
        // get poll data
        const pesquisa = await egressosDAO.getPollbyId(client, id_);
        let perguntas = pesquisa[0].perguntas[0];
        let opcoes = perguntas.opcoes;
        let s1 = '[{title: "Opções", rows:[';
        let s2 = [];
        opcoes.forEach(function (o, i) {
          s2.push(
            `{id:\"${
              id_ + "0" + i.toString()
            }\",title:\"${o.toString()}\"}`
          );
        });
        let s3 = "]}]";

        // send first question to a single egresso
        axios({
          method: "POST", // Required, HTTP method, a string, e.g. POST, GET
          url:
            "https://graph.facebook.com/" +
            version +
            "/" +
            phone_number_id +
            "/messages?access_token=" +
            token,
          data: {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: from,
            type: "interactive",
            interactive: {
              type: "list",
              header: {
                type: "text",
                text: pesquisa[0].titulo,
              },
              body: {
                text: perguntas.descricao,
              },
              footer: {
                text: "Campus " + pesquisa[0].campus,
              },
              action: {
                button: "Responda aqui:",
                sections: s1 + s2.toString() + s3,
              },
            },
          },
          headers: { "Content-Type": "application/json" },
        }).catch(function (error) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          console.log(error.response.data);
          console.log(error.response.status);
          console.log(error.response.headers);
        }); // end of axios function
      }
      // extract list_entry from the payload
      
      if ("interactive" in body.entry[0].changes[0].value.messages[0]) {
        let poll_data = {};
        let result = null;
        // extract choice, poll and question
        let payload = req.body.entry[0].changes[0].value.messages[0].interactive.list_reply
            .id;
        poll_data.id_ = payload.substr(0,2);
        poll_data.idx = payload.substr(2,1);
        poll_data.choice =
          req.body.entry[0].changes[0].value.messages[0].interactive.list_reply
            .title;
        
        let last = await egressosDAO.isLastQuestionPoll(client, poll_data.id_, parseInt(poll_data.idx));
        poll_data = Object.assign(poll_data, last)
        poll_data.from = from;
        // store reply on DB
        result = await egressosDAO.updatePollReply2(client, poll_data);
        // 
        if (result.acknowledged === true) {
          console.log("Resposta de egresso regristrada no BD!")
          // check next question
          if (poll_data.last === 1) { // last question
            let pesquisa = await egressosDAO.getPollbyId(client, poll_data.id_);
            //   send thankno template
            axios({
              method: "POST", // Required, HTTP method, a string, e.g. POST, GET
              url:
                "https://graph.facebook.com/" +
                version +
                "/" +
                phone_number_id +
                "/messages?access_token=" +
                token,
              data: {
                messaging_product: "whatsapp",
                to: poll_data.from,
                type: "template",
                template: { 
                  name: "poll_finish", 
                  language: { code: "pt_br" },
                  components: [
                    {
                      type: "body",
                        parameters: [
                          { type: "text", text: pesquisa[0].campus },
                          { type: "text", text: pesquisa[0].titulo }
                        ],
                    },
                  ],
                },
              },
              headers: { "Content-Type": "application/json" },
            }).catch(function (error) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            });
          } else { // send next question
            // increment index to next question
            poll_data.idx++;
            // get poll data
            const pesquisa = await egressosDAO.getPollbyId(client, poll_data.id_);
            let perguntas = pesquisa[0].perguntas[poll_data.idx];
            let opcoes = perguntas.opcoes;
            let s1 = '[{title: "Opções", rows:[';
            let s2 = [];
            opcoes.forEach(function (o, i) {
              s2.push(
                `{id:\"${
                  poll_data.id_ + poll_data.idx.toString() + i.toString()
                }\",title:\"${o.toString()}\"}`
              );
            });
            let s3 = "]}]";

            // send first question to a single egresso
            axios({
              method: "POST", // Required, HTTP method, a string, e.g. POST, GET
              url:
                "https://graph.facebook.com/" +
                version +
                "/" +
                phone_number_id +
                "/messages?access_token=" +
                token,
              data: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: poll_data.from,
                type: "interactive",
                interactive: {
                  type: "list",
                  header: {
                    type: "text",
                    text: pesquisa[0].titulo,
                  },
                  body: {
                    text: perguntas.descricao,
                  },
                  footer: {
                    text: "Campus " + pesquisa[0].campus,
                  },
                  action: {
                    button: "Qual sua opinião?",
                    sections: s1 + s2.toString() + s3,
                  },
                },
              },
              headers: { "Content-Type": "application/json" },
            }).catch(function (error) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            }); // end of axios function
          }
        } else {
          console.log("Falha ao armazenar resposta de egresso no BD!")
        }
      }// end if interactive
    } 
  res.sendStatus(200);
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
});

// only for Cloud API confirmation
app.get("/webhook", (req, res) => {
  // token de verificação idêntico ao "Verificar token" cadastrado
  // no Painel de Aplicativos da Meta
  const verify_token = process.env.VERIFY_TOKEN;

  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];
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
      console.log("ERROR checking webhook Soul_IF ");
    }
  }
});
