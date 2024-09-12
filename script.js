import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

// Função para formatar a data no formato Dia/Mês/Ano
function formatarData(data) {
    const dia = String(data.getDate()).padStart(2, '0'); // Adiciona zero à esquerda se necessário
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Adiciona zero à esquerda no mês
    const ano = data.getFullYear(); // Ano completo com 4 dígitos
    return `${dia}/${mes}/${ano}`;
}

// Configurações do Firebase
const configuracaoFirebase = {
    apiKey: "AIzaSyCS7_vKtYKJfIK2B_rY-6Li4qGONysAYbw",
    authDomain: "organizeja-27c38.firebaseapp.com",
    projectId: "organizeja-27c38",
    storageBucket: "organizeja-27c38.appspot.com",
    messagingSenderId: "161096968948",
    appId: "1:161096968948:web:cbe33ad523f413a04a8ca1"
};

// Inicializar Firebase
const app = initializeApp(configuracaoFirebase);
const db = getFirestore(app);
const auth = getAuth(app);

let usuarioAtual = null;

// Função de autenticação de usuários
document.getElementById('formLogin').addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const email = document.getElementById('inputEmail').value;
    const senha = document.getElementById('inputSenha').value;
    try {
        await signInWithEmailAndPassword(auth, email, senha);
        alert('Login bem-sucedido!');
    } catch (erro) {
        console.error('Erro ao fazer login:', erro);
        alert('Erro ao fazer login. Verifique suas credenciais.');
    }
});

// Função de cadastro de novos usuários
document.getElementById('botaoCadastro').addEventListener('click', async function () {
    const email = prompt('Digite seu e-mail:');
    const senha = prompt('Digite sua senha:');
    if (email && senha) {
        try {
            await createUserWithEmailAndPassword(auth, email, senha);
            alert('Cadastro realizado com sucesso!');
        } catch (erro) {
            console.error('Erro ao cadastrar usuário:', erro);
            alert('Erro ao cadastrar usuário. Erro: ' + erro.message);
        }
    }
});

// Função de logout
document.getElementById('botaoLogout').addEventListener('click', async function () {
    try {
        await signOut(auth);
        alert('Logout realizado com sucesso!');
    } catch (erro) {
        console.error('Erro ao fazer logout:', erro);
        alert('Erro ao fazer logout.');
    }
});

// Verifica se há um usuário autenticado
onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        usuarioAtual = usuario.uid;
        document.getElementById('authContainer').style.display = 'none';
        document.getElementById('crudContainer').style.display = 'block';
        carregarEventos();
    } else {
        usuarioAtual = null;
        document.getElementById('authContainer').style.display = 'block';
        document.getElementById('crudContainer').style.display = 'none';
    }
});

// Função para adicionar evento
document.getElementById('formEvento').addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const nome = document.getElementById('inputNome').value;
    const descricao = document.getElementById('inputDescricao').value;
    const data = document.getElementById('inputData').value;
    const horario = document.getElementById('inputHorario').value;
    const local = document.getElementById('inputLocal').value;
    const participantes = document.getElementById('inputParticipantes').value.split(',').map(p => p.trim());

    try {
        await addDoc(collection(db, 'eventos'), {
            nome,
            descricao,
            data,
            horario,
            local,
            participantes,
            usuarioId: usuarioAtual
        });
        alert('Evento adicionado com sucesso!');
        document.getElementById('formEvento').reset();
        carregarEventos();
    } catch (erro) {
        console.error('Erro ao adicionar evento:', erro);
        alert('Erro ao adicionar evento. Tente novamente mais tarde.');
    }
});

// Função para editar evento
window.editarEvento = async function (id) {
    const modal = document.getElementById('modalEdicao');
    const span = document.getElementsByClassName('close')[0];
    const eventoId = document.getElementById('inputEventoId');
    const inputNome = document.getElementById('inputEditNome');
    const inputDescricao = document.getElementById('inputEditDescricao');
    const inputData = document.getElementById('inputEditData');
    const inputHorario = document.getElementById('inputEditHorario');
    const inputLocal = document.getElementById('inputEditLocal');
    const inputParticipantes = document.getElementById('inputEditParticipantes');

    modal.style.display = 'flex';

    span.onclick = function () {
        modal.style.display = 'none';
    }

    window.onclick = function (event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    }

    if (id) {
        try {
            const eventoRef = doc(db, 'eventos', id);
            const eventoSnap = await getDoc(eventoRef);
            if (eventoSnap.exists()) {
                const evento = eventoSnap.data();
                if (evento.usuarioId === usuarioAtual) { // Verifica se o evento pertence ao usuário atual
                    eventoId.value = id;
                    inputNome.value = evento.nome;
                    inputDescricao.value = evento.descricao;
                    inputData.value = evento.data;
                    inputHorario.value = evento.horario;
                    inputLocal.value = evento.local;
                    inputParticipantes.value = evento.participantes.join(', ');
                } else {
                    alert('Você não tem permissão para editar este evento.');
                    modal.style.display = 'none';
                }
            }
        } catch (erro) {
            console.error('Erro ao carregar dados do evento:', erro);
            alert('Erro ao carregar dados do evento.');
        }
    }
}

