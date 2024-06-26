import {
  atualizaDocumento,
  encontrarDocumento,
  obterDocumentos,
  adicionarDocumento,
  excluirDocumento,
} from "./documentosDb.js";
import io from "./server.js";

// manipulador de eventos para a conexão de novos clientes.
io.on("connection", (socket) => {
  socket.on("obter_documentos", async (devolverDocs) => {
    const documentos = await obterDocumentos();
    devolverDocs(documentos);
  });

  socket.on("adicionar_documento", async (nomeDoDocumento) => {
    const documentoExiste =
      (await encontrarDocumento(nomeDoDocumento)) !== null;

    if (documentoExiste) {
      socket.emit("documento_existente", nomeDoDocumento);
    } else {
      const resultado = await adicionarDocumento(nomeDoDocumento);

      if (resultado.acknowledged) {
        io.emit("adicionar_documento_interface", nomeDoDocumento);
      }
    }
  });

  socket.on("selecionar_documento", async (nomeDoDocumento, devolverTexto) => {
    socket.join(nomeDoDocumento);

    const documento = await encontrarDocumento(nomeDoDocumento);
    if (documento) {
      devolverTexto(documento.texto);
    }
  });

  // Define um manipulador de eventos para o evento 'texto_editor' recebido do cliente.
  socket.on("texto_editor", ({ texto, nomeDocumento }) => {
    const atualizacao = atualizaDocumento(nomeDocumento, texto);

    if (atualizacao.modifiedCount) {
      socket.to(nomeDocumento).emit("texto_editor_clientes", texto);
    }
  });

  socket.on("excluir_documento", async (nome) => {
    const exclusao = await excluirDocumento(nome);
    if (exclusao.deletedCount) {
      io.emit("excluir_documento_interface", nome);
    }
  });
});
