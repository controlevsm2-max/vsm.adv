// Configuração da API
const API_URL = 'https://washing-become-symbols-coupons.trycloudflare.com';

// ================== FUNÇÕES DO MODAL ==================
function abrirNovo() {
    document.getElementById('formMaster').reset();
    document.getElementById('field_id').value = '';
    document.getElementById('group_cancelamento').classList.add('hidden');
    document.getElementById('modalMaster').classList.remove('hidden');
    
    // Data atual automática
    const hoje = new Date().toISOString().split('T')[0];
    document.getElementById('field_entrada').value = hoje;
}

function abrirEditar(cliente) {
    document.getElementById('field_id').value = cliente.id;
    document.getElementById('field_pasta').value = cliente.pasta;
    document.getElementById('field_cliente').value = cliente.cliente;
    document.getElementById('field_cpf').value = cliente.cpf_cnpj || '';
    
    // Formatar valor para exibição
    const valorFormatado = 'R$ ' + parseFloat(cliente.valor_contrato || 0)
        .toFixed(2)
        .replace('.', ',')
        .replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    document.getElementById('money_field').value = valorFormatado;
    
    document.getElementById('field_exito').value = cliente.percentual_exito || 0;
    document.getElementById('field_servico').value = cliente.tipo_servico || '';
    document.getElementById('field_grupo').value = cliente.grupo;
    document.getElementById('field_entrada').value = cliente.data_entrada;
    document.getElementById('field_status').value = cliente.status;
    document.getElementById('field_saida').value = cliente.data_saida || '';
    
    if (cliente.status === 'Cancelado') {
        document.getElementById('group_cancelamento').classList.remove('hidden');
    } else {
        document.getElementById('group_cancelamento').classList.add('hidden');
    }
    
    document.getElementById('modalMaster').classList.remove('hidden');
}

function fecharModal() {
    document.getElementById('modalMaster').classList.add('hidden');
}

function toggleCancelamento(valor) {
    if (valor === 'Cancelado') {
        document.getElementById('group_cancelamento').classList.remove('hidden');
        // Sugerir data de hoje para cancelamento
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('field_saida').value = hoje;
    } else {
        document.getElementById('group_cancelamento').classList.add('hidden');
    }
}

// ================== FUNÇÕES DE MÁSCARA ==================
function mascararCPF(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length <= 11) {
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    input.value = value;
}

function mascararDinheiro() {
    const moneyField = document.getElementById('money_field');
    if (moneyField) {
        moneyField.addEventListener('input', function(e) {
            let value = e.target.value.replace(/\D/g, '');
            if (value === '') {
                e.target.value = '';
                return;
            }
            value = (parseInt(value) / 100).toFixed(2);
            value = value.replace('.', ',');
            value = 'R$ ' + value.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
            e.target.value = value;
        });
    }
}

// ================== FUNÇÕES CRUD ==================
async function carregarDados() {
    try {
        const response = await fetch(API_URL);
        const clientes = await response.json();
        renderizarTabela(clientes);
        
        // Mostrar total no console
        console.log(`📊 Total de clientes carregados: ${clientes.length}`);
    } catch (error) {
        showAlert('Erro ao carregar dados: ' + error.message, 'error');
    }
}