// Função para excluir evento
window.excluirEvento = async function (id) {
    const confirmar = confirm('Tem certeza de que deseja excluir este evento?');
    if (confirmar) {
        try {
            const eventoRef = doc(db, 'eventos', id);
            const eventoSnap = await getDoc(eventoRef);
            if (eventoSnap.exists()) {
                const evento = eventoSnap.data();
                if (evento.usuarioId === usuarioAtual) { // Verifica se o evento pertence ao usuário atual
                    await deleteDoc(eventoRef);
                    alert('Evento excluído com sucesso!');
                    carregarEventos();
                } else {
                    alert('Você não tem permissão para excluir este evento.');
                }
            }
        } catch (erro) {
            console.error('Erro ao excluir evento:', erro);
            alert('Erro ao excluir evento. Tente novamente mais tarde.');
        }
    }
}

// Função para salvar alterações do evento
document.getElementById('formEditEvento').addEventListener('submit', async function (evento) {
    evento.preventDefault();
    const id = document.getElementById('inputEventoId').value;
    const nome = document.getElementById('inputEditNome').value;
    const descricao = document.getElementById('inputEditDescricao').value;
    let data = document.getElementById('inputEditData').value;
    const horario = document.getElementById('inputEditHorario').value;
    const local = document.getElementById('inputEditLocal').value;
    const participantes = document.getElementById('inputEditParticipantes').value.split(',').map(p => p.trim());

    try {
        const eventoRef = doc(db, 'eventos', id);
        const eventoSnap = await getDoc(eventoRef);
        if (eventoSnap.exists()) {
            const evento = eventoSnap.data();
            if (evento.usuarioId === usuarioAtual) { // Verifica se o evento pertence ao usuário atual
                await updateDoc(eventoRef, {
                    nome,
                    descricao,
                    data,
                    horario,
                    local,
                    participantes
                });
                alert('Evento atualizado com sucesso!');
                document.getElementById('modalEdicao').style.display = 'none';
                carregarEventos();
            } else {
                alert('Você não tem permissão para atualizar este evento.');
                document.getElementById('modalEdicao').style.display = 'none';
            }
        }
    } catch (erro) {
        console.error('Erro ao atualizar evento:', erro);
        alert('Erro ao atualizar evento. Tente novamente mais tarde.');
    }
});



// Função para carregar eventos do usuário atual
async function carregarEventos() {
    const containerEventos = document.getElementById('containerEventos');
    containerEventos.innerHTML = '';
    try {
        const eventosRef = collection(db, 'eventos');
        const q = query(eventosRef, where("usuarioId", "==", usuarioAtual));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
            const evento = doc.data();
            const id = doc.id;
            
            // Converte a string da data em um objeto Date
            const dataEvento = new Date(evento.data);

            // Formata a data no formato Dia/Mês/Ano
            const dataFormatada = formatarData(dataEvento);

            const eventoElement = document.createElement('div');
            eventoElement.className = 'event-item';
            eventoElement.innerHTML = `
                <h3>${evento.nome}</h3>
                <p><strong>Descrição:</strong> ${evento.descricao}</p>
                <p><strong>Data:</strong> ${dataFormatada}</p>
                <p><strong>Horário:</strong> ${evento.horario}</p>
                <p><strong>Local:</strong> ${evento.local}</p>
                <p><strong>Participantes:</strong> ${evento.participantes.join(', ')}</p>
                <button onclick="editarEvento('${id}')">Editar</button>
                <button onclick="excluirEvento('${id}')">Excluir</button>
            `;
            containerEventos.appendChild(eventoElement);
        });
    } catch (erro) {
        console.error('Erro ao carregar eventos:', erro);
        alert('Erro ao carregar eventos. Tente novamente mais tarde.');
    }
}

