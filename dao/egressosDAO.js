class egressosDAO {
  // get new users list
  static async getNewUsers(client) {
    const cursor = await client
      .db("soul_if_project")
      .collection("egressos")
      .find({ aceita: -1 })
      .project({
        nome: 1,
        matricula: 1,
        curso: 1,
        campus: 1,
        telefone: 1,
        _id: 0,
      });
    try {
      const results = await cursor.toArray();
      return results;
    } catch (err) {
      console.log(err);
    }
  }

  // get list of active students
  static async getActiveUsers(client) {
    const cursor = await client
      .db("soul_if_project")
      .collection("egressos")
      .find({ aceita: 1 })
      .project({
        nome: 1,
        matricula: 1,
        curso: 1,
        campus: 1,
        telefone: 1,
        _id: 0,
        wa_id: 1,
      });
    try {
      const results = await cursor.toArray();
      return results;
    } catch (err) {
      console.log(err);
    }
  }

  // set the user acceptance to take part on a poll
  static async setUserAcceptance(client, from_, status_) {
    let from = from_;
    let status = status_;
    let telefone = from_.substring(from_.length - 8);

    const data_atual = new Date();

    try {
      const results = await client
        .db("soul_if_project")
        .collection("egressos")
        .updateOne(
          { telefone: { $regex: telefone + "$" } },
          { $set: { aceita: status, ultima_pesquisa: data_atual, wa_id: from } }
        );
      if (results.modifiedCount === 1) {
        console.log(`User with phone ${telefone} set active.`);
      } else {
        console.log(`Error setting user acceptance with phone ${telefone}.`);
      }
    } catch (err) {
      console.log(err);
    }
  }
  // get poll data using id
  static async getPollbyId(client, id_) {
    const cursor = await client
      .db("soul_if_project")
      .collection("pesquisas")
      .find({ id: id_ })
      .project({ perguntas: 1, _id: 0, campus: 1, titulo: 1, descricao: 1 })
      .toArray();
    try {
      return cursor;
    } catch (err) {
      console.log(err);
    }
  }

  static async isLastQuestionPoll(client, id_, idx_) {
    let last;
    const cursor = await client
      .db("soul_if_project")
      .collection("pesquisas")
      .find({ id: id_ })
      .project({ _id: 0, l: { $size: "$perguntas" } })
      .toArray();

    if (cursor[0].l - idx_ === 1) {
      last = 1;
    } else {
      last = 0;
    }
    try {
      return { last: last };
    } catch (err) {
      console.log(err);
    }
  }

  static async updatePollReply(client, data_) {
    const cursor = await client
      .db("soul_if_project")
      .collection("pesquisas")
      .updateOne(
        { id: data_.id_ },
        {
          $push: {
            respostas: {
              wa_id: data_.from,
              ts: new Date(),
              opcao: { pergunta: data_.idx, resposta: data_.choice },
            },
          },
        }
      );
    try {
      return cursor;
    } catch (err) {
      console.log(err);
    }
  }
  
  static async updatePollReply2(client, data_) {
    const cursor = await client
      .db("soul_if_project")
      .collection("respostas")
      .insertOne(
        {
          id: data_.id_,
          wa_id: data_.from,
          ts: new Date(),
          pergunta: data_.idx,
          resposta: data_.choice
        }
      );
    try {
      return cursor;
    } catch (err) {
      console.log(err);
    }
  }
  
}

module.exports = egressosDAO;