function renderizarTabela(lista) {
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';

    if (lista.length === 0) {
        corpo.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 40px;">Nenhum cliente encontrado</td></tr>';
        return;
    }

    lista.forEach((cli) => {
        const isCancelado = cli.status === 'Cancelado';
        const dataRef = isCancelado ? cli.data_saida : cli.data_entrada;
        const dataFormatada = dataRef ? new Date(dataRef).toLocaleDateString('pt-BR') : '00/00/0000';
        
        const valorFormatado = parseFloat(cli.valor_contrato || 0).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });

        // Remover acentos para a classe CSS
        const statusClass = cli.status
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        corpo.innerHTML += `
            <tr>
                <td><strong>#${cli.pasta}</strong></td>
                <td>
                    <strong>${cli.cliente}</strong>
                    <br><small style="color:#64748b;">${cli.cpf_cnpj || 'Sem CPF'}</small>
                </td>
                <td><strong>R$ ${valorFormatado}</strong></td>
                <td>${cli.percentual_exito || 0}%</td>
                <td>${cli.tipo_servico || '-'}</td>
                <td class="text-center">
                    <span class="status st-${statusClass}">${cli.status}</span>
                </td>
                <td class="text-center"><strong>${cli.grupo}</strong></td>
                <td style="${isCancelado ? 'color:#ef4444; font-weight:bold;' : ''}">
                    ${dataFormatada}
                </td>
                <td>
                    <button onclick='abrirEditar(${JSON.stringify(cli).replace(/'/g, "&#39;")})' 
                            class="action-btn edit" 
                            title="Editar">
                        <i class="fas fa-pencil-alt"></i>
                    </button>
                    <button onclick='excluirCliente(${cli.id})' 
                            class="action-btn delete" 
                            title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
    });
}

// Salvar cliente
document.getElementById('formMaster').onsubmit = async function(e) {
    e.preventDefault();
    
    // Processar valor do dinheiro
    let valorContrato = 0;
    const moneyValue = document.getElementById('money_field').value;
    if (moneyValue) {
        valorContrato = parseFloat(
            moneyValue.replace('R$ ', '')
                     .replace(/\./g, '')
                     .replace(',', '.')
        ) || 0;
    }

    const dados = {
        pasta: parseInt(document.getElementById('field_pasta').value) || 0,
        cliente: document.getElementById('field_cliente').value.toUpperCase(),
        cpf_cnpj: document.getElementById('field_cpf').value || '',
        valor_contrato: valorContrato,
        percentual_exito: parseInt(document.getElementById('field_exito').value) || 0,
        tipo_servico: document.getElementById('field_servico').value.toUpperCase() || '',
        grupo: document.getElementById('field_grupo').value.toUpperCase(),
        data_entrada: document.getElementById('field_entrada').value || null,
        status: document.getElementById('field_status').value,
        data_saida: document.getElementById('field_saida').value || null
    };

    const id = document.getElementById('field_id').value;
    const url = id ? `${API_URL}/${id}` : API_URL;
    const method = id ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        if (response.ok) {
            fecharModal();
            carregarDados();
            showAlert(id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
        } else {
            const erro = await response.json();
            showAlert('Erro: ' + erro.error, 'error');
        }
    } catch (error) {
        showAlert('Erro ao salvar: ' + error.message, 'error');
    }
};

// Excluir cliente
async function excluirCliente(id) {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                carregarDados();
                showAlert('Cliente excluído com sucesso!', 'success');
            }
        } catch (error) {
            showAlert('Erro ao excluir: ' + error.message, 'error');
        }
    }
}

// ================== FUNÇÃO DE BUSCA ==================
async function buscarTabela() {
    const termo = document.getElementById('inputBusca').value.toLowerCase();
    
    if (termo.length < 2) {
        carregarDados();
        return;
    }
    
    try {
        const response = await fetch(API_URL);
        const clientes = await response.json();
        
        const filtrados = clientes.filter(cli => 
            cli.cliente.toLowerCase().includes(termo) ||
            (cli.cpf_cnpj && cli.cpf_cnpj.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))) ||
            cli.pasta.toString().includes(termo) ||
            (cli.tipo_servico && cli.tipo_servico.toLowerCase().includes(termo)) ||
            (cli.grupo && cli.grupo.toLowerCase().includes(termo))
        );
        
        renderizarTabela(filtrados);
        
        if (filtrados.length === 0) {
            showAlert('Nenhum resultado encontrado', 'info');
        }
    } catch (error) {
        showAlert('Erro na busca', 'error');
    }
}

// ================== ALERT PERSONALIZADO ==================
function showAlert(mensagem, tipo = 'success') {
    const alert = document.getElementById('customAlert');
    
    const cores = {
        success: '#10b981',
        error: '#ef4444',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    
    alert.style.display = 'block';
    alert.style.background = cores[tipo] || cores.success;
    alert.textContent = mensagem;
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 3000);
}

// ================== INICIALIZAÇÃO ==================
document.addEventListener('DOMContentLoaded', function() {
    mascararDinheiro();
    carregarDados();
    
    // Permitir fechar modal com ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModal();
        }
    });
    
    // Mostrar total de clientes
    fetch(`${API_URL}/total`)
        .then(r => r.json())
        .then(data => {
            console.log(`📊 Total no banco: ${data.total} clientes`);
        })
        .catch(console.error);
});