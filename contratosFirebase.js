const firebaseConfig = {
    apiKey: "AIzaSyCRH-aApTh2ZKUsyhzBUvtK3MnxFDvEfEA",
    authDomain: "dlaw-manager.firebaseapp.com",
    databaseURL: "https://dlaw-manager.firebaseio.com",
    projectId: "dlaw-manager",
    storageBucket: "dlaw-manager.firebasestorage.app",
    messagingSenderId: "510108987774",
    appId: "1:510108987774:web:b00cb80a0aa63f74"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Inicializar Firestore
const db = firebase.firestore();

// Inicializar Authentication (opcional)
const auth = firebase.auth();

// Para desenvolvimento local com emulador (opcional)
// Descomente as linhas abaixo se estiver usando o emulador do Firestore
/*
if (location.hostname === 'localhost') {
  db.useEmulator('localhost', 8080);
}
*/

// Exemplos de operações básicas com CDN:

// Adicionar documento
const adicionarDocumento = async (nome, data, descItens) => {
    try {
        const docRef = await db.collection("loca-contratos").add({
            nome: nome,
            data: data,
            itens: descItens
        });
        console.log("Documento adicionado com ID: ", docRef.id);
    } catch (e) {
        console.error("Erro ao adicionar documento: ", e);
    }
};

// Ler documento específico
const lerDocumento = async (id) => {
    try {
        const docRef = db.collection("loca-contratos").doc(id);
        const doc = await docRef.get();

        if (doc.exists) {
            console.log("Dados do documento:", doc.data());
        } else {
            console.log("Documento não encontrado!");
        }
    } catch (e) {
        console.error("Erro ao ler documento: ", e);
    }
};

// Ler todos os documentos de uma coleção
const lerTodosDocumentos = async () => {
    try {
        const querySnapshot = await db.collection("loca-contratos").get();
        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (e) {
        console.error("Erro ao ler documentos: ", e);
    }
};

// Query com filtros
const buscarContrato = async () => {
    try {
        const querySnapshot = await db.collection("loca-contratos")
            .where("idade", ">=", 18)
            .orderBy("nome")
            .limit(10)
            .get();

        querySnapshot.forEach((doc) => {
            console.log(doc.id, " => ", doc.data());
        });
    } catch (e) {
        console.error("Erro na busca: ", e);
    }
};

// Atualizar documento
const atualizarDocumento = async (id) => {
    try {
        const docRef = db.collection("loca-contratos").doc(id);
        await docRef.update({
            nome: "João",
            data: "joao@email.com",
        });
        console.log("Documento atualizado com sucesso!");
    } catch (e) {
        console.error("Erro ao atualizar documento: ", e);
    }
};

// Deletar documento
const deletarDocumento = async (id) => {
    try {
        await db.collection("loca-contratos").doc(id).delete();
        console.log("Documento deletado com sucesso!");
    } catch (e) {
        console.error("Erro ao deletar documento: ", e);
    }
};

// Escutar mudanças em tempo real
const escutarMudancas = () => {
    const unsubscribe = db.collection("loca-contratos")
        .onSnapshot((querySnapshot) => {
            console.log("Mudanças detectadas:");
            querySnapshot.docChanges().forEach((change) => {
                if (change.type === "added") {
                    console.log("Novo: ", change.doc.data());
                }
                if (change.type === "modified") {
                    console.log("Modificado: ", change.doc.data());
                }
                if (change.type === "removed") {
                    console.log("Removido: ", change.doc.data());
                }
            });
        });

    // Para parar de escutar: unsubscribe();
    return unsubscribe;
};